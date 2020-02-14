'use strict';

const {
  fileSafeLoad,
  isExistFile
} = require('../../utils/file');

const SitBase = require('../base/SitBase');

const REF_LOG_HEADER = ['branch', 'beforesha', 'aftersha', 'username', 'email', 'unixtime', 'timezone', 'message']

class SitLogParser extends SitBase {
  constructor(branch, logFile) {
    super();
    this.branch = branch;
    this.logFile = `${this.localRepo}/${logFile}`;
  }

  parseToCSV() {
    if (isExistFile(this.logFile)) {
      const { err, data } = fileSafeLoad(this.logFile);
      if (err) return console.error(err.message)
      const lines = data.trim().split('\n');
      let result = [];

      lines.forEach(line => {
        let [other, message] = line.split('\t')
        let lineData = [this.branch, ...other.split(' '), message]
        if (lineData.length === REF_LOG_HEADER.length) {
          result.push(lineData);
        }
      });

      result.unshift(REF_LOG_HEADER);
      return result;
    } else {
      throw new Error(`Do not exist file: ${this.logFile}`)
    }
  }
}

module.exports = SitLogParser;
