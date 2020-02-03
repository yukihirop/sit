'use strict';

const {
  iniParse,
  iniStringify,
  writeSyncFile,
  isExistFile
} = require('../../utils/file');

const SitSetting = require('../../SitSetting');

const homeDir = process.env[process.platform == "win32" ? "USERPROFILE" : "HOME"];
const configPaths = { 'global': `${homeDir}/.sitconfig`, 'local': `${SitSetting.repo.local}/config` };

class SitBaseConfig {
  constructor(type) {
    this.type = type;
    this.config = SitBaseConfig.config(this.type);
    this.configPath = configPaths[type];
  }

  update(key, value) {
    const [section, attribute] = key.split('.');
    switch (section) {
      case 'user':
        this._updateUserAttribute(attribute, value);
        break;
    }
  }

  static config(type) {
    const configPath = configPaths[type];

    if (isExistFile(configPath)) {
      return iniParse(configPath);
    } else {
      return {};
    }
  }

  _updateUserAttribute(attribute, value) {
    switch (attribute) {
      case 'name':
        this._updateUsername(value);
        break;
      case 'email':
        this._updateEmail(value);
        break;
    }
  }

  _updateUsername(name) {
    const config = this.config
    config.user = config.user || {};
    const email = config.user.email
    config.user = { name, email };
    writeSyncFile(this.configPath, iniStringify(config, null));
  }

  _updateEmail(email) {
    const config = this.config
    config.user = config.user || {};
    const name = config.user.name;
    config.user = { name, email };
    writeSyncFile(this.configPath, iniStringify(config, null));
  }
}

module.exports = SitBaseConfig;
