'use strict';

const SitBase = require('./SitBase')
  , SitConfig = require('../SitConfig');

const {
  isExistFile,
  mkdirSyncRecursive,
  appendFile
} = require('../../utils/file');

const moment = require('moment');

class SitBaseLogger extends SitBase {
  constructor(beforeSHA, afterSHA) {
    super()
    this.beforeSHA = beforeSHA
    this.afterSHA = afterSHA
    this.localConfig = SitConfig.config('local');
    this.globalConfig = SitConfig.config('global');
  }

  write(file, message, mkdir) {
    const space = ' ';
    const data = `${(this.beforeSHA || this._INITIAL_HASH())}${space}${this.afterSHA}${space}${this.username()}${space}<${this.email()}>${space}${moment().format('x')}${space}${moment().format('ZZ')}\t${message}\r\n`;

    if (mkdir) {
      const fullDirPath = this.localRepo + '/' + file.split('/').slice(0, -1).join('/');

      if (!isExistFile(fullDirPath)) {
        mkdirSyncRecursive(fullDirPath);
      }
    }

    appendFile(`${this.localRepo}/${file}`, data);
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
          result = defaultName
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
