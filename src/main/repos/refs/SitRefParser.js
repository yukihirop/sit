'use strict';

const {
  fileSafeLoad,
} = require('../../utils/file');

const {
  colorize,
} = require('../../utils/string');

const SitBase = require('../base/SitBase');

const REF_REMOTE_HEADER = ['branch', 'sha1'];

class SitRefParser extends SitBase {
  constructor(repo, branch, refFile) {
    super();
    this.repo = repo;
    this.branch = branch;
    this.relativeRefFile = refFile;
    this.refFile = `${this.localRepo}/${refFile}`;
  }

  parseToCSV(replaceBlob = true, isHeader = true) {
    const { err, data } = fileSafeLoad(this.refFile);
    if (err) die(err.message);
    let commitHash = data.trim();
    let hash;

    if (data.startsWith('ref: ')) {
      commitHash = this.repo._refResolve(data.slice(5));
    }

    if (replaceBlob) {
      hash = this.repo._refBlobFromCommitHash(commitHash);
    } else {
      hash = commitHash;
    }

    if (isHeader) {
      return [
        REF_REMOTE_HEADER,
        [this.branch, hash],
      ];
    } else {
      return [
        [this.branch, hash],
      ];
    }
  }

  parseForLog() {
    const [[ _, commitHash]] = this.parseToCSV(false, false);
    return `${commitHash} ${this.relativeRefFile}`;
  }

  isRemote() {
    return this.refFile.indexOf('refs/remotes') !== -1;
  }

  displayedBranch() {
    if (this.isRemote()) {
      return colorize(`remotes/${this.branch}`, 'mark');
    } else {
      return this.branch;
    }
  }
}

module.exports = SitRefParser;
