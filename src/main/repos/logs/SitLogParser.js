'use strict';

const {
  fileSafeLoad,
  isExistFile
} = require('../../utils/file');

const {
  colorize
} = require('../../utils/string');

const SitBase = require('../base/SitBase');
const SitLogger = require('./SitLogger');

const REF_LOG_HEADER = ['branch', 'beforesha', 'aftersha', 'username', 'email', 'unixtime', 'timezone', 'message'];

class SitLogParser extends SitBase {
  constructor(repo, branch, logFile) {
    super();
    this.repo = repo;
    this.branch = branch;
    this.logFile = `${this.localRepo}/${logFile}`;
  }

  parseToCSV(replaceBlob = true) {
    if (isExistFile(this.logFile)) {
      const { err, data } = fileSafeLoad(this.logFile);
      if (err) die(err.message);
      const lines = data.trim().split('\n');
      let result = [];

      lines.forEach(line => {
        let [other, message] = line.split('\t');

        other = other.split(' ');

        if (replaceBlob) {
          const beforesha = this.repo._refBlobFromCommitHash(other.slice(0, 1)[0]);
          const aftersha = this.repo._refBlobFromCommitHash(other.slice(1, 2)[0]);
          const leftover = other.slice(2);
          other = [beforesha, aftersha, ...leftover];
        }

        let lineData = [this.branch, ...other, message];
        if (lineData.length === REF_LOG_HEADER.length) {

          result.push(lineData);
        }
      });

      result.unshift(REF_LOG_HEADER);

      return result;
    } else {
      throw new Error(`Do not exist file: ${this.logFile}`);
    }
  }

  parseToJSON(replaceBlob = true) {
    const csv = this.parseToCSV(replaceBlob);
    const header = csv.shift();
    const data = csv;

    const result = data.reduce((acc, item) => {
      const json = item.reduce((childAcc, el, index) => {
        let key = header[index];
        childAcc[key] = el;
        return childAcc;
      }, {});
      acc.push(json);
      return acc;
    }, []);

    return result;
  }

  /**
   *
   * For example, key is stash@{N}, HEAD@{N}
   */
  remakeLog(key) {
    const logger = new SitLogger();
    const [type, num] = this._keytoTypeNum(key);
    const json = this.parseForIndex(type);
    const target = json[key];
    const targetBeforeSHA = target.beforesha;

    delete json[key];

    if(num > 0) json[`${type}@{${num - 1}}`].beforesha = targetBeforeSHA;

    return Object.values(json).reduce((acc, item) => {
      acc = acc + logger.createLogData(item);
      return acc;
    }, '');
  }

  parseForIndex(type) {
    const json = this.parseToJSON(false);
    const logCount = Object.keys(json).length;
    let result;

    switch (type) {
      case 'stash':
        result = json.reduce((acc, item, index) => {
          acc[`stash@{${logCount - 1 - index}}`] = item;
          return acc;
        }, {});
        break;
    }

    return result;
  }

  parseForLog(type) {
    const json = this.parseToJSON(false);
    const logCount = Object.keys(json).length;
    let result;

    switch (type) {
      case 'stash':
        result = json.reduce((acc, item, index) => {
          acc = acc + `${colorize(item['aftersha'].slice(0, 7), 'info')} stash@{${logCount - 1 - index}}: ${item['message']}\n`;
          return acc;
        }, '');
        break;
      case 'HEAD':
        result = json.reduce((acc, item, index) => {
          acc = acc + `${colorize(item['aftersha'].slice(0, 7), 'info')} HEAD@{${logCount - 1 - index}}: ${item['message']}\n`;
          return acc;
        }, '');
        break;
    }

    return result.split('\n').reverse().join('\n').trim();
  }

  _keytoTypeNum(key) {
    const atIndex = key.indexOf('@');
    let result, type, num;

    if (atIndex !== -1) {
      type = key.slice(0, atIndex);
      num = parseInt(key.slice(atIndex + 2, atIndex + 3));
    } else {
      type = 'unknown';
      num = 0;
    }

    result = [type, num];
    return result;
  }
}

module.exports = SitLogParser;
