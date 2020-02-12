'use strict';

const {
  fileSafeLoad
} = require('../../utils/file');

const {
  colorize
} = require('../../utils/string');

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

  isRemote() {
    return this.refFile.indexOf('refs/remotes') !== -1
  }

  displayedBranch() {
    if (this.isRemote()) {
      return colorize(`remotes/${this.branch}`, 'mark')
    } else {
      return this.branch
    }
  }
}

module.exports = SitRefParser;
