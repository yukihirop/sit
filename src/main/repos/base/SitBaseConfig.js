'use strict';

const {
  iniParse,
  iniStringify,
  writeSyncFile,
  isExistFile
} = require('../../utils/file');

const SitSetting = require('../../SitSetting');
const SitBase = require('./SitBase');

const homeDir = process.env[process.platform == "win32" ? "USERPROFILE" : "HOME"];
const configPaths = { 'global': `${homeDir}/.sitconfig`, 'local': `${SitSetting.repo.local}/config` };

class SitBaseConfig extends SitBase {
  constructor(type) {
    super();
    this.type = type;
    this.config = SitBaseConfig.config(type);
    this.configPath = configPaths[type];
  }

  static config(type) {
    const configPath = configPaths[type];

    if (isExistFile(configPath)) {
      return iniParse(configPath);
    } else {
      return {};
    }
  }

  update(key, value) {
    const [section, attribute] = key.split('.');
    switch (section) {
      case 'user':
        this._updateUserAttribute(attribute, value);
        break;
    }
  }

  updateSection(section, data) {
    const config = this.config;
    const [mainSec, subSec] = section.split('.');
    config[mainSec] = config[mainSec] || {};
    config[mainSec][subSec] = data;
    writeSyncFile(`${this.localRepo}/config`, iniStringify(config, null));
  }

  _updateRemotes(subsection, data) {
    const config = this.config;
    config.remote = config.remote || {};
    config.remote[section]
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
