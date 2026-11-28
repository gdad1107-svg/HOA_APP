#!/usr/bin/env node
// Work status scanner for the session orchestrator (.claude/skills/orchestrate).
//
// Read-only. Scans every local branch, worktree and open PR for requirements
// (REQ-NNN), defects (DEF-NNN), Sol Arch documents and QA test-case documents,
// works out where each item sits in the team's pipeline, and flags anything stuck,
// unlinked or out of order. It reads committed state from each branch with
// `git ls-tree` / `git show`, so work that has not been merged to main is seen too,
// and it reports uncommitted edits in each worktree separately.
//
// Usage:
//   node scripts/work-status.mjs              Markdown report on stdout
//   node scripts/work-status.mjs --json       JSON on stdout (for the orchestrator)
//   node scripts/work-status.mjs --out FILE   also write the Markdown report to FILE
//   node scripts/work-status.mjs --stale-days 3   days without a commit before a branch is "stale"
//
// It never writes to git, never fetches, never pushes. `gh` is optional: without it
// (or without auth) PR columns are left blank and the report says so.

import { execFileSync, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const AS_JSON = args.includes('--json');
const OUT = opt('--out', null);
const STALE_DAYS = Number(opt('--stale-days', 3));

const here = dirname(fileURLToPath(import.meta.url));
const run = (cmd, argv, cwd) =>
  execFileSync(cmd, argv, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 }).trim();
const tryRun = (cmd, argv, cwd) => {
  try { return run(cmd, argv, cwd); } catch { return null; }
};
// Async variant for calls that can run side by side (one per worktree, gh). Resolves to
// null on failure, like tryRun.
const execFileP = promisify(execFile);
const tryRunAsync = (cmd, argv, cwd) =>
  execFileP(cmd, argv, { cwd, maxBuffer: 64 * 1024 * 1024 }).then((r) => r.stdout.trim(), () => null);
const ROOT = run('git', ['rev-parse', '--show-toplevel'], here);
const git = (...a) => run('git', a, ROOT);
const tryGit = (...a) => tryRun('git', a, ROOT);

// Read many blobs with ONE `git cat-file --batch` instead of a `git show` per file.
// Returns Map<hash, text>.
function readBlobs(hashes) {
  const want = [...new Set(hashes.filter(Boolean))];
  const out = new Map();
  if (!want.length) return out;
  const buf = execFileSync('git', ['cat-file', '--batch'], { cwd: ROOT, input: want.join('\n') + '\n', maxBuffer: 256 * 1024 * 1024 });
  let pos = 0;
  while (pos < buf.length) {
    const nl = buf.indexOf(0x0a, pos);
    if (nl < 0) break;
    const [hash, type, size] = buf.subarray(pos, nl).toString('utf8').split(' ');
    if (type === 'missing' || size === undefined) { pos = nl + 1; continue; }
    const start = nl + 1, end = start + Number(size);
    out.set(hash, buf.subarray(start, end).toString('utf8'));
    pos = end + 1; // content is followed by a newline
  }
  return out;
}

const LOCAL_MAIN = tryGit('rev-parse', '--verify', '--quiet', 'refs/heads/main') ? 'main' : 'master';
// Compare against origin/<main> when it is ahead of the local branch (a PR merged on
// GitHub but not pulled yet); otherwise against the local branch. Never fetches:
// origin/<main> is only as fresh as the last fetch.
const ORIGIN_MAIN = `origin/${LOCAL_MAIN}`;
const hasOrigin = !!tryGit('rev-parse', '--verify', '--quiet', `refs/remotes/${ORIGIN_MAIN}`);
const localBehind = hasOrigin ? Number(tryGit('rev-list', '--count', `${LOCAL_MAIN}..${ORIGIN_MAIN}`) ?? 0) : 0;
const MAIN = localBehind > 0 ? ORIGIN_MAIN : LOCAL_MAIN;
const NOW = Date.now();
const DAY = 86400000;
const ageDays = (iso) => Math.floor((NOW - new Date(iso).getTime()) / DAY);

// ---------- branches, worktrees, PRs ----------

// %(ahead-behind:<ref>) (git 2.41+) gives every branch's counts in this one call; older
// git leaves it empty and we fall back to a rev-list per branch.
const branches = git('for-each-ref', 'refs/heads', `--format=%(refname:short)\t%(committerdate:iso-strict)\t%(ahead-behind:${MAIN})\t%(subject)`)
  .split('\n').filter(Boolean).map((line) => line.split('\t'))
  .filter(([name]) => name !== LOCAL_MAIN)
  .map(([name, date, ab, ...rest]) => {
    const subject = rest.join('\t');
    let [ahead, behind] = (ab ?? '').split(' ').map(Number);
    if (!Number.isFinite(ahead) || !Number.isFinite(behind)) {
      const lr = git('rev-list', '--left-right', '--count', `${MAIN}...${name}`).split(/\s+/).map(Number);
      behind = lr[0]; ahead = lr[1];
    }
    return { name, lastCommit: date, ageDays: ageDays(date), subject, ahead, behind, worktree: null, dirty: [], pr: null, files: [], commitText: '', ids: new Set() };
  });
const byBranch = Object.fromEntries(branches.map((b) => [b.name, b]));

// worktrees
let mainWorktree = null;
const wtRaw = git('worktree', 'list', '--porcelain');
for (const block of wtRaw.split(/\n\n+/)) {
  const path = /^worktree (.+)$/m.exec(block)?.[1];
  const br = /^branch refs\/heads\/(.+)$/m.exec(block)?.[1];
  if (path && br === LOCAL_MAIN) mainWorktree = path;
  if (!path || !br || !byBranch[br]) continue;
  byBranch[br].worktree = path;
}

// Every worktree's `git status`, the main checkout's and the PR list, all at once.
const toLines = (st) => (st ? st.split('\n').filter(Boolean).map((l) => l.slice(3)) : []);
const withWorktree = branches.filter((b) => b.worktree);
const [statuses, mainStatus, prJson] = await Promise.all([
  Promise.all(withWorktree.map((b) => tryRunAsync('git', ['status', '--porcelain'], b.worktree))),
  mainWorktree ? tryRunAsync('git', ['status', '--porcelain'], mainWorktree) : null,
  tryRunAsync('gh', ['pr', 'list', '--state', 'all', '--limit', '100', '--json', 'number,title,headRefName,state,isDraft,url,reviewDecision,updatedAt'], ROOT),
]);
withWorktree.forEach((b, i) => { b.dirty = toLines(statuses[i]); });

// PRs (optional)
let prNote = null;
if (prJson) {
  // newest PR per branch wins; an open one always beats a closed or merged one
  const rank = (p) => (p.state === 'OPEN' ? 1 : 0);
  for (const pr of JSON.parse(prJson)) {
    const b = byBranch[pr.headRefName];
    if (b && (!b.pr || rank(pr) > rank(b.pr) || (rank(pr) === rank(b.pr) && pr.updatedAt > b.pr.updatedAt))) b.pr = pr;
  }
} else {
  prNote = 'GitHub CLI unavailable or not signed in: PR state not checked.';
}

// what each unmerged branch touches and says
for (const b of branches) {
  if (b.ahead === 0) continue;
  b.files = git('diff', '--name-only', `${MAIN}...${b.name}`).split('\n').filter(Boolean);
  b.commitText = git('log', `${MAIN}..${b.name}`, '--format=%s%n%b');
}

// ---------- id extraction ----------

const pad = (n) => String(n).padStart(3, '0');
function idsIn(text) {
  const out = new Set();
  if (!text) return out;
  // ranges: "REQ-001 to REQ-004", "REQ-001–004", "req-001-004" (branch names)
  for (const m of text.matchAll(/\b(REQ|DEF)-(\d{3})\s*(?:to|–|—|-)\s*(?:\1-)?(\d{3})\b/gi)) {
    const kind = m[1].toUpperCase(), a = +m[2], z = +m[3];
    if (z > a && z - a <= 20) for (let n = a; n <= z; n++) out.add(`${kind}-${pad(n)}`);
  }
  for (const m of text.matchAll(/\b(REQ|DEF)-(\d{3})\b/gi)) out.add(`${m[1].toUpperCase()}-${m[2]}`);
  return out;
}
for (const b of branches) {
  for (const id of idsIn(b.name)) b.ids.add(id);
  for (const id of idsIn(b.commitText)) b.ids.add(id);
  for (const f of b.files) for (const id of idsIn(f.split('/').pop())) b.ids.add(id);
}

// ---------- documents on every branch ----------

const DOC_PATTERNS = [
  { kind: 'REQ', re: /^docs\/requirements\/(REQ-\d{3})[^/]*\.md$/ },
  { kind: 'DEF', re: /^docs\/defects\/(DEF-\d{3})[^/]*\.md$/ },
  { kind: 'SA', re: /^docs\/architecture\/((?:SA|CIA|REVIEW-REQ)-\d{3})[^/]*\.md$/ },
  { kind: 'ADR', re: /^docs\/architecture\/adr\/(ADR-\d{3})[^/]*\.md$/ },
  { kind: 'TC', re: /^docs\/test-cases\/(TC-[A-Z0-9]+)[^/]*\.md$/ },
];

// docs[id] = { kind, id, path, versions: [{branch, hash}], main: hash|null }
const docs = {};
for (const b of [{ name: MAIN }, ...branches.filter((x) => x.ahead > 0)]) {
  const tree = tryGit('ls-tree', '-r', b.name, '--', 'docs');
  if (!tree) continue;
  for (const line of tree.split('\n')) {
    const [meta, path] = line.split('\t');
    if (!path) continue;
    const hash = meta.split(/\s+/)[2];
    for (const p of DOC_PATTERNS) {
      const m = p.re.exec(path);
      if (!m) continue;
      const id = m[1];
      const d = (docs[id] ??= { kind: p.kind, id, path, versions: [], main: null });
      if (b.name === MAIN) { d.main = hash; d.path = path; }
      d.versions.push({ branch: b.name, hash, path });
    }
  }
}

const strip = (s) => s.replace(/<!--.*?-->/g, '').replace(/\*\*|`/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').trim();
function field(text, name) {
  // "| Status | x |", "| **Status** | x |" or "**Status:** x"
  const row = new RegExp(`^\\|\\s*(?:\\*\\*)?${name}(?:\\*\\*)?\\s*\\|\\s*(.+?)\\s*\\|\\s*$`, 'mi').exec(text);
  if (row) return strip(row[1]);
  const line = new RegExp(`^\\*\\*${name}:?\\*\\*:?\\s*(.+)$`, 'mi').exec(text);
  return line ? strip(line[1]) : null;
}
// Approved only when the status *starts* with Final / Approved / Accepted ("Final — approved
// by …", "Approved by the owner, …", an ADR's "Accepted"), optionally after a revision tag
// or a list of them ("r4 approved …", "v1, v1.1 and v1.2 approved …"). "Draft. Becomes final
// when …", "r4 draft" and "Draft v1, for owner approval" are not.
const REV = String.raw`(?:r\d+|v\d+(?:\.\d+)*)`;
const LEADING_REVS = new RegExp(String.raw`^${REV}(?:\s*(?:,|and|&)\s*${REV})*\s+`, 'i');
const isApproved = (s) => /^(final|approved|accepted)\b/i.test(strip(s ?? '').replace(LEADING_REVS, ''));
const firstToken = (s) => (s ? s.split(/[.:—–(]/)[0].trim() : null);
function tableRows(text, heading) {
  const i = text.search(new RegExp(`^##\\s+${heading}`, 'mi'));
  if (i < 0) return [];
  const body = text.slice(i).split('\n').slice(1);
  const rows = [];
  for (const l of body) {
    if (/^##\s/.test(l)) break;
    if (/^\|/.test(l) && !/^\|[\s|:-]+\|$/.test(l)) rows.push(l.split('|').slice(1, -1).map((c) => strip(c)));
  }
  return rows.slice(1); // drop header
}

// Every document version on main and on unmerged branches, read in one batch.
const BLOBS = readBlobs(Object.values(docs).flatMap((d) => [d.main, ...d.versions.map((v) => v.hash)]));

// pick the version to report: the newest branch that changed it, else main
function readDoc(d) {
  // Only count a branch whose own commits touch the file; a branch cut before main
  // moved carries an older copy, which is not a change.
  const changed = d.versions.filter((v) => v.branch !== MAIN && v.hash !== d.main && byBranch[v.branch].files.includes(v.path));
  changed.sort((x, y) => new Date(byBranch[y.branch].lastCommit) - new Date(byBranch[x.branch].lastCommit));
  const pick = changed[0] ?? d.versions.find((v) => v.branch === MAIN) ?? d.versions[0];
  const text = BLOBS.get(pick.hash) ?? git('show', `${pick.branch}:${pick.path}`);
  return {
    ...d,
    onMain: !!d.main,
    branch: pick.branch,
    changedOn: [...new Set(changed.map((v) => v.branch))],
    text,
    title: (/^#\s+(.+)$/m.exec(text)?.[1] ?? d.id).replace(/^[A-Z]+-\d+\s*[:—–-]\s*/, ''),
  };
}

const all = Object.values(docs).map(readDoc);
const reqDocs = all.filter((d) => d.kind === 'REQ');
const defDocs = all.filter((d) => d.kind === 'DEF');
const saDocs = all.filter((d) => d.kind === 'SA' || d.kind === 'ADR');
const tcDocs = all.filter((d) => d.kind === 'TC').map((d) => {
  // The item a plan tests is the FIRST REQ/DEF id (or range) in its "Source" row. Later ids
  // in that row are provenance ("r6 is REQ-001 r4's follow-up"), and other header rows
  // ("Depends on / precedent") name REQs it does not test either.
  const sourceRow = field(d.text, 'Source(?: REQ or DEF)?');
  const source = sourceRow && /\b(?:REQ|DEF)-\d{3}(?:\s*(?:to|–|—|-)\s*(?:(?:REQ|DEF)-)?\d{3}\b)?/i.exec(sourceRow)?.[0];
  const head = d.text.split('\n').slice(0, 25).join('\n');
  const status = field(d.text, 'Status');
  const tbdIn = (text) => (text.match(/\*\*Layer\*\*\s*TBD/gi) || []).length;
  // Gates (approved, triaged) are judged on main's copy; work on a branch is only "in progress"
  const mainText = d.onMain ? BLOBS.get(d.main) ?? git('show', `${MAIN}:${d.path}`) : null;
  return {
    ...d, sources: idsIn(source ?? head), status, approved: isApproved(status), tbd: tbdIn(d.text),
    approvedOnMain: mainText ? isApproved(field(mainText, 'Status')) : false,
    tbdOnMain: mainText ? tbdIn(mainText) : null,
    cases: (d.text.match(/^#{2,4}\s+TC-/gm) || []).length,
  };
});

const coverage = tryGit('show', `${MAIN}:docs/test-cases/COVERAGE-MAP.md`) ?? '';

// ---------- requirements ----------

const linkedBranches = (id) => branches.filter((b) => b.ids.has(id) && b.ahead > 0);
// "Code" means the app Dev builds. Docs, tests (QE's), the team's tooling (scripts/,
// .claude/) and repo config are not a build of a requirement, even when a commit message
// names one (a scanner fix that mentions "REQ-001 r4" is not REQ-001 being built).
const NOT_APP = [/^docs\//, /\.md$/i, /^tests\//, /^scripts\//, /^\.claude\//, /^\.github\//,
  /^package(-lock)?\.json$/, /^playwright\.config\.js$/, /^\.gitignore$/];
const isCode = (f) => !NOT_APP.some((re) => re.test(f));
const NOT_APP_PATHSPECS = [':!docs', ':!*.md', ':!tests', ':!scripts', ':!.claude', ':!.github',
  ':!package.json', ':!package-lock.json', ':!playwright.config.js', ':!.gitignore'];
// One log of main's commits that touch app code, instead of a `git log --grep` per
// requirement. Ids are matched exactly as idsIn reads them, ranges included.
const CODE_COMMIT_IDS = idsIn(tryGit('log', MAIN, '--format=%s%n%b', '--', '.', ...NOT_APP_PATHSPECS) ?? '');
const mergedCodeOnMain = (id) => CODE_COMMIT_IDS.has(id);

const requirements = reqDocs.map((d) => {
  const status = field(d.text, 'Status') ?? 'Unknown';
  const approved = isApproved(status);
  const deps = [...idsIn(field(d.text, 'Depends on') ?? '')].filter((x) => x !== d.id);
  const decisions = tableRows(d.text, 'Decisions for the owner');
  const saReviewed = /sol arch reviewed/i.test(status) || all.some((x) => x.id === `REVIEW-${d.id}`)
    || saDocs.some((x) => x.id.startsWith('CIA') && x.text.includes(d.id));
  const tc = tcDocs.filter((t) => t.sources.has(d.id));
  const tcApproved = tc.some((t) => t.approved);
  // QE starts only from a plan the owner approved that has landed on main
  const tcReady = tc.filter((t) => t.approvedOnMain);
  const qeTriaged = tcReady.length > 0 && tcReady.every((t) => t.tbdOnMain === 0);
  const branchesFor = linkedBranches(d.id);
  const buildBranches = branchesFor.filter((b) => b.files.some(isCode));
  const merged = mergedCodeOnMain(d.id);

  const steps = [
    ['Drafted', true, 'business-analyst'],
    ['Sol Arch review', saReviewed, 'sol-arch'],
    ['Owner approval', approved, 'owner'],
    ['QA test plan', tc.length > 0, 'qa'],
    ['Test plan needs owner approval and merge', tcReady.length > 0, 'owner'],
    ['QE triage', qeTriaged, 'qe'],
    ['Dev build', buildBranches.length > 0 || merged, 'dev'],
    ['Merged to main', merged, 'dev'],
  ];
  const nextIdx = steps.findIndex(([, done]) => !done);
  let stage = nextIdx < 0 ? 'Done' : steps[nextIdx][0];
  let next = nextIdx < 0 ? null : steps[nextIdx][2];
  const draftArch = [...new Set(d.text.match(/\b(?:SA|ADR|CIA)-\d{3}\b/g) || [])]
    .filter((x) => { const a = saDocs.find((s) => s.id === x); return a && !isApproved(field(a.text, 'Status')); });
  // Dev builds only from an approved design: until then the next move is the owner's
  if (stage === 'Dev build' && draftArch.length) { stage = 'Dev build (blocked: architecture not approved)'; next = 'owner'; }

  const flags = [];
  if (!approved && buildBranches.length) flags.push(`Code being built before owner approval (${buildBranches.map((b) => b.name).join(', ')})`);
  if (!d.onMain) flags.push(`Not on ${MAIN} yet: lives on ${d.branch}`);
  else if (d.changedOn.length) flags.push(`Newer revision on ${d.changedOn.join(', ')}, not on ${MAIN}`);
  for (const t of tc) {
    const where = t.changedOn.join(', ') || t.branch;
    if (!t.approved && !t.approvedOnMain) flags.push(`${t.id} waits for owner approval`);
    else if (!t.approvedOnMain) flags.push(`${t.id} approved but not merged (on ${where})`);
    else if (t.changedOn.length && t.tbd === 0 && t.tbdOnMain > 0) flags.push(`${t.id} QE triage done on ${where}, not merged`);
    else if (t.changedOn.length) flags.push(`${t.id} has unmerged changes on ${where}`);
  }
  if (decisions.length && !approved) flags.push(`${decisions.length} owner decision(s) open`);
  const unapprovedDeps = deps.filter((x) => { const r = reqDocs.find((q) => q.id === x); return !r || !isApproved(field(r.text, 'Status')); });
  if (buildBranches.length && unapprovedDeps.length) flags.push(`Build depends on unapproved ${unapprovedDeps.join(', ')}`);
  if (approved && tc.length === 0) flags.push('Approved but QA has no test plan yet');
  if (approved && draftArch.length && !merged) flags.push(`Relies on architecture not yet approved: ${draftArch.join(', ')} (Dev builds only from an approved design)`);
  if (tc.length && !tcApproved && buildBranches.length) flags.push('Test-case document not yet approved by the owner');

  return {
    id: d.id, title: d.title, status: firstToken(status), statusFull: status, approved, deps,
    decisions: decisions.map((r) => r[1] ?? r[0]), stage, next, steps: steps.map(([n, done]) => ({ step: n, done: !!done })),
    branch: d.branch, onMain: d.onMain, branches: branchesFor.map((b) => b.name), testCases: tc.map((t) => t.id), flags,
    done: stage === 'Done',
  };
}).sort((a, b) => a.id.localeCompare(b.id));

// ---------- defects ----------

const defects = defDocs.map((d) => {
  const status = firstToken(field(d.text, 'Status')) ?? 'Unknown';
  const severity = firstToken(field(d.text, 'Severity')) ?? 'Unknown';
  const reported = field(d.text, 'Date');
  const fixBranches = linkedBranches(d.id);
  const failing = new RegExp(`Failing:\\s*${d.id}`, 'i').test(coverage);
  const closed = /^(closed|won't fix|not a defect)/i.test(status);
  let stage, next;
  if (closed) { stage = status; next = null; }
  else if (/^resolved/i.test(status)) { stage = 'Awaiting QE re-test'; next = 'qe'; }
  else if (fixBranches.length) { stage = 'Fix in progress'; next = 'dev'; }
  else { stage = 'Open, unassigned'; next = 'dev'; }

  const flags = [];
  if (!closed && /critical|major/i.test(severity) && !fixBranches.length && !/^resolved/i.test(status)) flags.push(`${severity} defect with no fix branch`);
  if (failing && !closed) flags.push('A test is failing on this defect (coverage map)');
  if (!d.onMain) flags.push(`Report not on ${MAIN} yet: lives on ${d.branch}`);
  if (/^resolved/i.test(status) && fixBranches.some((b) => b.ahead > 0)) flags.push('Marked Resolved but the fix is not merged');
  const age = reported && !isNaN(new Date(reported)) ? ageDays(reported) : null;
  if (age !== null && age > 7 && !closed) flags.push(`Open ${age} days`);

  return { id: d.id, title: d.title, status, severity, reported, ageDays: age, stage, next, branches: fixBranches.map((b) => b.name), flags, done: closed };
}).sort((a, b) => a.id.localeCompare(b.id));

// ---------- architecture docs ----------

const architecture = saDocs.map((d) => ({
  id: d.id, title: d.title, status: firstToken(field(d.text, 'Status')) ?? 'Unknown', onMain: d.onMain, branch: d.branch,
  approved: isApproved(field(d.text, 'Status')),
})).sort((a, b) => a.id.localeCompare(b.id));

// ---------- branch-level flags ----------

const knownIds = new Set([...requirements.map((r) => r.id), ...defects.map((d) => d.id)]);
const branchReport = branches.filter((b) => b.name !== MAIN).map((b) => {
  const flags = [];
  const docOnly = b.files.length > 0 && !b.files.some(isCode);
  if (b.ahead === 0 && !b.dirty.length) flags.push(`No commits beyond ${MAIN} (merged, or not started); removable if nobody is using it`);
  if (b.ahead > 0 && b.ageDays >= STALE_DAYS) flags.push(`No commit for ${b.ageDays} days`);
  const prOpen = b.pr?.state === 'OPEN';
  if (b.ahead > 0 && !prOpen && prJson) flags.push(b.pr?.state === 'MERGED'
    ? `PR #${b.pr.number} merged, but ${b.ahead} commit(s) on the branch are not in ${MAIN}`
    : 'Unmerged work with no open PR');
  if (b.behind > 0 && b.ahead > 0) flags.push(`${b.behind} commit(s) behind ${MAIN}`);
  if (b.dirty.length) flags.push(`${b.dirty.length} uncommitted file(s) in worktree`);
  if (b.ahead > 0 && !b.worktree) flags.push('No worktree checked out');
  const ids = [...b.ids];
  if (b.ahead > 0 && /^fix\//.test(b.name) && !ids.some((x) => x.startsWith('DEF-'))) flags.push('Fix branch with no DEF report (Dev rule: every fix has a defect report)');
  if (b.ahead > 0 && /^feature\//.test(b.name) && !ids.some((x) => x.startsWith('REQ-'))) flags.push('Feature branch not linked to a REQ');
  for (const x of ids) if (!knownIds.has(x)) flags.push(`Mentions ${x}, which has no document`);
  const touchesMain = b.files.includes('index.html'), touchesBrand = b.files.includes('gentri-heights/index.html');
  if (touchesMain !== touchesBrand)
    flags.push('Changes one HOA build but not the other (index.html vs gentri-heights/index.html)');
  return {
    name: b.name, worktree: b.worktree, ahead: b.ahead, behind: b.behind, lastCommit: b.lastCommit, ageDays: b.ageDays,
    subject: b.subject, pr: b.pr ? { number: b.pr.number, state: b.pr.state, draft: b.pr.isDraft, url: b.pr.url, review: b.pr.reviewDecision } : null,
    ids, kind: docOnly ? 'docs' : b.files.length ? 'code' : 'none', dirty: b.dirty, flags,
  };
});

// uncommitted edits in the main checkout (nobody should be editing there)
const mainDirty = (mainStatus ?? '').split('\n').filter(Boolean); // fetched with the worktrees above

const report = {
  generatedAt: new Date(NOW).toISOString(), root: ROOT, main: MAIN, prNote,
  localMainBehind: localBehind,
  mainDirty: mainDirty.map((l) => l.slice(3)),
  requirements, defects, architecture, branches: branchReport,
  testCases: tcDocs.map((t) => ({ id: t.id, title: t.title, sources: [...t.sources], cases: t.cases, layerTbd: t.tbd, onMain: t.onMain })),
};

// ---------- output ----------

const ROLE = { 'business-analyst': 'BA', 'sol-arch': 'Sol Arch', owner: 'Owner', qa: 'QA', qe: 'QE', dev: 'Dev' };
const cell = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
function markdown(r) {
  const L = [];
  const openReq = r.requirements.filter((x) => !x.done);
  const openDef = r.defects.filter((x) => !x.done);
  L.push(`# Work in progress`, '');
  L.push(`Generated ${r.generatedAt.slice(0, 16).replace('T', ' ')} UTC from every local branch and worktree. Read-only snapshot; re-run \`node scripts/work-status.mjs\`.`, '');
  L.push(`**${openReq.length}** requirement(s) in progress · **${openDef.length}** defect(s) open · **${r.branches.filter((b) => b.ahead > 0).length}** unmerged branch(es)`, '');
  if (r.prNote) L.push(`> ${r.prNote}`, '');
  if (r.localMainBehind) L.push(`> Local ${LOCAL_MAIN} is ${r.localMainBehind} commit(s) behind ${r.main}; compared against ${r.main}. Pull ${LOCAL_MAIN} before branching.`, '');
  if (r.mainDirty.length) L.push(`> **Warning:** ${r.mainDirty.length} uncommitted file(s) in the ${r.main} checkout. Nobody should edit on ${r.main}.`, '');

  const ownerItems = [
    ...openReq.filter((x) => x.next === 'owner').map((x) => `${x.id} ${x.title}: ${x.stage}`),
    ...r.architecture.filter((a) => !a.approved).map((a) => `${a.id} ${a.title}: ${a.status}${a.onMain ? '' : ` (on ${a.branch})`}`),
  ];
  L.push('## Waiting on the owner', '');
  L.push(...(ownerItems.length ? ownerItems.map((x) => `- ${x}`) : ['- Nothing']), '');

  L.push('## Requirements', '');
  if (!openReq.length) L.push('None in progress.', '');
  else {
    L.push('| ID | Title | Status | Stage | Next | Branch / PR | Flags |', '|---|---|---|---|---|---|---|');
    for (const x of openReq) {
      const br = x.branches.map((n) => { const b = r.branches.find((y) => y.name === n); return b?.pr ? `${n} (PR #${b.pr.number}${b.pr.draft ? ' draft' : ''})` : n; }).join(', ') || (x.onMain ? r.main : x.branch);
      L.push(`| ${x.id} | ${cell(x.title)} | ${cell(x.status)} | ${x.stage} | ${ROLE[x.next] ?? '—'} | ${cell(br)} | ${cell(x.flags.join('; ')) || '—'} |`);
    }
    L.push('');
  }
  const doneReq = r.requirements.filter((x) => x.done);
  if (doneReq.length) L.push(`Done: ${doneReq.map((x) => x.id).join(', ')}`, '');

  L.push('## Defects', '');
  if (!openDef.length) L.push('None open.', '');
  else {
    L.push('| ID | Title | Severity | Status | Stage | Next | Branch | Flags |', '|---|---|---|---|---|---|---|---|');
    const sev = { critical: 0, major: 1, medium: 2, low: 3 };
    for (const x of [...openDef].sort((a, b) => (sev[a.severity.toLowerCase()] ?? 9) - (sev[b.severity.toLowerCase()] ?? 9)))
      L.push(`| ${x.id} | ${cell(x.title)} | ${x.severity} | ${x.status} | ${x.stage} | ${ROLE[x.next] ?? '—'} | ${x.branches.join(', ') || '—'} | ${cell(x.flags.join('; ')) || '—'} |`);
    L.push('');
  }
  const doneDef = r.defects.filter((x) => x.done);
  if (doneDef.length) L.push(`Closed: ${doneDef.map((x) => x.id).join(', ')}`, '');

  if (r.architecture.length) {
    L.push('## Architecture documents', '', '| ID | Title | Status | Where |', '|---|---|---|---|');
    for (const a of r.architecture) L.push(`| ${a.id} | ${cell(a.title)} | ${cell(a.status)} | ${a.onMain ? r.main : a.branch} |`);
    L.push('');
  }

  L.push('## Branches and worktrees', '', '| Branch | Kind | Ahead / behind | Last commit | PR | Worktree | Items | Flags |', '|---|---|---|---|---|---|---|---|');
  for (const b of r.branches) {
    const pr = b.pr ? `#${b.pr.number} ${b.pr.draft ? 'draft' : b.pr.state.toLowerCase()}` : '—';
    const wt = b.worktree ? b.worktree.split(/[\\/]/).pop() : '—';
    L.push(`| ${b.name} | ${b.kind} | ${b.ahead} / ${b.behind} | ${b.ageDays}d: ${cell(b.subject)} | ${pr} | ${wt} | ${b.ids.join(', ') || '—'} | ${cell(b.flags.join('; ')) || '—'} |`);
  }
  L.push('');
  return L.join('\n');
}

const md = markdown(report);
if (OUT) { const p = resolve(process.cwd(), OUT); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, md + '\n'); }
process.stdout.write(AS_JSON ? JSON.stringify(report, null, 2) + '\n' : md + '\n');
