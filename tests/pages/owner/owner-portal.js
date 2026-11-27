const { RolePortal } = require('../role-portal');
const { OwnerVehiclesPage } = require('./owner-vehicles-page');

class OwnerPortal extends RolePortal {
  static get VIEWS() {
    return [
      { view: 'dashboard', label: 'Dashboard' },
      { view: 'dues', label: 'Dues & Payments' },
      { view: 'amenities', label: 'Book Amenities' },
      { view: 'vehicles', label: 'My Vehicles' },
      { view: 'requests', label: 'Requests & Complaints' },
      { view: 'passes', label: 'Guest Passes' },
      { view: 'records', label: 'Request a Report' },
      { view: 'news', label: 'Announcements' },
    ];
  }

  async vehicles() { await this.goTo('vehicles'); return new OwnerVehiclesPage(this.page); }
}

module.exports = { OwnerPortal };
