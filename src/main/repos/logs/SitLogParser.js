'use strict';

const {
  fileSafeLoad,
  isExistFile
} = require('../../utils/file');

const SitBase = require('../base/SitBase');

const REF_LOG_HEADER = ['branch', 'beforesha', 'aftersha', 'username', 'email', 'unixtime', 'timezone', 'message']

class SitLogParser extends SitBase {
  constructor(repo, branch, logFile) {
    super();
    this.repo = repo;
    this.branch = branch;
    this.logFile = `${this.localRepo}/${logFile}`;
  }

  parseToCSV() {
    if (isExistFile(this.logFile)) {
      const { err, data } = fileSafeLoad(this.logFile);
      if (err) die(err.message)
      const lines = data.trim().split('\n');
      let result = [];

      lines.forEach(line => {
        let [other, message] = line.split('\t')

        other = other.split(' ')
        const beforesha = this.repo._refBlobFromCommitHash(other.slice(0, 1)[0])
        const aftersha = this.repo._refBlobFromCommitHash(other.slice(1, 2)[0])
        const leftover = other.slice(2)
        other = [beforesha, aftersha, ...leftover]

        let lineData = [this.branch, ...other, message]
        if (lineData.length === REF_LOG_HEADER.length) {

          result.push(lineData);
        }
      });

      result.unshift(REF_LOG_HEADER);

      return result
    } else {
      throw new Error(`Do not exist file: ${this.logFile}`)
    }
  }
}

module.exports = SitLogParser;
