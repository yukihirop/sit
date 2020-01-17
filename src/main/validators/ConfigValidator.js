'use strict';

const { yamlSafeLoad, packageJSON } = require('../utils/file');

function ConfigValidator(settingPath) {
  var yamlData = yamlSafeLoad(settingPath)
    , version = yamlData['version'];

  const isVersion = () => {
    if (version === packageJSON().version) {
      return true;
    } else {
      throw new Error(`Required version: ${packageJSON().version}\nBut not it's ${version}`);
    }
  }

  return {
    isVersion,
  }
}

module.exports = ConfigValidator;
