'use strict';

const {
  fileSafeLoad
} = require('../../utils/file');

const SitBase = require('../base/SitBase');

const REF_REMOTE_HEADER = ['branch', 'sha1'];

class SitRefParser extends SitBase {
  constructor(branch, refFile) {
    super();
    this.branch = branch;
    this.refFile = `${this.localRepo}/${refFile}`;
  }

  parseToCSV() {
    const loadData = fileSafeLoad(this.refFile).trim();
    const sha = loadData;
    return [
      REF_REMOTE_HEADER,
      [this.branch, sha]
    ];
  }
}

module.exports = SitRefParser;
