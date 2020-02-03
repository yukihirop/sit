'use strict';

const SitSetting = require('../../SitSetting');
const INITIAL_HASH = '0000000000000000000000000000000000000000';

class SitBase {
  constructor() {
    this.localRepo = SitSetting.repo.local;
  }

  _INITIAL_HASH() {
    return INITIAL_HASH;
  }
}

module.exports = SitBase;
