const { RolePortal } = require('../role-portal');

class GuardPortal extends RolePortal {
  static get VIEWS() {
    return [
      { view: 'dashboard', label: 'Scan Pass' },
      { view: 'inside', label: 'Visitors Inside' },
      { view: 'glog', label: "Today's Log" },
    ];
  }
}

module.exports = { GuardPortal };
