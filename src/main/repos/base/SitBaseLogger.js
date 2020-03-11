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
  constructor() {
    super()
    this.localConfig = new SitConfig('local').config;
    this.globalConfig = new SitConfig('global').config;
  }

  write(file, beforeSHA, afterSHA, message, mkdir) {
    const space = ' ';
    const data = `${(beforeSHA || this._INITIAL_HASH())}${space}${afterSHA}${space}${this.username()}${space}<${this.email()}>${space}${moment().format('x')}${space}${moment().format('ZZ')}\t${message}\r\n`;

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
