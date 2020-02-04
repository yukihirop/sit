'use strict';

const {
  fileSafeLoad
} = require('../../utils/file');

const SitBase = require('../base/SitBase');

const REF_LOG_HEADER = ['branch', 'beforesha', 'aftersha', 'username', 'email', 'unixtime', 'timezone', 'message']

class SitLogParser extends SitBase {
  constructor(branch, logFile) {
    super();
    this.branch = branch;
    this.logFile = logFile;
  }

  parseToCSV() {
    const loadData = fileSafeLoad(this.logFile).trim();
    const lines = loadData.split('\n');
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
  }
}

module.exports = SitLogParser;
