'use strict';

const SitBase = require('./SitBase')
  , SitConfig = require('../SitConfig');

const {
  isExistFile,
  mkdirSyncRecursive,
  appendFile,
  writeSyncFile
} = require('../../utils/file');

const moment = require('moment');

class SitBaseLogger extends SitBase {
  constructor() {
    super();
    this.localConfig = new SitConfig('local').config;
    this.globalConfig = new SitConfig('global').config;
  }

  write(file, beforesha, aftersha, message, mkdir) {
    const data = this.createLogData({ beforesha, aftersha, message }, mkdir);

    if (mkdir) {
      const fullDirPath = this.localRepo + '/' + file.split('/').slice(0, -1).join('/');

      if (!isExistFile(fullDirPath)) {
        mkdirSyncRecursive(fullDirPath);
      }
    }

    appendFile(`${this.localRepo}/${file}`, data);
  }

  createLogData({ beforesha, aftersha, username, email, unixtime, timezone, message }, mkdir) {
    const space = ' ';
    beforesha = beforesha || this._INITIAL_HASH();
    username = username || this.username();
    email = email || `<${this.email()}>`;
    unixtime = unixtime || moment().format('x');
    timezone = timezone || moment().format('ZZ');

    return `${beforesha}${space}${aftersha}${space}${username}${space}${email}${space}${unixtime}${space}${timezone}\t${message}\n`;
  }

  bulkOverWrite(file, data) {
    writeSyncFile(`${this.localRepo}/${file}`, data, false);
  }

  username() {
    const localConfig = this.localConfig;
    const globalConfig = this.globalConfig;
    const defaultName = 'anonymous';
    let result;

    if (localConfig.user) {
      if (localConfig.user.name) {
        result = localConfig.user.name;
      } else {
        if (globalConfig.user) {
          if (globalConfig.user.name) {
            result = globalConfig.user.name;
          } else {
            result = defaultName;
          }
        } else {
          result = defaultName;
        }
      }
    } else {
      if (globalConfig.user) {
        if (globalConfig.user.name) {
          result = globalConfig.user.name;
        } else {
          result = defaultName;
        }
      } else {
        result = defaultName;
      }
    }

    return result;
  }

  email() {
    const localConfig = this.localConfig;
    const globalConfig = this.globalConfig;
    const defaultEmail = 'anonymous@example.com';
    let result;

    if (localConfig.user) {
      if (localConfig.user.email) {
        result = localConfig.user.email;
      } else {
        if (globalConfig.user) {
          if (globalConfig.user.email) {
            result = globalConfig.user.email;
          } else {
            result = defaultEmail;
          }
        } else {
          result = defaultEmail;
        }
      }
    } else {
      if (globalConfig.user) {
        if (globalConfig.user.email) {
          result = globalConfig.user.email;
        } else {
          result = defaultEmail;
        }
      } else {
        result = defaultEmail;
      }
    }

    return result;
  }
}

module.exports = SitBaseLogger;
