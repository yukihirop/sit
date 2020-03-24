
const {
  iniParse,
  iniStringify,
  writeSyncFile,
  isExistFile,
} = require('../../utils/file');

const {
  compact,
} = require('../../utils/object');

const SitBase = require('./SitBase');

class SitBaseConfig extends SitBase {
  constructor(type) {
    super();

    const configPaths = { global: `${SitBase.homeDir()}/.sitconfig`, local: `${this.localRepo}/config` };

    this.type = type;
    this.configPath = configPaths[type];
    this.config = this._createConfig();
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
    let { config } = this;
    const [mainSec, subSec] = section.split('.');
    config[mainSec] = config[mainSec] || {};
    config[mainSec][subSec] = data;
    if (!data) {
      config = compact(config);
    }
    writeSyncFile(`${this.localRepo}/config`, iniStringify(config, null));
  }

  _createConfig() {
    const { configPath } = this;
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
    const { config } = this;
    config.user = config.user || {};
    const { email } = config.user;
    config.user = { name, email };
    writeSyncFile(this.configPath, iniStringify(config, null));
  }

  _updateEmail(email) {
    const { config } = this;
    config.user = config.user || {};
    const { name } = config.user;
    config.user = { name, email };
    writeSyncFile(this.configPath, iniStringify(config, null));
  }
}

module.exports = SitBaseConfig;
