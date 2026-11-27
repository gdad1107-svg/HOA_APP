const { RolePortal } = require('../role-portal');
const { AdminApprovalsPage } = require('./admin-approvals-page');

class AdminPortal extends RolePortal {
  static get VIEWS() {
    return [
      { view: 'dashboard', label: 'Dashboard' },
      { view: 'approvals', label: 'Approvals' },
      { view: 'homeowners', label: 'Homeowners' },
      { view: 'accounting', label: 'Accounting' },
      { view: 'collections', label: 'Collections & Notices' },
      { view: 'tickets', label: 'Requests & Complaints' },
      { view: 'rrq', label: 'Report Requests' },
      { view: 'visitors', label: 'Visitor Log' },
      { view: 'reports', label: 'Reports' },
      { view: 'news', label: 'Announcements' },
      { view: 'settings', label: 'Settings' },
    ];
  }

  async approvals() { await this.goTo('approvals'); return new AdminApprovalsPage(this.page); }
}

module.exports = { AdminPortal };
