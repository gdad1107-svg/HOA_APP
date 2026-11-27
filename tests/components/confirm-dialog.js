// confirmBox(): the app's confirm step, rendered in #modal with Cancel + an OK button
// (data-act="confirmOk"). Callers decide whether to confirm; this component never decides
// for them.
const { Modal } = require('./modal');

class ConfirmDialog extends Modal {
  constructor(page) {
    super(page);
    this.okButton = this.dialog.locator('[data-act="confirmOk"]');
    this.cancelButton = this.footer.locator('[data-act="close"]');
  }

  async confirm() { await this.okButton.click(); await this.expectClosed(); }
  async cancel() { await this.cancelButton.click(); await this.expectClosed(); }
}

module.exports = { ConfirmDialog };
