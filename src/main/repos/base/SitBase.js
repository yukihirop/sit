'use strict';

const SitSetting = require('../../SitSetting');

const INITIAL_HASH = '0000000000000000000000000000000000000000';

class SitBase {
  constructor() {
    this.localRepo = SitSetting.repo.local;
    this.homeDir = process.env[process.platform == "win32" ? "USERPROFILE" : "HOME"];
  }

  _INITIAL_HASH() {
    return INITIAL_HASH;
  }
}

module.exports = SitBase;
