# REQ-004: Invite a homeowner and link them to a lot

| | |
|---|---|
| Raised by | Owner: "draft req-001 to 004 and have SA review it. I'll approve it tomorrow" (2026-11-28) |
| Epic | [EPIC-001 Access and households](../epics/EPIC-001-access-and-households.md) |
| Backlog story | [04 Invite a homeowner and link them to a lot](../backlog/BACKLOG.md#04-invite-a-homeowner-and-link-them-to-a-lot) |
| Status | **r5 approved** by the owner, 2026-11-28 ("Approve r4 and merge"; the gap-answer revision was drafted as r4 and renumbered r5 because main already had a REQ-004 r4, the `memberOf` follow-up), with owner decisions 6 to 9 as recommended. Sol Arch reviewed r5: supports with changes C-1 to C-6 (applied). History: r3 was **approved** by the owner, 2026-11-28 ("approve it"), with every recommendation accepted. Sol Arch reviewed r1: supports Option A in two steps, with changes (applied in r2) |
| Mockup | Screens 4A–4H of the [access and households mockup](https://claude.ai/artifact/KaNMpY53cLTtrk8HARZgUr) (comment there). r5 needs changes to 3A, 4A, 4E, 4F and 4G and new screens; see [Mockup (r5) changes needed](#r5-change-log). The published copy needs republishing after those edits. Repo copy: [req-001-004-access-mockup.html](../mockups/req-001-004-access-mockup.html) |
| Architecture | SA-001 §8.1 (household linking), ADR-004 and ADR-002 (email), Draft on branch `docs/sa-001-architecture` |
| Depends on | REQ-001, REQ-003 |
| Author / date | Business Analyst, 2026-11-28 |
| Revision | r1, 2026-11-28: first draft · r2, 2026-11-28: Sol Arch's corrections applied (codes stored hashed, per-account guess limit, queued not sent); expiry, bounces, D3 and sale privacy listed as owner decisions · r3, 2026-11-28: owner approval recorded; recommendations accepted · r4, 2026-11-28: `redeemInvite` and `removeMember` also keep `memberOf/{uid}` (requested by the S3 BA, TC-16 G-13 and TC-13 G-7; REQ-016) · **r5, 2026-11-28: QA's requirement gaps from TC-04 v1 answered (G-1 to G-33); owner decisions 6 to 9 added; Sol Arch's r5 changes C-1 to C-6 applied, and decision 9's recommendation revised after its cost note; see [r5 change log](#r5-change-log); owner approval recorded** |

**Reading r5:** new scenarios carry the tag `@r5-new` and changed ones `@r5-changed`. New or changed rows and lines elsewhere end with **(r5)**. Untagged text is unchanged from approved r3.

## Owner decisions

Rows 1 to 5 were approved by the owner on 2026-11-28 ("approve it"): every recommendation in the right-hand column is accepted. Row 5 was approved as a timing only ("decide before the payments REQ"); the choice itself is **still open and undecided**, and r5 does not settle it. Rows 6 to 9 are new in r5 and await the owner; the right-hand column is the BA's recommendation. Questions for the HOA board or the admin office under Open questions stay open.

| # | Decision | Approved / recommended |
|---|---|---|
| 1 | Option A (email plus printed slips, in two steps), B (printed slips only) or C (self-registration with proof) | **A in two steps**: slips first, email once the provider is chosen |
| 2 | Invitation expiry | **Settings, defaulting to 7 days for emailed invitations and 30 days for printed slips**, ending at the end of the day shown, Manila time |
| 3 | Emails that bounce after they were handed to the provider (for example a typo like "exmaple.com"). Showing these needs the provider's bounce reports | **Include in step 2** (about 0.5–1 extra day once the provider is chosen). Typos in 623 addresses are likely |
| 4 | D3 for R1: a person already linked to one lot enters a code for another | **Refuse in R1** with a message to ask the office; revisit with D3 |
| 5 | **Privacy after a sale** (RA 10173): once linked, a new owner would see the lot's history, including the previous owner's receipts and payment screenshots. Doesn't block this REQ | Decide **before the payments REQ**. Sol Arch's options: members see records from their link date only, or screenshots are visible only to the uploader and staff |
| 6 | **(r5, G-7)** Invitation expiry settings: who may change them, and whether R1 has a screen. r3 says "Treasurer, in Settings". REQ-002 gives admin office staff the non-financial Settings, and expiry is not financial, so the two approved REQs disagree. The mock-up's Settings screen has no expiry fields. | **Recommended: admin office staff and the treasurer, on a small "Invitations" card in Settings** (two number fields and Save; cheap, Sol Arch to confirm). The office runs the invitation drive, so it is the first to learn that slips need longer. Whole days from 1 to 90. 0 is refused, because an invitation that ends "today" can lapse before it is handed over. 90 covers a hand-out with quarterly statements. A change applies only to invitations made after it. Every change goes to the activity log. Alternative, if the owner wants no screen: the developer changes the values on a written request, as for staff roles (REQ-002 Option B) |
| 7 | **(r5, G-29, G-28)** A "Change of owner" action for sales. Without it the office must remove each person one by one, then edit the owner name and contact details (REQ-003), then invite. A missed step leaves the seller's family seeing the lot's finances, or shows the new owner the seller's name on the confirm screen, so she presses "No, this isn't my lot". | **Recommended: yes.** One confirmed action on the household detail page. It removes everyone linked, stops every unused invitation, and replaces the owner name, contact email and contact mobile with the new owner's (email and mobile optional, left blank if not given, so the seller's contacts don't stay on the lot). The office then invites the new owner as usual. "Remove" stays for one person (a family member who moved out, or a sale within the family). Cost: moderate-small, BA's read 0.5–1 day; Sol Arch to size. Alternative: a written checklist in the office procedure, no software. Decision 5 (what the new owner sees of the lot's history) is not affected |
| 8 | **(r5, G-21, G-17)** A second person in step 1. r3's "Invite another person" needs an email, and email only arrives in step 2. Until the provider is chosen, no co-owner or family member could join. | **Recommended: let "Invite another person" print a slip as well as send an email.** The admin picks the relation, then either enters an email and presses "Send invitation" (step 2) or presses "Print slip". Small extra cost inside step 1 |
| 9 | **(r5, G-27)** People still linked to a household when it is deactivated (REQ-003). REQ-003 left this to REQ-004; its Sol Arch review suggested read-only access. | **(r5, revised after Sol Arch review)** Three options. **(a) Read-only until the office removes them:** they see the lot with "This household record is inactive. Contact the admin office." and can't submit anything. Sol Arch's cost note: this needs an extra check in every homeowner write rule and callable, and it becomes a permanent row in REQ-002's rules matrix that every later REQ must add and test. **(b) Deactivating removes everyone**, reusing Change of owner's removal; no new rule, but a mistaken deactivation locks a family out, and Reactivate doesn't bring them back. **(c) Deactivation is refused while anyone is linked:** "{lot} still has {n} people linked. Remove them first, or use Change of owner." No new rule, and nobody loses access without the office seeing their names. **Recommended: (c).** Deactivation is rare (duplicates, merged lots), so a permanent rule cost (a) buys little, and (c) is safer than (b). (b) and (c) need a matching change to REQ-003's deactivate (its refusal or confirm copy). "Remove" works from the Inactive list under every option |

## Problem

A signed-in person must be linked to the right lot before they see anything. Getting this wrong shows one family's finances to another (SA-001 R-6). Matching by email or phone is ruled out because families share them (ADR-004), so the link is an **invite code**: single-use, with an expiry, redeemed by the person.

The office also has to reach 623+ households, some with no email on file, and handle sales, where the old owner loses access and the new owner gains it.

## Options

### Option A: Emailed invitation with a one-tap link, plus printed code slips (recommended)

- **How it works:** the admin presses "Invite" on a household, or selects many and presses "Invite selected". Each gets an email with a button that opens the portal with the code filled in. Households with no email get a printed slip with the code. After signing in (REQ-001), the person sees "You're joining Blk 2 Lot 7", confirms, and is linked.
- **Cost:** moderate. The `redeemInvite` function and code entry are needed in every option; email adds the mail function and an email provider (ADR-002, provider not yet chosen).
- **Honest downside:** depends on the email provider and the HOA's sending domain being ready (SA-001 Q7); some invitations will land in spam.

### Option B: Printed code slips only

- **How it works:** the office prints a slip per household and hands it out (at the clubhouse, with the paper statement, or in person). The person types the code.
- **Cost:** cheap. No email provider needed in R1.
- **Honest downside:** slow: 623 slips to distribute, some lost, and every reprint makes a new code. Nothing reminds people who don't sign up.

### Option C: Self-registration, approved by the office

- **How it works:** the person signs up, picks their lot, and uploads proof (title, contract or ID). The office reviews and approves.
- **Cost:** a project, not moderate (Sol Arch review): document storage, a review queue and privacy controls.
- **Honest downside:** the office reviews hundreds of documents; the portal stores copies of titles and IDs (Data Privacy Act exposure); anyone can claim any lot, so a tired reviewer can link the wrong person.

### Recommendation

**Option A, built in two steps.** Step 1 is Option B: codes, code entry and printed slips, which needs no email provider. Step 2 adds email delivery once the owner picks a provider (SA-001 Q7). The code and the redemption are the same in both steps, so nothing is thrown away.

**How codes are kept:** the portal stores only a keyed hash of each code, so a code can be seen only at the moment it is made. That means printing always makes new codes (there is no "reprint"), and the code is removed from the email record once the email is handed over (Sol Arch review).

## Story

As an admin office staff member, I want to send each household an invitation, so that the right person is linked to the right lot.

## Acceptance criteria (Option A)

```gherkin
Feature: Linking an account to a lot

  Background:
    Given Blk 2 Lot 7 is in the directory with owner "Ana Reyes" and email "ana@example.com"
    And emailed invitations expire after 7 days and printed slips after 30 days

  @r5-changed
  Scenario: Send an invitation
    Given today is Nov 28, 2026
    When the admin presses "Invite" on Blk 2 Lot 7
    Then an invitation email to "ana@example.com" is queued with the subject "Your invitation to the Greenfield Homes HOA portal"
    And Blk 2 Lot 7 shows "Invited · expires Dec 5, 2026"
    And the invitation is the household's owner invitation, with the relation "Owner"

  Scenario: Accept an emailed invitation
    Given Ana received the invitation
    When she presses "Join the portal" in the email and signs in or creates an account, including with "Continue with Google"
    Then the code is kept through sign-in without her typing it
    And she sees "You're joining Blk 2 Lot 7 (Ana Reyes). Is this your lot?"
    When she presses "Yes, link my account"
    Then she lands on the Blk 2 Lot 7 dashboard
    And the directory shows Blk 2 Lot 7 as "Linked · 1 person"

  Scenario: Enter a printed code
    Given a printed slip for Blk 2 Lot 7 with code "K7QX-M9TA"
    When a signed-in person with no household enters "k7qx m9ta" on "Enter your invite code"
    Then they see "You're joining Blk 2 Lot 7 (Ana Reyes). Is this your lot?"

  Scenario: A wrong code
    When someone enters a code that does not exist
    Then they see "That code doesn't match an invitation. Check it, or ask the admin office for a new one."

  Scenario: Guessing codes is stopped
    Given Ana's account has had 5 codes refused as not matching in the last 15 minutes
    When she enters another code, right or wrong
    Then she sees "Too many wrong codes. Try again in 15 minutes."
    And the code is not checked
    And 15 minutes after her first refused code she can try again

  Scenario: An expired code
    Given the invitation for Blk 2 Lot 7 expired at the end of yesterday, Manila time
    When Ana enters its code
    Then she sees "This invitation has expired. Ask the admin office to send a new one."
    And Blk 2 Lot 7 shows "Invite expired" in the directory

  Scenario: A code can be used only once
    Given Ana already used code "K7QX-M9TA"
    When anyone else enters "K7QX-M9TA"
    Then they see "This invitation was already used. Ask the admin office for a new one."

  @r5-changed
  Scenario: The person who used a code enters it again
    Given Ana linked her account with "K7QX-M9TA" and is still linked to Blk 2 Lot 7
    When Ana enters "K7QX-M9TA" again, before or after the date it expired
    Then she lands on the Blk 2 Lot 7 dashboard
    And no second membership is created
    # After she is removed, this no longer applies: see "A removed person re-entering her own used code" (G-11)

  Scenario: Two people redeem the same code at the same moment
    When two people submit the same unused code at the same time
    Then exactly one of them is linked
    And the other sees "This invitation was already used. Ask the admin office for a new one."

  Scenario: Resending replaces the old invitation
    Given an unused invitation for Blk 2 Lot 7
    When the admin presses "Resend invitation"
    Then a new invitation to "ana@example.com" is queued
    When anyone enters the old code
    Then they see "This invitation was replaced by a newer one. Use the newest invitation, or ask the admin office."

  @r5-changed
  Scenario: A second person in the same household
    Given Ana is linked to Blk 2 Lot 7
    When the admin presses "Invite another person", picks "Family", enters "carlo@example.com" and presses "Send invitation"
    Then Carlo gets his own code
    And Ana's access and invitation do not change
    And until he redeems it, Blk 2 Lot 7 still shows "Linked · 1 person"
    And after he redeems it, the directory shows "Linked · 2 people"

  Scenario: A person already linked to another lot
    Given Juan is linked to Blk 4 Lot 12
    When he enters a code for Blk 2 Lot 7
    Then he sees "Your account is already linked to Blk 4 Lot 12. Ask the admin office if you need access to another lot."

  Scenario: A code for a deactivated household
    Given Blk 7 Lot 1 was deactivated after its code was printed
    When someone enters that code
    Then they see "This invitation is no longer valid. Ask the admin office."

  @r5-changed
  Scenario: Invite many households at once
    Given 400 households are "Not invited" and 380 of them have an email
    When the admin selects them and presses "Invite selected"
    Then they see "Send 380 invitations?" and "20 households have no email. Print their slips instead."
    And the buttons "Send 380 invitations", "Print 20 slips" and "Cancel"
    When they press "Send 380 invitations"
    Then the button reads "Queuing…" and is disabled until all 380 are queued
    And they see "380 invitations queued. Any that fail are marked Email failed in the list."
    When the admin presses "Invite selected" again for the same households
    Then households that already have an unused invitation are skipped, not re-invited
    And they see "No invitations to send" with "380 households are skipped: they are linked or already have an unused invitation."

  @r5-changed
  Scenario: Print code slips
    When the admin selects 20 households with no email and presses "Print invite slips"
    Then they see "Print 20 slips?" and "Printing makes new codes. Each household's earlier unused invitation for the owner, emailed or printed, stops working. Invitations for other people in the household keep working."
    When they press "Print 20 slips"
    Then the button reads "Printing…" and is disabled until the PDF is ready
    And a PDF downloads with one slip per household showing the lot, the code, the expiry date and how to join
    And the slips show no balance, email or phone number
    And the PDF shows "Delete this file after printing."

  @r5-changed
  Scenario: Removing a person after a sale
    Given Ana and Carlo are linked to Blk 2 Lot 7
    When the admin presses "Remove" next to Ana and confirms "Remove Ana Reyes from Blk 2 Lot 7? They will no longer see this lot. Its bills and payments stay with the lot."
    Then Ana no longer sees Blk 2 Lot 7
    And while her device is online, her open screen changes to "Enter your invite code" within a minute
    And Carlo stays linked, and Blk 2 Lot 7 shows "Linked · 1 person"
    And the lot's bills and payments stay on the lot
    And any unused invitation for Blk 2 Lot 7 stops working
    And the activity log records who removed her and when
    # To remove everyone after a sale in one step, see "Change of owner" (decision 7)

  @r5-changed
  Scenario: An email the provider refuses is shown, not hidden
    Given the email provider refused the invitation to "ana@example.com" when it was handed over
    Then Blk 2 Lot 7 shows "Email failed" with "Resend invitation" and "Print slip"

  @r5-changed
  Scenario: An email that bounces later is shown (if decision 3 is yes)
    Given the provider reports that the invitation to "ana@exmaple.com" bounced
    Then Blk 2 Lot 7 shows "Email failed" with "Resend invitation" and "Print slip"
```

### New in r5: when an invitation counts as expired, and what the directory shows (G-1, G-2, G-3, G-8, G-14)

```gherkin
  @r5-new
  Scenario: A household turns "Invite expired" with no one doing anything
    Given Blk 2 Lot 7's only invitation expires at the end of Dec 5, 2026
    When an admin opens the directory at 23:59:59 on Dec 5, 2026, Philippine time
    Then Blk 2 Lot 7 shows "Invited · expires Dec 5, 2026"
    When an admin opens the directory at 00:00:01 on Dec 6, 2026, Philippine time
    Then Blk 2 Lot 7 shows "Invite expired" on its row, its phone card and its detail page
    And it is counted under "Invite expired" in the header and the filter chip

  @r5-new
  Scenario: An expired invitation does not block a new one
    Given Blk 2 Lot 7 shows "Invite expired"
    When the admin includes it in "Invite selected" or "Print invite slips"
    Then it is not skipped
    And it gets a new invitation and shows "Invited · expires {new date}"
    And its old code shows "This invitation was replaced by a newer one. Use the newest invitation, or ask the admin office."

  @r5-new
  Scenario Outline: Which status a household shows
    Given Blk 2 Lot 7 has <people> linked and <invitations>
    When an admin opens the directory
    Then Blk 2 Lot 7 shows "<status>"

    Examples:
      | people   | invitations                                                         | status                   |
      | 1 person | a failed email to Carlo                                             | Linked · 1 person        |
      | 2 people | an unused invitation for a co-owner                                 | Linked · 2 people        |
      | no one   | an unused owner invitation and a failed email to a co-owner         | Email failed             |
      | no one   | an unused owner invitation and an expired co-owner invitation       | Invited · expires {date} |
      | no one   | only expired invitations                                            | Invite expired           |
      | no one   | none unused, after the last person was removed                      | Not invited              |
      | no one   | none ever                                                           | Not invited              |

  @r5-new
  Scenario: The directory header counts add up
    Given there are 623 active households and 2 inactive ones
    When an admin opens the directory
    Then the header reads "623 households · 412 linked · 148 invited · 9 invite expired · 3 email failed · 51 not invited"
    And the five groups add up to 623
    And inactive households are counted only in the "Inactive (2)" chip

  @r5-new
  Scenario: Expiry dates show the year and say when they end
    Given an emailed invitation and a printed slip are made on Nov 28, 2026
    Then the email reads "This invitation expires at the end of Dec 5, 2026 (Philippine time)."
    And the directory and household detail show "Invited · expires Dec 5, 2026"
    And the slip reads "Expires at the end of Dec 28, 2026 (Philippine time)"

  @r5-new
  Scenario: The household detail shows each email's status
    Given the admin invited Blk 2 Lot 7 on Nov 28, 2026
    When the admin opens Blk 2 Lot 7's detail page
    Then while the email waits its turn, the Invitations list shows "ana@example.com" with "Queued Nov 28, 2026"
    And once the provider accepts it, the line reads "Sent Nov 28, 2026"
    And if the provider refuses it, the status reads "Email failed"
    And the directory pill reads "Invited · expires Dec 5, 2026" while it is queued or sent
    And no screen says "delivered"
```

### New in r5: who an invitation is for, printing and resending (G-4, G-12, G-13, G-15, G-16, G-32, G-33)

```gherkin
  @r5-new
  Scenario: Printing a slip replaces the owner's emailed invitation, not another person's
    Given Blk 2 Lot 7 has an unused emailed owner invitation and an unused invitation for Carlo (Family)
    When the admin prints a slip for Blk 2 Lot 7
    Then the emailed owner code shows "This invitation was replaced by a newer one. Use the newest invitation, or ask the admin office."
    And Carlo's code still works
    And Blk 2 Lot 7 has one unused owner invitation, the printed one

  @r5-new
  Scenario: Linked households are skipped by bulk invite and bulk print
    Given Blk 4 Lot 12 is "Linked · 1 person"
    When the admin includes it in "Invite selected" or "Print invite slips"
    Then no invitation is made for it, no email is queued and no slip is printed
    And the confirm counts it among the skipped households
    And its row offers no "Invite", "Resend invitation" or "Print slip"
    And to add someone to a linked household, the admin uses "Invite another person" on its detail page

  @r5-new
  Scenario Outline: The bulk invite confirm reads correctly for any mix
    Given the admin selected <selection>
    When they press "Invite selected"
    Then the title reads "<title>"
    And the lines read "<lines>"
    And the buttons are "<buttons>"

    Examples:
      | selection                                              | title                  | lines                                                                                                                      | buttons                                       |
      | 10 households, all with email, none skipped            | Send 10 invitations?   | (none)                                                                                                                     | Send 10 invitations · Cancel                  |
      | 1 household with email                                 | Send 1 invitation?     | (none)                                                                                                                     | Send 1 invitation · Cancel                    |
      | 50: 35 can get an email, 5 have no email, 10 skipped   | Send 35 invitations?   | 5 households have no email. Print their slips instead. · 10 households are skipped: they are linked or already have an unused invitation. | Send 35 invitations · Print 5 slips · Cancel |
      | 3 households, none with email                          | No invitations to send | 3 households have no email. Print their slips instead.                                                                     | Print 3 slips · Cancel                        |
      | 1 household with no email                              | No invitations to send | 1 household has no email. Print its slip instead.                                                                         | Print 1 slip · Cancel                         |
      | 4 households, all skipped                              | No invitations to send | 4 households are skipped: they are linked or already have an unused invitation.                                            | Close                                         |

  @r5-new
  Scenario: The counts are what is actually done
    Given the admin confirmed "Send 35 invitations"
    Then exactly 35 emails are queued
    And they see "35 invitations queued. Any that fail are marked Email failed in the list."
    And for one invitation they see "1 invitation queued. If it fails, it is marked Email failed in the list."

  @r5-new
  Scenario: The print confirm says how many earlier invitations stop working
    Given the admin selected 20 households: 3 have an unused owner invitation and 2 are linked
    When they press "Print invite slips"
    Then they see "Print 18 slips?"
    And "3 of these households have an unused invitation. It stops working when you print."
    And "2 households are skipped because they are linked."
    And for one household the title reads "Print 1 slip?"

  @r5-new
  Scenario: Two staff print slips for the same household at about the same time
    Given an admin printed a slip for Blk 4 Lot 5 a few minutes ago
    When a second admin prints a slip for Blk 4 Lot 5
    Then Blk 4 Lot 5 ends with exactly one working printed code, the second one
    And the second admin sees "Slips for 1 of these households were printed in the last hour by Paolo Aquino. Those slips no longer work."

  @r5-new
  Scenario: Resend after the contact email is corrected
    Given Blk 4 Lot 15's owner invitation went to "dennis@exmaple.com" and shows "Email failed"
    And the admin corrected the contact email to "dennis@example.com" (REQ-003)
    When the admin presses "Resend invitation"
    Then a new invitation to "dennis@example.com" is queued
    And the invitation to "dennis@exmaple.com" is replaced, so Blk 4 Lot 15 has one owner invitation

  @r5-new
  Scenario: Resend while the earlier email is still waiting to go out
    Given the first invitation email to "ana@example.com" is still queued
    When the admin presses "Resend invitation"
    Then only the new email is handed to the provider
    And Ana receives one invitation email, with the code that works

  @r5-new
  Scenario Outline: Buttons that make or stop invitations act once
    Given the admin office staff member is on the screen with "<button>"
    When they press "<button>" twice quickly
    Then it reads "<in flight>" and is disabled until the save finishes
    And exactly one <result>

    Examples:
      | button                                  | in flight     | result                                                       |
      | Invite                                  | Queuing…      | invitation is made and one email queued                      |
      | Resend invitation                       | Queuing…      | new invitation is made and one email queued                  |
      | Send invitation (Invite another person) | Queuing…      | invitation is made and one email queued                      |
      | Print {n} slips (print confirm)         | Printing…     | printed invitation per household is made and one PDF downloads |
      | Withdraw (withdraw confirm)             | Withdrawing…  | invitation is withdrawn and one activity log entry is made   |
      | Change owner                            | Saving…       | change of owner is made                                      |
```

### New in r5: withdrawing an invitation (G-5)

```gherkin
  @r5-new
  Scenario: Withdraw an unused invitation
    Given Blk 2 Lot 7 has an unused printed slip that the household reports lost
    When the admin presses "Withdraw invitation" on that line of the Invitations list
    Then they see "Withdraw this invitation? Its code stops working at once. You can invite again later." with "Keep invitation" and "Withdraw"
    When they press "Withdraw"
    Then they see "Invitation withdrawn."
    And anyone who enters that code sees "This invitation is no longer valid. Ask the admin office."
    And the line leaves the Invitations list
    And Blk 2 Lot 7's status is worked out again, for example "Not invited"
    And the activity log records who withdrew it and when

  @r5-new
  Scenario: A used invitation can't be withdrawn
    Given Ana linked with her invitation
    When the admin opens Blk 2 Lot 7's detail page
    Then her invitation's line reads "Used Nov 29, 2026" and has no "Withdraw invitation"
    And to stop Ana's access the admin uses "Remove"

  @r5-new
  Scenario: Only admin office staff and the treasurer can withdraw
    Given a homeowner, a board member or a guard is signed in
    Then they see no "Withdraw invitation"
    And a direct call to withdraw from their account is refused, and the invitation still works
```

### New in r5: entering a code (G-11, G-19, G-22, G-23, G-24, G-25, G-30, G-31)

```gherkin
  @r5-new
  Scenario: A removed person re-entering her own used code does not get back in
    Given Ana linked her account with "K7QX-M9TA"
    And the admin later removed her from Blk 2 Lot 7
    When Ana enters "K7QX-M9TA" on "Enter your invite code", or opens her old invitation link
    Then she sees "Your access to Blk 2 Lot 7 was removed by the admin office. Ask them if you think this is a mistake."
    And she is not linked and sees no Blk 2 Lot 7 data
    And she stays on "Enter your invite code"
    And the refusal does not count towards the wrong-code limit

  @r5-new
  Scenario: Someone else entering a removed person's used code
    Given Ana used "K7QX-M9TA" and was later removed
    When a signed-in person with no household enters "K7QX-M9TA"
    Then they see "This invitation was already used. Ask the admin office for a new one."

  @r5-new
  Scenario: A linked person enters another unused code for their own household
    Given Ana is linked to Blk 2 Lot 7, and Carlo's unused code for Blk 2 Lot 7 is "P4WD-7HNE"
    When Ana enters "P4WD-7HNE"
    Then she lands on the Blk 2 Lot 7 dashboard
    And she sees "You're already linked to Blk 2 Lot 7. That code wasn't used, so the person it was meant for can still use it."
    And Carlo's code still works

  @r5-new
  Scenario Outline: A code the page can tell is not a code
    Given a signed-in person with no household is on "Enter your invite code"
    When they enter "<typed>" and press "Continue"
    Then "<message>" shows under the code field and is announced
    And the server is not asked, and the wrong-code count does not change
    And what they typed is kept
    And if the page check is skipped, the server refuses the code too, without looking it up or counting it (r5, Sol Arch C-6)

    Examples:
      | typed       | message                                                                                 |
      |             | Enter the code from your invitation.                                                    |
      | K7QX-M9T    | Invite codes have 8 letters and numbers, like K7QX-M9TA. They never use O, 0, I or 1.   |
      | K7QX-M9TAA  | Invite codes have 8 letters and numbers, like K7QX-M9TA. They never use O, 0, I or 1.   |
      | K7QX-M9T0   | Invite codes have 8 letters and numbers, like K7QX-M9TA. They never use O, 0, I or 1.   |

  @r5-new
  Scenario: A successful link clears earlier wrong codes
    Given Ana's account has had 4 codes refused as not matching in the last 15 minutes
    When she redeems a valid code for Blk 2 Lot 7
    Then her wrong-code count goes back to 0
    And if she later enters a valid code for another lot, she sees "Your account is already linked to Blk 2 Lot 7. Ask the admin office if you need access to another lot."

  @r5-new
  Scenario: Codes entered while locked don't extend the lock
    Given Ana's first refused code was at 10:00:00 and her fifth at 10:05:00
    And she entered codes at 10:06, 10:10 and 10:14 and each time saw "Too many wrong codes. Try again in 15 minutes."
    When she enters a valid code at 10:15:00
    Then she sees the confirm screen for that code

  @r5-new
  Scenario Outline: Which message wins when several apply
    Given <situation>
    When they enter the code
    Then they see <result>

    Examples:
      | situation                                                                                   | result |
      | the account is locked, and it is also linked to another lot                                  | "Too many wrong codes. Try again in 15 minutes." |
      | the account is linked to Blk 4 Lot 12, and the code is a used code for Blk 2 Lot 7           | "Your account is already linked to Blk 4 Lot 12. Ask the admin office if you need access to another lot." |
      | the code has expired, and its household was deactivated                                     | "This invitation is no longer valid. Ask the admin office." |
      | the code has expired, and it was withdrawn                                                  | "This invitation is no longer valid. Ask the admin office." |
      | the code has expired, and it was replaced                                                   | "This invitation was replaced by a newer one. Use the newest invitation, or ask the admin office." |
      | the code has expired, and the person is linked to the code's household                      | the household dashboard |

  @r5-new
  Scenario Outline: The connection fails while checking or linking
    Given a signed-in person with no household is on <screen>
    When they press "<button>" and <problem>
    Then they see "<message>"
    And the code is kept, and the wrong-code count does not change

    Examples:
      | screen                   | button               | problem                                          | message                                                              |
      | "Enter your invite code" | Continue             | the device is offline                            | You're offline. Connect to the internet to use your invite code.     |
      | "Enter your invite code" | Continue             | the server can't be reached or returns an error  | We couldn't check the code. Check your connection and try again.     |
      | the confirm screen       | Yes, link my account | the device is offline                            | You're offline. Connect to the internet to use your invite code.     |
      | the confirm screen       | Yes, link my account | the server can't be reached or returns an error  | We couldn't link your account. Check your connection and try again.  |

  @r5-new
  Scenario: Pressing "Yes, link my account" again after a lost reply
    Given Ana's link went through, but the reply never reached her phone
    When she presses "Yes, link my account" again
    Then she lands on the Blk 2 Lot 7 dashboard
    And she has one membership

  @r5-new
  Scenario: "No, this isn't my lot" clears the code
    Given a signed-in person with no household is on the confirm screen for Blk 2 Lot 7
    When they press "No, this isn't my lot"
    Then they are back on "Enter your invite code" with an empty code field
    And above the field "Please contact the admin office to get the right invitation."
    And reloading the page does not bring back the confirm screen
    And the code was not used, so it still works for the right person
```

### New in r5: removing people and changing the owner (G-9, G-10, G-18, G-26, G-28, G-29)

```gherkin
  @r5-new
  Scenario: Change of owner after a sale (owner decision 7)
    Given Ana Reyes and Carlo Reyes are linked to Blk 2 Lot 7, and a co-owner invitation is unused
    And the lot is sold to Rosa Lim
    When the admin presses "Change of owner" on Blk 2 Lot 7's detail page
    Then they see "Change of owner for Blk 2 Lot 7"
    And "Everyone linked to this lot loses access at once: Ana Reyes, Carlo Reyes. Every unused invitation stops working. Its bills and payments stay with the lot."
    And the fields "New owner's name", "New owner's email (optional)" and "New owner's mobile (optional)"
    When they enter "Rosa Lim" and "rosa@example.com" and press "Change owner"
    Then the button reads "Saving…" and is disabled until the save finishes
    And Ana and Carlo no longer see Blk 2 Lot 7
    And every unused invitation for Blk 2 Lot 7 stops working
    And the owner on file is "Rosa Lim", the contact email is "rosa@example.com" and the contact mobile is blank
    And Blk 2 Lot 7 shows "Not invited"
    And they see "Blk 2 Lot 7 now shows Rosa Lim as owner. Invite the new owner when you're ready."
    And the activity log records who made the change and when

  @r5-new
  Scenario: The new owner sees her own name on the confirm screen
    Given the admin made the change of owner to "Rosa Lim" and printed her slip
    When Rosa enters her code
    Then she sees "You're joining Blk 2 Lot 7 (Rosa Lim). Is this your lot?"
    And nothing on the screen names Ana Reyes

  @r5-new
  Scenario: The change of owner form keeps what was typed
    Given the admin is on the "Change of owner" form
    When they press "Change owner" with the name empty
    Then "Enter the new owner's name" shows under the field and what they typed is kept
    And an email or mobile in the wrong format gets the same messages as the household form (REQ-003)
    And clicking outside the form does not close it

  @r5-new
  Scenario: Someone joins or leaves while the change of owner form is open (Sol Arch C-1)
    Given the admin opened "Change of owner" for Blk 2 Lot 7 when it listed Ana Reyes and Carlo Reyes
    And before they press "Change owner", Liza Reyes links to Blk 2 Lot 7 with a code
    When the admin presses "Change owner"
    Then nothing is changed: no one is removed, no invitation stops working, and the owner name stays
    And they see "Someone joined or left Blk 2 Lot 7 since you opened this. Check the list and try again."
    And the form now lists Ana Reyes, Carlo Reyes and Liza Reyes
    And what they typed in the form is kept

  @r5-new
  Scenario: After the last person is removed
    Given Ana is the only person linked to Blk 2 Lot 7
    When the admin removes her
    Then Blk 2 Lot 7 shows "Not invited", never "Linked · 0 people"
    And "People with portal access" reads "No one is linked to this lot. Invite the owner or print a slip."
    And removed people are not listed there (the activity log keeps who was removed)

  @r5-new
  Scenario: Removing someone who was already removed
    Given two admins have the Remove confirm open for Ana
    When the second presses "Remove" after the first
    Then the second sees "Ana Reyes was already removed from Blk 2 Lot 7. Nothing was changed."
    And the member count goes down once, and one removal is logged

  @r5-new
  Scenario: Who the household detail lists
    Given Ana's own account was named "Ana R." with the email "ana.r@example.com" when she linked to Blk 2 Lot 7 on Nov 29, 2026 (copied onto her membership then, Sol Arch C-5)
    When the admin opens Blk 2 Lot 7's detail page
    Then "People with portal access" shows "Ana R." with "ana.r@example.com" and "Owner · linked Nov 29, 2026"
    And the Invitations list shows each person's current invitation and the used ones, but not replaced or withdrawn ones
```

### New in r5: expiry settings (G-7, owner decision 6)

```gherkin
  @r5-new
  Scenario: Changing how long invitations last
    Given an emailed invitation to Blk 4 Lot 15 was made on Nov 28, 2026 and expires on Dec 5, 2026
    When an admin office staff member or the treasurer opens Settings, sets "Emailed invitations expire after (days)" to 14 and presses "Save"
    Then the button reads "Saving…" and is disabled until the save finishes
    And they see "Saved. New invitations use these dates."
    And an invitation made on Nov 28, 2026 after the change shows "Invited · expires Dec 12, 2026"
    And Blk 4 Lot 15 still expires on Dec 5, 2026
    And the activity log records who changed it, the old and new values, and when

  @r5-new
  Scenario Outline: Expiry days must be a whole number from 1 to 90
    Given the treasurer is on the Invitations settings
    When they enter "<days>" in "Printed slips expire after (days)" and leave the field
    Then <result>

    Examples:
      | days | result |
      | 0    | "Enter a whole number of days from 1 to 90." shows under the field, and Save stores nothing |
      | 1    | it is accepted, and a slip printed on Nov 28 expires at the end of Nov 29                  |
      | 90   | it is accepted                                                                              |
      | 91   | "Enter a whole number of days from 1 to 90." shows under the field, and Save stores nothing |
      | -3   | "Enter a whole number of days from 1 to 90." shows under the field, and Save stores nothing |
      | 7.5  | "Enter a whole number of days from 1 to 90." shows under the field, and Save stores nothing |
      |      | "Enter a whole number of days from 1 to 90." shows under the field, and Save stores nothing |

  @r5-new
  Scenario: Board members, guards and homeowners can't change expiry
    Given a board member, a guard or a homeowner is signed in
    Then they don't see the Invitations settings
    And a direct write from their account is refused, and the stored values don't change

  @r5-new
  Scenario: With no setting stored, the defaults apply
    Given no expiry setting has been saved
    When the admin invites by email and prints a slip on Nov 28, 2026
    Then they expire at the end of Dec 5, 2026 and Dec 28, 2026
```

### New in r5: step 1 and second people (G-17, G-21, owner decision 8)

```gherkin
  @r5-new
  Scenario: Before the email provider is chosen (step 1)
    Given the portal is in step 1, printed slips only
    When an admin opens the directory or a household's detail page
    Then there is no "Invite", "Invite selected" or "Resend invitation", and no email field in "Invite another person"
    And every household that isn't linked offers "Print slip"
    And "Print invite slips" works on a selection

  @r5-new
  Scenario: Inviting another person by slip (owner decision 8)
    Given Ana is linked to Blk 2 Lot 7
    When the admin presses "Invite another person", picks "Co-owner" and presses "Print slip"
    Then they see the print confirm for 1 household
    When they press "Print 1 slip"
    Then a one-slip PDF downloads for Blk 2 Lot 7
    And the Invitations list shows "Printed slip · Co-owner" with "Invited · expires {date}"
    And Ana's access and the owner invitation do not change

  @r5-new
  Scenario: The relation must be picked
    Given the admin is on "Invite another person"
    When they press "Send invitation" or "Print slip" without picking a relation
    Then "Choose how this person is related to the household" shows under the choices
    And the only choices are "Co-owner" and "Family", with neither picked at first
```

### New in r5: a deactivated household (G-27, owner decision 9)

```gherkin
  @r5-new
  Scenario: Deactivating a household that still has people linked (decision 9, option c, recommended)
    Given Dora Santos is linked to Blk 7 Lot 1
    When the admin presses "Deactivate" on Blk 7 Lot 1 (REQ-003)
    Then Blk 7 Lot 1 is not deactivated
    And they see "Blk 7 Lot 1 still has 1 person linked. Remove them first, or use Change of owner."
    And once no one is linked, "Deactivate" works as REQ-003 describes

  @r5-changed
  Scenario: People linked to a household that is deactivated (only if decision 9 chooses option a, read-only)
    Given Dora Santos is linked to Blk 7 Lot 1
    And the admin deactivates Blk 7 Lot 1 (REQ-003)
    When Dora opens the portal
    Then she still sees Blk 7 Lot 1, with "This household record is inactive. Contact the admin office." at the top of every page
    And she can't submit anything for it
    And a direct write from her account for Blk 7 Lot 1 is refused (Sol Arch C-6)
    And the admin can open Blk 7 Lot 1 from "Inactive" and press "Remove" next to her

  @r5-new
  Scenario: Deactivating stops codes for good (Sol Arch C-3)
    Given Blk 7 Lot 1 has an unused printed slip and no one linked
    When the admin deactivates Blk 7 Lot 1 and later presses "Reactivate"
    Then the slip's code still shows "This invitation is no longer valid. Ask the admin office."
    And Blk 7 Lot 1 shows "Not invited", and the admin can print a new slip
    And no one can invite, resend or print for Blk 7 Lot 1 while it is inactive
```

## Data changes

| What | Where | Rule | Written by | Read by |
|---|---|---|---|---|
| Invitation: household, **slot (r5)**, channel (email / print), sent to, relation (chosen by the admin), created, expires, status (active / used / replaced / cancelled), **cancel reason (withdrawn / removed / owner changed / deactivated) (r5)**, used by, used at | `invites/{codeHash}` (keyed hash of the code) | Single use; expiry from settings, fixed when made; "expired" is worked out from the expiry date, not stored; **one active invitation per slot (r5)** | `createInvites` function; **`cancelInvite` (Withdraw), `removeMember`, `changeOwner`, and REQ-003's deactivate (`setHouseholdActive`), which writes cancel reason "deactivated" (r5)**. **(r5, Sol Arch C-3)** Reactivate never brings a cancelled code back | `checkInvite`, `redeemInvite`; staff read by household |
| Membership: household, person, relation, invite, invited by, linked at, **name and email, copied from the signed-in account at link time and not updated later (r5, Sol Arch C-5)** | `members/{householdId}_{uid}` (ADR-004) | Created only by `redeemInvite`, in a transaction that refuses a used, replaced, cancelled or expired code. **Deleted by `removeMember` or `changeOwner` (r5)** | `redeemInvite` | Rules (`isMember`); household screens; **staff, for "People with portal access" (r5)** |
| Wrong-code attempts | `inviteAttempts/{uid}` | 5 refused codes per 15 minutes per account. **(r5)** Only "doesn't match" counts. Set back to 0 by a successful redeem. Codes refused while locked don't move the window. Codes the page refuses for their format never reach it | `checkInvite`, `redeemInvite` | Same functions |
| Link status and member count | `households/{id}.linkStatus`, `memberCount`, **`inviteExpiresAt` (r5)** | **(r5)** `linkStatus` is one of not invited / invited / email failed / linked. `inviteExpiresAt` is the latest expiry among the household's unused invitations. "Invite expired" is shown when status is invited and `inviteExpiresAt` has passed (Invitation rules below). **(r5, Sol Arch C-3)** Recomputed from the household's invitations and members, in the same transaction, by every writer; never set directly | Invite functions; `changeOwner`; REQ-003's deactivate and reactivate; mail function (failed) | Directory (REQ-003) |
| Invitation email | `mail` queue (ADR-002) | Code removed after hand-off; status queued / sent / failed, never "delivered". **(r5)** If the invitation is no longer active when the email's turn comes, it is not handed over, its code and body are cleared, and its status is **`skipped` (r5, Sol Arch C-4)**. `skipped` is never shown or counted as Email failed | `createInvites` | Mail function; directory |
| Invitation expiry settings | settings (SA to name) | Days for email and for print. **(r5)** Whole days 1–90. Missing means 7 and 30. A change applies to invitations made after it | **(r5)** Admin office and treasurer, in Settings → Invitations (decision 6; r3 said treasurer only) | `createInvites` |
| **Change of owner (r5)** | `households/{id}.displayName`, **`searchTokens` (r5)**; `householdContacts/{id}` | One transaction: delete every membership, cancel every unused invitation, set the new owner name, **rewrite `searchTokens` from it (r5, Sol Arch C-2)**, replace contact email and mobile (blank if not given), recompute link status (decision 7). **(r5, Sol Arch C-1)** The call carries the people the form listed, and is refused with nothing changed if they no longer match. **(r5, Sol Arch C-2)** The seller's owner name and contacts are not kept anywhere in the portal; the activity log holds ids only, so the removed accounts stay traceable by id. The office's own sale papers are the record of the previous owner (Open questions) | `changeOwner` function | Directory; confirm screen |
| Change records | `auditLog` | Every invite, replacement, cancellation, redemption and removal; ids only. **(r5)** Also every withdrawal, change of owner (no names or contacts, ids only) and expiry-settings change (old and new values) | Functions | Board, treasurer (activity log screen is backlog story 06; until then checked at data level) |
| **(r4)** Household membership index | `memberOf/{uid}` `{householdIds}` (REQ-016) | `redeemInvite` adds the household id **in the same transaction** as the `members` record; `removeMember` removes it in the same transaction as the delete (the document is deleted when the list is empty). **(r5)** `changeOwner` removes it for every membership it deletes, in the same transaction. Server-written only. People linked before this ships get it from REQ-016's one-off back-fill script, with a count check before the rules that use it are deployed | `redeemInvite`, `removeMember`, **`changeOwner` (r5)** | Rules (announcements, `config/features`, REQ-015 to REQ-017) |

**(r4) After a sale:** if REQ-013 decision 8 (a) is approved, the office's process is to update the owner on file (REQ-003) before inviting the new owner, so receipts name the right person (S3 BA, TC-13 G-7).

The email link carries the code after `#`, so it never reaches server logs. Clients never read `invites`, `inviteAttempts` or `mail` except staff reading invitations by household.

### Invitation rules (r5)

- **Slots (G-4, G-16).** Every invitation belongs to a slot. Each household has one **owner slot**, used by "Invite", "Invite selected", "Resend invitation", "Print slip" on the row and "Print invite slips". It is the same slot whether the invitation is emailed or printed and whatever address it went to, so printing replaces an unused emailed owner invitation, and a Resend after the contact email changes replaces the invitation to the old address. Each use of "Invite another person" opens a **person slot** for that person. "Resend invitation", "Print slip" and "Withdraw invitation" on a line of the Invitations list act on that line's slot only. One active invitation per slot. (Sol Arch's r1 "household plus recipient" is replaced by this; see Sol Arch review (r5).)
- **Relation (G-17).** Owner slot: "Owner". Person slot: "Co-owner" or "Family", picked by the admin each time, no default. No tenant in R1 (D3).
- **Unused (G-1).** An invitation is unused when it is active and not expired. Expired invitations are not unused, so they never cause a household to be skipped.
- **Expired (G-3).** Worked out at the moment it is read, from `expiresAt`, everywhere: in `redeemInvite`, in the pill and in the counts. Nothing is written when an invitation expires. BA's recommendation; the mechanism is Sol Arch's (question 1).
- **Which status a household shows (G-2).** In this order: Linked · {n} if anyone is linked (other people's invitations then show only on the detail page); else Email failed if the email of any active invitation failed; else Invited · expires {latest date} if any is unused; else Invite expired if any active one has expired; else Not invited. Never "Linked · 0 people".
- **Header counts (G-3).** Active households only, in five groups that add up to the total: linked, invited, invite expired, email failed, not invited. Inactive households appear only in the "Inactive" chip.
- **Skipped in bulk (G-12, G-13).** "Invite selected" and "Print invite slips" skip linked households. "Invite selected" also skips households whose owner slot has an unused invitation. Counts in the confirm and done messages are the households actually acted on.
- **Code check order (G-24, G-11, G-19, G-31).** The first that applies wins: (1) the page's format check (not sent, not counted); (2) account locked; (3) no match (counted); (4) the person is linked to the code's household: dashboard, whatever the code's state, and the code is not consumed; (5) the person is linked to another lot: already linked; (6) household deactivated, or invitation cancelled for any reason: no longer valid; (7) used by this same person, who is no longer linked: access removed; (8) used: already used; (9) replaced: replaced; (10) expired: expired; (11) otherwise: the confirm screen. This replaces r3's "the person who used a code enters it again → dashboard" with "a person linked to the code's household → dashboard", so a removed person (7) is refused.
- **Removal (G-9, G-26).** Removing a person deletes their membership and cancels every unused invitation for the lot (as r3). When the last person goes, the status is worked out again (normally Not invited). An open screen of the removed person changes within a minute while online, and on the next load in any case.
- **Withdraw (G-5).** "Withdraw invitation" is how staff cancel one unused invitation (a lost slip, a wrong address, a person no longer joining). It is the only screen caller of `cancelInvite`. Used invitations can't be withdrawn.
- **Step 1 (G-21).** Until the email provider is live, the email controls are not shown at all (not disabled), and every household that isn't linked offers "Print slip".

## UX/UI notes

- **Accessibility:** the code field has a visible label, accepts lower case, spaces and hyphens, and uses a large monospaced font like the mock-up's pass code (`.code`); errors are announced. **(r5)** The format and connection messages show under the code field like the other code errors (4D). The Withdraw, Change of owner and Settings forms follow the same rules: visible labels, errors under the field and announced, focus moves into each modal and back to the button that opened it.
- **Consistency:** codes look like the mock-up's guest pass codes (8 characters, `XXXX-XXXX`, no 0/O or 1/I); "Invite", "Resend invitation", "Remove" are the only labels used. **(r5)** One label per action everywhere, including the directory row and the "Email failed" line: "Resend invitation", never "Resend". The linked row has no "Manage" button; the lot name opens the detail page on every row. Staff "withdraw" an invitation on screen ("Cancel" stays the label for closing a dialog); the data status is `cancelled`. The household's pills are the five of record; invitation lines on the detail page reuse them, plus "Used {date}". Dates always show the year: "Dec 5, 2026". Homeowner-facing expiry text says "at the end of {date} (Philippine time)".
- **Mobile-first:** the join screens are single cards at 375 px; the email button is large enough to tap. **(r5)** The staff forms (Change of owner, Invite another person, Settings → Invitations) are single-column cards that fit 375 px.
- **States:** "Not invited" (empty) → "Invited" → "Linked" or "Invite expired" or "Email failed", each a pill with text; loading on code check ("Checking…"); success lands on the dashboard. **(r5)** Empty "People with portal access": "No one is linked to this lot. Invite the owner or print a slip." Offline and server-error lines on the code and confirm screens. Queued / Sent / Printed lines on each emailed or printed invitation. Step 1 shows only print controls.
- **Safe actions:** "Yes, link my account", "Invite selected" and "Remove" are disabled while in flight; "Remove" and "Print invite slips" are confirmed; the join screen shows the lot so the person can stop if it's the wrong one ("No, this isn't my lot" ends the join flow and tells them to contact the office). **(r5)** Also disabled while in flight: "Invite", "Resend invitation", "Send invitation", every print confirm, "Withdraw", "Change owner" and Save on the settings (G-33). "Withdraw invitation" and "Change of owner" are confirmed. The Change of owner and Invite another person forms don't close on a backdrop click. Every one of these also needs the server-side guard (Sol Arch question 9).
- **Roles:** only admin office staff and the treasurer can invite or remove; a person can only redeem a code for themselves. **(r5)** The same two roles withdraw, change the owner and (decision 6) change the expiry settings. Board, guard and homeowners see none of these controls, and the server refuses them.
- **Privacy:** the confirmation screen shows the lot and the owner name on file, nothing else; slips show no balance or contact details; slips work like keys, so the office hands them over in person or in a sealed envelope. **(r5)** Change of owner sets the new owner's name before any invitation, so the new owner never sees the seller's name, and clears the seller's contacts from the lot (G-28). The "access removed" message names only the lot the person was already linked to. The household detail shows each linked person's own account name and email to staff, so a stranger who linked with a lost slip stands out (G-18).

## Copy of record

| Where | Text |
|---|---|
| Email subject | Your invitation to the {HOA name} portal |
| Email body | Hi {owner name}, the {HOA name} admin office has invited you to the resident portal for {lot}. Press the button to join. **(r5)** This invitation expires at the end of {date} (Philippine time). · Button: Join the portal · If the button doesn't work, sign in at {portal address} and enter this code: {code} |
| Email footer **(r5)** | You got this email because your address is on file with the admin office. If this isn't your lot, ignore it. |
| Date format **(r5)** | {date} is always written like "Dec 5, 2026", in every place it appears |
| Code entry heading | Enter your invite code |
| Code entry hint | You'll find it in your invitation email or on the slip from the admin office. |
| Code field and button **(r5)** | Invite code · Continue (in flight: Checking…) |
| Empty code **(r5)** | Enter the code from your invitation. |
| Malformed code **(r5)** | Invite codes have 8 letters and numbers, like K7QX-M9TA. They never use O, 0, I or 1. |
| Confirm screen | You're joining {lot} ({owner name}). Is this your lot? · Yes, link my account · No, this isn't my lot |
| Wrong lot | Please contact the admin office to get the right invitation. **(r5)** Shown above the empty code field on "Enter your invite code" |
| Errors | That code doesn't match an invitation. Check it, or ask the admin office for a new one. · This invitation has expired. Ask the admin office to send a new one. · This invitation was already used. Ask the admin office for a new one. · This invitation was replaced by a newer one. Use the newest invitation, or ask the admin office. · This invitation is no longer valid. Ask the admin office. · Your account is already linked to {lot}. Ask the admin office if you need access to another lot. · Too many wrong codes. Try again in 15 minutes. |
| Access removed **(r5)** | Your access to {lot} was removed by the admin office. Ask them if you think this is a mistake. |
| Own household's other code **(r5)** | You're already linked to {lot}. That code wasn't used, so the person it was meant for can still use it. |
| Offline, code or confirm **(r5)** | You're offline. Connect to the internet to use your invite code. |
| Server error, code check **(r5)** | We couldn't check the code. Check your connection and try again. |
| Server error, linking **(r5)** | We couldn't link your account. Check your connection and try again. |
| Inactive household notice **(r5)** | This household record is inactive. Contact the admin office. (decision 9, option a only) |
| Deactivate refused **(r5)** | {lot} still has {n} people linked. Remove them first, or use Change of owner. (one: {lot} still has 1 person linked. Remove them first, or use Change of owner.) (decision 9, option c; needs the matching REQ-003 change) |
| Change of owner, list changed **(r5)** | Someone joined or left {lot} since you opened this. Check the list and try again. (Sol Arch C-1) |
| Directory buttons | Invite · Invite selected · Resend invitation · Invite another person · Print invite slips · Print slip · Remove **(r5)** · Withdraw invitation · Change of owner |
| Directory header **(r5)** | {total} households · {linked} linked · {invited} invited · {expired} invite expired · {failed} email failed · {not invited} not invited |
| Household pills **(r5)** | Not invited · Invited · expires {date} · Linked · 1 person · Linked · {n} people · Invite expired · Email failed |
| Invitation lines, household detail **(r5)** | Sent to: {email} or Printed slip, then " · Co-owner" or " · Family" for a person slot · Under it: Queued {date} · Sent {date} · Printed {date} · Status: the household pills above, or Used {date} · Actions on an unused line: Resend invitation (email, step 2) · Print slip · Withdraw invitation |
| People with portal access **(r5)** | {account name} · {account email} · {relation} · linked {date} · Empty: No one is linked to this lot. Invite the owner or print a slip. |
| Bulk confirm | **(r5)** Title: Send {n} invitations? (one: Send 1 invitation?) · if none can be emailed: No invitations to send · Lines: {m} households have no email. Print their slips instead. (one: 1 household has no email. Print its slip instead.) · {k} households are skipped: they are linked or already have an unused invitation. (one: 1 household is skipped: it is linked or already has an unused invitation.) · Buttons: Send {n} invitations · Print {m} slips · Cancel (nothing to do: Close). Lines with a count of 0 are not shown |
| Bulk done | **(r5)** {n} invitations queued. Any that fail are marked Email failed in the list. (one: 1 invitation queued. If it fails, it is marked Email failed in the list.) (in flight: Queuing…) |
| Bulk interrupted **(r5)** | Some invitations may not have been queued. Check your connection and press Invite selected again. Households already invited are skipped. |
| Print confirm | **(r5)** Title: Print {n} slips? (one: Print 1 slip?) · Printing makes new codes. Each household's earlier unused invitation for the owner, emailed or printed, stops working. Invitations for other people in the household keep working. · {j} of these households have an unused invitation. It stops working when you print. · {k} households are skipped because they are linked. · Buttons: Print {n} slips · Cancel (in flight: Printing…). For a person slot: Printing makes a new code. This person's earlier unused invitation stops working. |
| Print interrupted **(r5)** | The slips weren't made. Check your connection and try again. |
| Printed by someone else **(r5)** | Slips for {k} of these households were printed in the last hour by {staff name}. Those slips no longer work. |
| Remove confirm | Remove {name} from {lot}? They will no longer see this lot. Its bills and payments stay with the lot. |
| Already removed **(r5)** | {name} was already removed from {lot}. Nothing was changed. |
| Withdraw confirm **(r5)** | Withdraw this invitation? Its code stops working at once. You can invite again later. · Keep invitation · Withdraw (in flight: Withdrawing…) · Done: Invitation withdrawn. |
| Invite another person **(r5)** | Invite another person to {lot} · How is this person related to the household? Co-owner · Family · Email (step 2) · Send invitation (in flight: Queuing…) · Print slip · Cancel · Error: Choose how this person is related to the household |
| Change of owner **(r5)** | Change of owner for {lot} · Everyone linked to this lot loses access at once: {names}. Every unused invitation stops working. Its bills and payments stay with the lot. · New owner's name · New owner's email (optional) · New owner's mobile (optional) · Cancel · Change owner (in flight: Saving…) · Error: Enter the new owner's name · Done: {lot} now shows {new name} as owner. Invite the new owner when you're ready. (decision 7) |
| Settings → Invitations **(r5)** | Invitations · Emailed invitations expire after (days) · Printed slips expire after (days) · Changes apply to invitations made from now on. Invitations already made keep their date. · Save (in flight: Saving…) · Done: Saved. New invitations use these dates. · Error: Enter a whole number of days from 1 to 90. (decision 6) |
| Slip | {HOA name} resident portal · {lot} · Your invite code: {code} · **(r5)** Expires at the end of {date} (Philippine time) · 1. Go to {portal address} 2. Sign in or create an account 3. Enter the code |
| PDF footer | Delete this file after printing. |

## Out of scope

- Tenants and owners with several lots (D3). R1: each person is linked as owner, co-owner or family of one lot, and an account already linked elsewhere is refused.
- Self-registration with proof documents (Option C).
- Moving a person's account from one lot to another in one step (remove, then invite).
- Reminder emails for invitations not yet accepted.
- Bounce reports, if the owner says no to decision 3.
- What a new owner can see of the lot's history (decision 5, settled before the payments REQ).
- **(r5, G-9)** A list of removed people on the household detail page. Who was removed, by whom and when is in the activity log (backlog story 06).
- **(r5, G-6)** The activity log screen itself (backlog story 06). Until it ships, the log lines in this REQ are checked at data level.
- **(r5, G-11)** Telling a removed person why on the "Enter your invite code" page before they enter a code. They see the "access removed" message only if they re-enter their old code.
- **(r5, G-29)** Detecting a sale automatically. The office starts Change of owner when it learns of a sale (Open questions).

## Open questions

| Question | Who decides |
|---|---|
| Decisions for the owner, rows 1–5 | Owner (row 5 with the HOA's Data Protection Officer) |
| Email provider and sending domain (SA-001 Q7). Until chosen, only step 1 (printed slips) can ship. | Owner |
| Is there a limit on people per household? | HOA board |
| How will the office learn about sales, so the old owner is removed? (Nothing removes them automatically.) | Admin office |
| **(r5)** Owner decisions 6 to 9 | Owner |
| **(r5, G-29)** Will the office use Change of owner (or, if decision 7 is no, the removal checklist) on every sale, the day it learns of it? Who in the office owns that step? | Admin office |
| **(r5, G-5)** When a household reports a lost slip, will the office withdraw it the same day and print a new one? | Admin office |
| **(r5, G-32)** During the invitation drive, will the office split printing by block between staff, so two people don't print the same households? | Admin office |
| **(r5, Sol Arch C-2)** After Change of owner the portal keeps no copy of the seller's owner name or contacts. Is the office's own sale file enough when someone later asks who owned the lot? BA's recommendation: yes (data minimisation) | Admin office, with the HOA's Data Protection Officer |
| **(r5, G-28)** The confirm screen shows the owner name on file to anyone holding a code (approved in r3). Does this fit the HOA's privacy notice? BA's recommendation: keep it, because it is what stops honest mistakes, and Change of owner keeps it current | Owner, with the HOA's Data Protection Officer |

## r5 change log

Every gap from QA's "Requirement gaps for the BA" in TC-04 v1, G-1 to G-33. None is skipped.

| Gap | Answer | Where in this REQ |
|---|---|---|
| G-1 Expired as "unused" | No. Unused means active and not expired, so expired households are re-invited, not skipped. Their old code then shows "replaced" | Invitation rules "Unused"; scenario "An expired invitation does not block a new one" |
| G-2 Pill precedence | Linked wins; then Email failed, Invited, Invite expired, Not invited. Other people's invitations on a linked household show only on the detail page | Invitation rules "Which status…"; scenario outline "Which status a household shows" |
| G-3 How "Invite expired" appears; header counts | Worked out when read, from `expiresAt` (household keeps `inviteExpiresAt`), no job. Recommended to Sol Arch, who decides the mechanism. Header: five groups of active households that add up; inactive only in its chip. Sol Arch chose read time; every writer recomputes the status, never sets it directly (Sol Arch C-3) | Data "Link status" row; Invitation rules "Expired", "Header counts"; scenarios "A household turns…", "The directory header counts…"; Copy "Directory header"; Sol Arch (r5) Q1, Q2 |
| G-4 Does printing kill the email and a second person's invitation | Slot = the household's owner slot, or a person slot per "Invite another person". Printing replaces the owner's invitation, emailed or printed; other people's keep working. Print copy says exactly that | Invitation rules "Slots"; changed "Print code slips"; scenario "Printing a slip replaces…"; Copy "Print confirm"; Sol Arch (r5) Q3 |
| G-5 `cancelInvite` | **Specified, not removed.** Lost slips are real (slips work like keys), and printing a replacement is the only other way to kill one. "Withdraw invitation" on an unused line of the detail page, admin and treasurer, confirmed. A cancelled code, for any reason, says "This invitation is no longer valid. Ask the admin office." | Scenarios "Withdraw…" (three); Invitation rules "Withdraw"; Data; Copy "Withdraw confirm"; Open questions (lost-slip procedure) |
| G-6 Activity log screen | Unchanged requirement; the log screen is backlog story 06. Checked at data level until then | Data "Change records"; Out of scope |
| G-7 Expiry settings | New invitations only; whole days 1–90, 0 refused; missing means 7/30. Who edits and whether R1 has a screen: **owner decision 6** (recommended: admin office and treasurer, small Settings card). No settings card in the mock-up yet | Owner decision 6; scenarios "Changing how long…", "Expiry days must be…", "Board members, guards…", "With no setting stored…"; Data; Copy "Settings → Invitations"; Mockup changes |
| G-8 Manila wording, year | Email and slip say "at the end of {date} (Philippine time)"; every date shows the year | Scenario "Expiry dates show the year…"; Copy "Email body", "Slip", "Date format"; UX "Consistency" |
| G-9 After the last member; removed people in 4E | Status worked out again, normally "Not invited", never "Linked · 0 people"; empty-state line; removed people not listed (activity log keeps them) | Scenario "After the last person is removed"; Invitation rules "Removal"; Copy "People with portal access"; Out of scope |
| G-10 "Already removed" copy | "{name} was already removed from {lot}. Nothing was changed." | Scenario "Removing someone who was already removed"; Copy |
| G-11 Removed owner re-entering her code | Refused with "Your access to {lot} was removed by the admin office. Ask them if you think this is a mistake." Not counted. The r3 rule becomes "a person linked to the code's household → dashboard", so it no longer applies after removal | Changed "The person who used a code enters it again"; scenarios "A removed person re-entering…", "Someone else entering…"; Invitation rules "Code check order" step 7; Copy "Access removed" |
| G-12 Linked households in bulk | Skipped by "Invite selected" and "Print invite slips", counted as skipped; no row actions; use "Invite another person" | Scenario "Linked households are skipped…"; Invitation rules "Skipped in bulk" |
| G-13 Bulk copy at m = 0, n = 1, n = 0; skipped counts | {n} counts only households acted on; singulars; zero-count lines hidden; "No invitations to send" with a print route | Changed "Invite many…"; scenario outline "The bulk invite confirm…"; scenarios "The counts are what is actually done", "The print confirm says how many…"; Copy "Bulk confirm", "Bulk done", "Print confirm" |
| G-14 Email status display | Directory pill stays "Invited · expires {date}" while queued or sent; detail line reads Queued / Sent / Printed {date}; failed reads "Email failed"; never "delivered". Done message names "Email failed" | Scenario "The household detail shows each email's status"; Copy "Invitation lines", "Bulk done" |
| G-15 Resend while queued | The earlier queued email is not handed over; only the newest goes. Its mail status is `skipped`, never shown as Email failed (Sol Arch C-4) | Scenario "Resend while the earlier email is still waiting…"; Data "Invitation email"; Sol Arch (r5) Q4 |
| G-16 Contact email edited | The owner slot doesn't depend on the address, so Resend replaces the invitation to the old address | Invitation rules "Slots"; scenario "Resend after the contact email is corrected" |
| G-17 Relations | Owner for the owner slot; "Co-owner" or "Family" for another person, required, no default; no tenant | Changed "Send an invitation"; Invitation rules "Relation"; scenario "The relation must be picked"; Copy "Invite another person" |
| G-18 Name in "People with portal access"; replaced and cancelled lines | The person's own account name and email (the lost-slip safeguard), copied onto the membership at link time (Sol Arch C-5). Replaced and withdrawn invitations are not listed; current and used ones are | Scenario "Who the household detail lists"; UX "Privacy"; Copy "People with portal access", "Invitation lines" |
| G-19 Member entering another code for the same household | Lands on the dashboard with a notice; the code is not consumed | Scenario "A linked person enters another unused code…"; Invitation rules step 4; Copy "Own household's other code" |
| G-20 Mock-up vs copy mismatches | "Resend" → "Resend invitation"; "Manage" dropped (lot name opens detail); 4F's "Send 380 invitations" and "Print 20 slips" adopted into the copy; 4A footer adopted; Remove confirm is "They will" (Gherkin corrected); invitation-line words "Used {date}" and "Sent {date}" adopted | Changed "Invite many…", "Removing a person…", "An email the provider refuses…", "…bounces later…"; Copy rows; UX "Consistency"; Mockup changes |
| G-21 Step 1 UI | Email controls are not shown at all in step 1; every unlinked household offers "Print slip". Second people by slip: **owner decision 8** | Scenario "Before the email provider is chosen"; Invitation rules "Step 1"; owner decision 8 |
| G-22 Empty or malformed codes | Checked on the page: "Enter the code from your invitation." or the 8-character message; not sent, not counted. The server refuses them too, without counting (Sol Arch C-6) | Scenario outline "A code the page can tell is not a code"; Copy; Data "Wrong-code attempts" |
| G-23 Reset on link; locked refusals | A successful redeem sets the count back to 0. Codes entered while locked don't extend the window | Scenarios "A successful link clears…", "Codes entered while locked…"; Data "Wrong-code attempts" |
| G-24 Message precedence | One ordered list of eleven checks | Invitation rules "Code check order"; scenario outline "Which message wins…" |
| G-25 Network or server error | Offline line, "We couldn't check the code…" and "We couldn't link your account…"; code kept; a retry after a lost reply lands on the dashboard. Staff bulk and print interruptions have their own lines | Scenario outline "The connection fails…"; scenario "Pressing 'Yes, link my account' again…"; Copy rows |
| G-26 Removed member's open screen | Changes to "Enter your invite code" within a minute while online (matches REQ-002); on next load in any case | Changed "Removing a person after a sale"; Invitation rules "Removal"; Sol Arch (r5) Q8 |
| G-27 Members of a deactivated household | **Owner decision 9.** After Sol Arch's cost note the recommendation is now option c: refuse deactivation while anyone is linked. Read-only (a) and remove-everyone (b) are the alternatives. Remove works from the Inactive list, there are no invite controls while inactive, and Reactivate doesn't bring codes back | Owner decision 9; scenarios "Deactivating a household that still has people linked", "People linked to a household that is deactivated" (option a), "Deactivating stops codes for good"; Copy "Deactivate refused", "Inactive household notice"; Data "Invitation", "Link status" |
| G-28 New owner sees the previous owner's name | Fixed in the procedure and the software together: Change of owner sets the new name before any invitation. Whether showing the owner name at all fits the privacy notice is in Open questions (owner with DPO) | Owner decision 7; scenario "The new owner sees her own name…"; UX "Privacy"; Open questions |
| G-29 Old owner's family stays linked | **Owner decision 7** (recommended: a "Change of owner" action that removes everyone). Whether the office does it on every sale is the **admin office's** call. Refused if someone joined or left while the form was open (Sol Arch C-1); search words rewritten, seller's name and contacts not kept (Sol Arch C-2; office and DPO to confirm) | Owner decision 7; scenarios "Change of owner…", "The change of owner form…", "Someone joins or leaves while…"; Data "Change of owner"; Copy "Change of owner, list changed"; Open questions |
| G-30 After "No, this isn't my lot" | Code cleared from the page and the session; back on "Enter your invite code" with the wrong-lot line; the code stays usable for the right person | Scenario "'No, this isn't my lot' clears the code"; Copy "Wrong lot" |
| G-31 Used code re-entered after expiry | Dashboard, because the person is linked to that household (check order step 4) | Changed "The person who used a code enters it again"; outline "Which message wins…" last row |
| G-32 Two staff printing the same households | One working code is guaranteed (r3). The second printer is told whose slips stopped working; the office splits printing by block (**admin office**) | Scenarios "Two staff print slips…", "The print confirm says how many…"; Copy "Printed by someone else"; Open questions; Sol Arch (r5) Q5 |
| G-33 In-flight states | Every button that makes or stops an invitation is disabled with its in-flight word, and acts once | Scenario outline "Buttons that make or stop invitations act once"; UX "Safe actions"; Sol Arch (r5) Q9 |

**Mockup (r5) changes needed** (the mockup file is not edited in this revision): **3A**: header to "623 households · 412 linked · 148 invited · 9 invite expired · 3 email failed · 51 not invited"; row buttons "Resend" → "Resend invitation"; drop "Manage" on linked rows and make the lot name a link; pill dates with the year ("Dec 5, 2026"). **4A**: body line to "expires at the end of Dec 5, 2026 (Philippine time)". **4B/4D**: add the empty, malformed, offline, server-error, "access removed" and "own household's other code" messages. **4E**: People lines with the account email; Remove confirm "They will"; Invitations lines with Queued / Sent / Printed and the year; "Resend invitation" and "Withdraw invitation" on unused lines; "Change of owner" button; empty "People with portal access" state. **4F**: skipped line and the n = 0 / n = 1 variants; done line "Any that fail are marked Email failed in the list." **4G**: print confirm with the owner-slot wording and the "{j} … stops working" line; slip "Expires at the end of Dec 28, 2026 (Philippine time)". **New screens:** Withdraw confirm; Invite another person (relation, email, Send invitation, Print slip); Change of owner form, including its "Someone joined or left…" state (r5, Sol Arch C-1); Settings → Invitations card; the deactivate refusal on REQ-003's screen (decision 9 option c), or the inactive-household notice if the owner picks option a; the step-1 directory with print controls only.

## Sol Arch review (r5)

*Sol Arch, 2026-11-28, draft.* Reviewed the r5 diff against approved r3, SA-001 (`docs/sa-001-architecture`, §8.1, ADR-004, ADR-002), REQ-002 and REQ-003. **Verdict: supports with changes.** Every r5 rule can be built on Firestore, Cloud Functions and Auth with no new service. Six text changes are needed before approval (listed after the answers). Answers follow the questions.

Review only the scenarios tagged `@r5-new` or `@r5-changed` and the lines marked (r5). The BA's questions for this review, each touching architecture:

1. **G-3, expired status.** The BA recommends working "Invite expired" out when read: `households.linkStatus` stays `invited` and a new `inviteExpiresAt` holds the latest expiry of the household's unused invitations; the directory, chip and count compare it with now (end of day, Asia/Manila). The alternative is a daily job at 00:00 Manila that rewrites `linkStatus`. Which do you choose? Can the "Invite expired (n)" chip and header counts be indexed queries and count aggregations without reading every row?
2. **G-3, G-2, header counts.** Five groups of active households that add up to the total, using the status order in Invitation rules. Can `linkStatus` + `inviteExpiresAt` support that order (for example "Email failed" wins over "Invited" when a co-owner's email failed), or do we need more household fields?
3. **G-4, G-16, slots.** This replaces your r1 slot "household plus recipient (an email, or "print")" with an owner slot per household plus a person slot per "Invite another person". Please confirm the field (`slot`), the one-active-per-slot transaction, and the index change on `invites`.
4. **G-15, stale queued email.** Can the mail function check, just before hand-off, that the invitation is still active, and if not skip it and clear the code? Which `mail` status records that?
5. **G-32, two printers.** Can `createInvites` report, in its response to the second printer, which replaced print invitations were made in the last hour by another staff member (by name)? Or would you rather refuse those households unless the admin confirms?
6. **G-5, Withdraw.** `cancelInvite` gains a screen caller and a `cancelReason`. Confirm it refuses used invitations, is admin/treasurer only, and writes one audit entry even on a double press.
7. **G-29, Change of owner (decision 7).** A new `changeOwner` function: one transaction that deletes every `members` doc for the household, cancels every unused invitation, writes the new `displayName`, replaces `householdContacts` and resets `linkStatus` and `memberCount`. It reuses REQ-003's household validation. Size it, and say whether a household with many members fits one transaction comfortably.
8. **G-26, removal on an open screen.** "Within a minute while online" for a removed homeowner, matching REQ-002 for staff. Is a listener on the person's `members` doc the way, and what does it cost?
9. **G-33, double presses.** Server-side guard for Invite, Resend invitation, Send invitation, print, Withdraw and Change owner, so two quick presses make one invitation and one email (an idempotency key per press, or the existing transaction?).
10. **G-11, G-19, G-24, G-31, check order.** `checkInvite` and `redeemInvite` follow the eleven-step order in Invitation rules. Step 7 ("used by this same person, no longer linked") needs `usedBy` kept on used invitations after removal. Step 4 must not consume another person's unused code. Confirm both, and that a lost-reply retry of `redeemInvite` lands on the dashboard without a second member.
11. **G-22, G-23, attempts.** Malformed codes are refused on the page and never counted; does the server also refuse them without counting? A successful redeem sets `inviteAttempts/{uid}` back to 0.
12. **G-7, settings (decision 6).** Whole days 1–90, enforced in rules or a function, written by admin and treasurer, with an audit entry holding old and new values. Which: a rules-checked client write or a callable?
13. **G-27, deactivated households (decision 9).** Read-only for members: rules allow reads but refuse homeowner writes when `households.active` is false; `createInvites` refuses inactive households; `removeMember` works on them.
14. **G-18, people list.** Staff read the linked person's name and email from `users/{uid}` for the detail page. Is that read allowed by the `users` rule for admin and treasurer, or should `redeemInvite` copy the name and email onto `members`?
15. **G-21, step 1.** How does a step-1 build know email is off: a setting, or a build flag? The email controls must not appear at all.

**Answers**

1. **Supports: work it out at read time, no daily job.** Store `inviteExpiresAt` as the exact instant the last day ends (00:00 Asia/Manila the next day). "Invited" is `active == true, linkStatus == 'invited', inviteExpiresAt > now`. "Invite expired" is the same filter with `<= now`. Both are indexed queries, and the header uses `count()` aggregations (no row reads), with a composite index on (`active`, `linkStatus`, `inviteExpiresAt`). A job would show stale pills until 00:00 and add a scheduler for no gain.
2. **Supports with changes.** Two fields are enough if `linkStatus` holds only linked / email failed / invited / not invited, and each household sits in exactly one, so five counts add up. The condition: **every writer recomputes `linkStatus` and `inviteExpiresAt` from the household's invitations and members, in the same transaction, using the status order.** The writers are `createInvites`, `cancelInvite`, `redeemInvite`, `removeMember`, `changeOwner`, REQ-003's deactivate, and the mail function on failure. They never just overwrite the value. Example: a co-owner's failed email must not overwrite "linked". One shared helper, unit-tested against the outline "Which status a household shows".
3. **Supports.** Field `slot`: `owner`, or `person-{id}` generated by "Invite another person". Index (`householdId`, `slot`, `status`). The one-active-per-slot transaction queries the slot's active invitation and marks it `replaced`. The important part: **every invite and member transaction also reads and writes `households/{id}`** (for the recount). That serialises them, so two printers or a redeem racing a Change of owner can't both win. An expired-but-active invitation is replaced the same way, so it reads "replaced", as G-1 says. SA-001 follow-up (§8.1, §4.2): replace "household and recipient" with the slot.
4. **Supports with changes.** `mail` docs carry the invite id (`codeHash`). Just before hand-off, the mail function re-reads the invitation. If it is not `active`, it doesn't send, clears the code and body, and sets a new status, **`skipped`**. `skipped` never counts as Email failed. A seconds-long window between the check and the hand-off remains; at worst the old email arrives with a dead code. SA-001 follow-up: add `skipped` to ADR-002.
5. **Supports: report, don't refuse.** `createInvites` returns, per household, any replaced print invitation made in the last hour by another uid, with `staff/{uid}.displayName`. Refusing would need a second round trip, and the old codes are already dead by then. The confirm counts ("{j} … have an unused invitation", skipped counts) should come from a dry-run call of `createInvites`, not from up to 623 client queries.
6. **Supports.** Admin/treasurer only (`isStaff` double check, SA-001 §8.1). The transaction refuses `used`. If the invitation is already `cancelled`, it returns "done" and writes nothing, so a double press makes one audit entry. Audit and status change commit together, and the status is recomputed (answer 2).
7. **Supports with changes. Size 0.5–1 day, including the emulator rules tests.** One household is a few members and invitations plus the household, contacts and audit docs, so the transaction writes well under 20 documents. That fits comfortably. The member query must run inside the transaction. **Stale-screen guard (two-guard rule):** the call sends the member uids the confirm screen listed, and refuses if they changed. Otherwise someone who linked after the screen opened is removed without the admin seeing their name. It must also rewrite `searchTokens` (REQ-003 search), or the new owner can't be found by name. The confirm screen shows staff the linked people's names, which is fine for staff. Only the homeowner confirm screen (Open questions, G-28) needs the DPO.
8. **Supports.** Use an `onSnapshot` listener on `members/{hh}_{uid}`: one read when it attaches, one per change, and a fresh read after a long offline spell. Trivial. The change shows within seconds, not just within a minute. After deletion the listener may get `permission-denied` instead of "doc missing". Treat both as removed.
9. **Supports: the existing transaction, plus an expected-state check.** Invite, Resend, Send invitation, Withdraw and Change owner send what the screen showed: the slot's current active invitation id (or none), or the member list. They refuse or return "already done" if it changed. That stops a second device too. Print is different: codes are seen only once, so a retry after a lost reply must make new codes. Print relies on the in-flight flag, one active per slot, and the notice in answer 5.
10. **Confirms all three.** Step 4 checks that `members/{code.householdId}_{uid}` exists. It must not compare `usedBy`. It also never writes to a code that isn't used. `usedBy` is never cleared, so step 7 works after removal or Change of owner. A lost-reply retry hits step 4 and returns the dashboard. The member doc id is deterministic, so no second member can exist. Step 5 needs an index on `members.uid`.
11. **Supports.** The server repeats the format check (length cap, fixed 32-character alphabet, no regex quantifiers, per CODING-STANDARDS S8786). It refuses with `invalid-argument` and doesn't count it. The reset to 0 happens in the `redeemInvite` transaction.
12. **Callable (`setInviteExpiry`).** Rules can check 1–90, but they can't write the old/new audit entry atomically. A callable also keeps field-level rules off the shared `config/settings` document. Decision 6 cost: about 0.5 day either way.
13. **Supports with changes.** "Can't submit anything" means one extra `get(households/{hh})` in every homeowner create/update rule (`isActiveMember(hh)`) and the same check in every homeowner callable. It is cheap per request, but **it becomes a permanent row in REQ-002's rules matrix that every later REQ must add and test**. Decision 9 alternative (deactivate removes everyone) reuses `changeOwner`'s removal code and adds no rule. That is the technical trade-off for the owner. `removeMember` works on inactive households; `createInvites` refuses them. SA-001 follow-up (§8.1): the rules helper.
14. **Copy onto `members`.** `redeemInvite` writes `name` and `email` from the signed-in account (Auth token) at link time. Reading `users/{uid}` would widen a self-written document's rule for staff. The link-time snapshot is the lost-slip evidence anyway.
15. **A server-written setting, not a build flag:** `config/features.emailInvites`, read-only to clients and changed by the developer. `createInvites` and the mail function refuse email while it is off, so hiding the controls isn't the only guard. A build flag can differ between staging and production builds. SA-001 follow-up: name the doc in §4.2.

**Required changes to the requirement text (BA)**

- **C-1 (Q7):** add a Change of owner scenario and copy for when someone joins or leaves while the form is open: refused, and the list is shown again. Suggested: "Someone joined or left {lot} since you opened this. Check the list and try again."
- **C-2 (Q7):** Data "Change of owner" row: add `searchTokens`, and say whether the seller's name is kept anywhere. With "ids only" it is lost from the record.
- **C-3 (Q2, REQ-003):** Data "Invitation" row: add REQ-003's deactivate function as a writer (`cancelReason` deactivated). State that "Reactivate" doesn't bring back cancelled codes. Data "Link status" row: "recomputed by every writer, never set directly".
- **C-4 (Q4):** Data "Invitation email" row: the status of an email that wasn't sent is `skipped`, never shown as Email failed.
- **C-5 (Q14):** Data "Membership" row: add name and email, copied from the account at link time.
- **C-6 (Q11, Q13):** add "the server refuses it too" to the format-check outline. Add "a direct write from her account is refused" to the deactivated-household scenario.

> **BA note (r5):** C-1 to C-6 are applied to the Gherkin, copy of record and Data changes above, marked "Sol Arch C-n". The cost note in answer 13 changed the BA's recommendation on owner decision 9 to option c (refuse deactivation while anyone is linked). The owner still decides.

## Sol Arch review

> **BA note (r2):** the corrections Sol Arch asks for under "Criteria to change" are already applied to the criteria, copy and data above. What needs the owner is listed under "Decisions for the owner" at the top.

*Sol Arch, 2026-11-28, draft.* Reviewed against SA-001 r1 §8.1, ADR-004 and ADR-002 (Draft, `origin/docs/sa-001-architecture` at `b020b40`).

**Verdict: Supports with changes.** Option A, built in two steps, is right. Storing codes hashed is correct, and it means a code can be seen **only at the moment it is made**. That changes how slips are printed and how a double "Invite selected" behaves. The rate limit must be per account. The "Email failed" scenario only covers refusals at hand-off.

#### Options

| Option | Feasible? | Cost (BA's read) | Sol Arch |
|---|---|---|---|
| A: email link + printed slips (two steps) | Yes | Moderate | **Agree.** Step 2 depends on ADR-002's provider and the HOA's sending domain (SA-001 Q7). |
| B: printed slips only | Yes | Cheap | Agree. It is step 1 of A. |
| C: self-registration with proof | Yes | Moderate | **Disagree: a project.** It needs a document upload, a review queue, retention and deletion of copies of titles and IDs, and a DPO sign-off. It also brings back R-6 (wrong linking) through human judgement. Not supported. |

**I support Option A in two steps.**

**Design answers to the BA's questions:**
1. **Codes stored hashed: confirmed, with a secret key.** Store `HMAC-SHA256(key, normalisedCode)` as the invitation's document id (`invites/{codeHash}`). That gives a direct lookup with uniqueness built in. The key is kept in Secret Manager. A plain unkeyed hash is not enough: 8 characters from a 32-character alphabet is about 1.1 × 10¹² codes, few enough to try every one offline if the database or a backup leaked. **Consequences:**
   - **Printing makes new codes.** "Print invite slips" creates (or replaces) the invitations at that moment, and the browser builds the PDF from the response. Nothing can "reprint" an old code.
   - **The email needs the code.** The `mail` document holds it in plain text until it is sent. The mail function clears the code and body once the status is `sent` or `failed`, and only functions can access `mail` (ADR-002).
   - **The link carries the code in the URL fragment** (`…/join#K7QXM9TA`). Browsers don't send the fragment to the server, so the code stays out of Hosting logs and referrers. The app keeps it in `sessionStorage` through sign-in, including the Google popup, and clears it after redeeming.
2. **Wrong-code limit: per account (uid), enforced in `redeemInvite`.** A document `inviteAttempts/{uid}` holding `{windowStart, failures}` is updated in the same transaction as the lookup. At 5 failures in 15 minutes, the function refuses without looking the code up. Creating extra accounts gets around a per-account limit, but that is still enough here. Firebase limits new accounts to 100 per hour per IP address ([Auth limits](https://firebase.google.com/docs/auth/limits)), App Check is on (SA-001 §8.3), and with about 1,000 live codes among 1.1 × 10¹², each guess has roughly a 1-in-a-billion chance. Add a project-wide alert on wrong codes (for example more than 50 an hour). Only "doesn't match" counts as a failure. "Expired" and "already used" tell a guesser nothing useful.
3. **Expiry: I support the BA's 7 days for email and 30 days for printed slips**, as settings (`config/settings.inviteExpiryDays.email` / `.print`), not constants. The risk of the longer life: whoever finds a lost slip can redeem it, and seeing the owner name on the confirm screen stops honest mistakes, not theft. Mitigations: the directory shows who linked, the activity log records it, and the office can Remove. In step 2, send a notice to the household's contact email when someone links. An invitation expires at the **end of the date shown, Asia/Manila time**.
4. **Two people redeeming at once: feasible as written.** `redeemInvite` does everything in one Firestore transaction. It reads the invitation, refuses unless it is `active` and not expired, then marks it `used` and creates `members/{householdId}_{uid}`. Server libraries on the Standard edition use pessimistic locks, so the second transaction waits and then sees `used` ([contention](https://firebase.google.com/docs/firestore/transaction-data-contention)). Prove it with an emulator test of 10 parallel calls plus a negative control (CS-8).

#### Criteria to change (quoted, then corrected)

1. **"Guessing codes is stopped: Given someone has entered 5 wrong codes in 15 minutes"**. "Someone" can't be enforced. A function cannot reliably tell devices or people apart, but it can tell accounts apart. Corrected:
   ```gherkin
   Scenario: Guessing codes is stopped
     Given Ana's account has had 5 codes refused as not matching in the last 15 minutes
     When she enters another code, right or wrong
     Then she sees "Too many wrong codes. Try again in 15 minutes."
     And the code is not checked
     And 15 minutes after her first refused code she can try again
   ```
2. **"A code can be used only once"**. Add the case of the same person entering the code again (a double tap, a second device). They should be let in, not refused:
   ```gherkin
   Scenario: The person who used a code enters it again
     Given Ana linked her account with "K7QX-M9TA"
     When Ana enters "K7QX-M9TA" again
     Then she lands on the Blk 2 Lot 7 dashboard
   ```
3. **"Then the old code shows "This invitation was replaced by a newer one." if used"**. Reword so it is testable and the message says what to do next (CS-4):
   ```gherkin
   Scenario: Resending replaces the old invitation
     Given an unused invitation for Blk 2 Lot 7
     When the admin presses "Resend invitation"
     Then a new invitation to "ana@example.com" is queued
     When anyone enters the old code
     Then they see "This invitation was replaced by a newer one. Use the newest invitation, or ask the admin office."
   ```
   Update the copy of record to match. The replacement happens in one transaction: the old code is marked `replaced` and the new one created together, so two staff pressing Resend at once leave exactly one active code.
4. **"Then 380 invitations are queued and the button reads "Sending…" until it finishes"**. The button finishes when the invitations are *queued*, not sent (CS-12). Also, a second press would replace all 380 codes just emailed and make the first emails useless. Corrected:
   ```gherkin
   When they confirm
   Then the button reads "Queuing…" and is disabled until all 380 are queued
   And they see "380 invitations queued. Each household shows its email status."
   When the admin presses "Invite selected" again for the same households
   Then households that already have an unused invitation are skipped, not re-invited
   ```
5. **"Print code slips … Then a PDF downloads with one slip per household"**. Because codes are hashed, printing makes new codes. Add before the download: `Then they see "Printing makes new codes. Any earlier unused code for these 20 households will stop working." and confirm`, plus `And the PDF shows "Delete this file after printing."` (the file holds live codes).
6. **"A failed email is shown, not hidden: Given the mail service reports the invitation to "ana@example.com" failed"**. ADR-002 records failure only when the provider refuses the message at hand-off. A later bounce (the mailbox doesn't exist) is reported only through provider events, which ADR-002 doesn't include. Corrected: `Given the email provider refused the invitation to "ana@example.com" when it was handed over`. Either add "bounces reported after hand-off" to Out of scope, or add the provider's bounce events to step 2 (+0.5–1 day once the provider is chosen).
7. **"Accept an emailed invitation … signs in or creates an account"**. Add `including with "Continue with Google"`, and `And the code is kept through sign-in without her typing it`.
8. **"Removing a person after a sale … Then Ana no longer sees Blk 2 Lot 7"**. This can be met at once, because rules check that the `members` document exists, with no token involved. Add `And any unused invitation for Blk 2 Lot 7 stops working` (the office must re-invite the new owner).

**Missing scenarios (BA to word, owner to decide):**
- **A person already linked to another lot enters a code (D3).** Recommended for R1: refuse with "Your account is already linked to {lot}. Ask the admin office if you need access to another lot."
- **A code for a deactivated household:** refuse with "This invitation is no longer valid. Ask the admin office."

#### Data

- `invites/{codeHash}`: `householdId`, `channel` (`email` / `print`), `sentTo` (email or null), `relation` (chosen by the admin, as the BA recommends), `createdBy`, `createdAt`, `expiresAt`, `status` (`active` / `used` / `replaced` / `cancelled`), `usedBy`, `usedAt`, `replacedBy`, `mailId`. **Change:** don't store `expired` as a status, because nothing would write it on time. Work it out from `expiresAt`. "One active invitation per person slot": define the slot as the household plus the recipient (an email, or "print"). Staff may read invitations for a household; homeowners never.
- `members/{householdId}_{uid}`: **confirmed** (ADR-004). Fields: `householdId`, `uid`, `relation`, `inviteId`, `invitedBy` (the REQ's "added by"), `linkedAt`. SA-001's `canPay` has no writer or reader in this REQ. Drop it until the payments REQ needs it, or default it to true for owner and co-owner.
- `inviteAttempts/{uid}`: functions only; the daily job deletes old windows.
- `mail/{id}`: per ADR-002, with the code removed after send.
- `households/{id}.linkStatus` and `memberCount`: kept by these functions, so the directory needs no lookup per row (see the REQ-003 review).
- **Functions** (SA-001 §3 names only `linkHousehold`): `createInvites` (one or many; skips households with an unused invitation unless it is a resend), `checkInvite` (returns the lot and owner name for the confirm screen and counts towards the limit), `redeemInvite`, `removeMember` (transaction; "already removed" if the document is gone), `cancelInvite`.
- **Rules:** no client access to `invites`, `inviteAttempts` or `mail` except staff reading `invites` by household. `members` can be read by the member and by staff; no client writes.
- **Index:** `invites` on (`householdId`, `status`, `createdAt` desc).
- `auditLog`: `invite.created` / `replaced` / `cancelled` / `redeemed`, `member.removed`. Ids only.

#### Risks not covered

- **Privacy after a sale (RA 10173): the biggest open risk.** "Its bills and payments stay with the lot" means the new owner, once linked, sees the lot's history. That includes the previous owner's receipts with their name and their uploaded payment screenshots, which can show their e-wallet name and number. Options: members see records from their `linkedAt` date only, or proofs are visible only to the uploader and staff. This doesn't block REQ-004, but **it must be decided before the payments REQ (EPIC-003)**. Maps to proportionality; requester and DPO to confirm.
- **Shared family mailboxes.** Anyone who opens the email can join. This is accepted by design (ADR-004). The confirm screen and Remove are the safeguards.
- **The office knows about a sale only if told.** Nothing removes the old owner automatically, so put it in the office procedure.
- **Provider sending limits are unknown** until the provider is chosen. 623 invitations in a day may exceed a free tier, so the mail function paces sending and statuses stay "queued" meanwhile. Staging mail goes only to the allow-list (ADR-005).
- **Printed slips work like cash.** Anyone holding one can link to the lot. Hand them over in person or in a sealed envelope.
- **Observability:** alerts on wrong-code spikes and `mail` failures, plus a weekly count of invitations that expired unused.
- **Cost:** about 4 writes per invitation, so about 2,500 for all 623 households. Trivial.

#### SA-001 follow-ups (recommended revisions; I have not edited SA-001)

- §8.1 "single-use code, 7-day expiry": change to per-channel expiry settings (7 email, 30 print, if the owner agrees); codes stored as a keyed hash used as the document id; the plain code exists only at creation; `mail` documents cleared after send.
- §3: rename `linkHousehold` to `redeemInvite`, and add `createInvites`, `checkInvite`, `removeMember`, `cancelInvite`.
- §4.2: add `INVITES` and `INVITE_ATTEMPTS`, add the `members` fields above, and decide `canPay`.
- ADR-002: say that "failed" covers refusal at hand-off only; bounces need provider events.
- §11.1: add the risk of the previous owner's history being visible after a sale.
- §12: phase 1 estimates B at 4–6 days for sign-in, invites, roles and rules. These four REQs come to about 16–23 days (below), and the import was excluded from SA-001's estimates (R-8). Revise the roadmap.

#### Size

Step 1 (codes, print slips, code entry, confirm, redeem, remove, rate limit, directory status, concurrency tests): **4–5 person-days with Claude Code**. Step 2 (email): **2–3**, of which the mail function itself (about 1.5) is shared with every later email feature (SA-001 area H).

#### Sources (fetched 2026-11-28)

[Auth limits (100 accounts/hour per IP)](https://firebase.google.com/docs/auth/limits) · [Transaction data contention (pessimistic locking on server libraries)](https://firebase.google.com/docs/firestore/transaction-data-contention) · [Transactions](https://firebase.google.com/docs/firestore/manage-data/transactions)

#### Size with mock-up reuse (2026-11-28, replaces the size above)

**5.75–7.75 person-days with Claude Code** (was 6–8 (step 1 4–5 + step 2 2–3)). Re-sized under the owner's rule to reuse what is already in the repo (L-006), in [REVIEW-sizing-reuse.md](../architecture/REVIEW-sizing-reuse.md), approved by the owner on 2026-11-28 ("APPROVED — FINAL: sizing reuse review, merge it").

- **Parts** (port UI · extend UI · new UI · back end · tests): 0 · 0.25 · 1–1.25 · 3.5–4.75 · 1–1.5
- **Reuses:** Extend: an invite status column in `aHo()` 760, invitations in `hoDetail` 1383. New: code entry, confirm lot, code errors, printed slips, invite many (drawn 557–565). BE includes the shared mail function (about 1.5)
