'use strict';

const {
  yamlSafeLoad,
  absolutePath,
  isExistFile,
  pathJoin,
  currentPath,
  pathRelative,
} = require('./utils/file');

const findSitSettting = (path = process.env.SIT_SETTING_DIR || '.', required = false) => {
  const apath = absolutePath(path);
  const configPath = `${apath}/.sitsetting`;
  if (isExistFile(configPath)) {
    return pathRelative(currentPath, configPath);
  } else {
    const parent = pathJoin(apath, '..');
    if (parent === apath) {
      if (required) {
        throw new Error('No sit directory.');
      } else {
        return null;
      }
    } else {
      return findSitSettting(parent, required);
    }
  }
};

const settingPath = findSitSettting() || './.sitsetting';
let SitSetting = {};

if (isExistFile(settingPath)) {
  SitSetting = yamlSafeLoad(settingPath);
}

SitSetting._internal_ = {};
SitSetting._internal_.settingPath = settingPath;

module.exports = SitSetting;
