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
  constructor(repo, branch, refFile) {
    super();
    this.repo = repo
    this.branch = branch;
    this.refFile = `${this.localRepo}/${refFile}`;
  }

  parseToCSV() {
    const { err, data } = fileSafeLoad(this.refFile);
    if (err) die(err.message)
    const commitHash = data.trim();
    const blobHash = this.repo._refBlobFromCommitHash(commitHash);
    return [
      REF_REMOTE_HEADER,
      [this.branch, blobHash]
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
