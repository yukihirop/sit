'use strict';

const SitSetting = require('../../SitSetting');

const INITIAL_HASH = '0000000000000000000000000000000000000000';

const HOME_DIR = process.env[process.platform == "win32" ? "USERPROFILE" : "HOME"];

class SitBase {
  constructor() {
    this.localRepo = SitSetting.repo.local;
    this.homeDir = HOME_DIR;
  }

  _INITIAL_HASH() {
    return INITIAL_HASH;
  }

  static homeDir() {
    return HOME_DIR;
  }
}

module.exports = SitBase;
