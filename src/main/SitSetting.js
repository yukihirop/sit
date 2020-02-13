'use strict';

const {
  yamlSafeLoad,
  absolutePath,
  isExistFile,
  pathJoin
} = require('./utils/file');

const findSitSettting = (path, required = true) => {
  const apath = absolutePath(path)
  const configPath = `${apath}/.sitsetting`
  if (isExistFile(configPath)) {
    return configPath
  } else {
    const parent = pathJoin(apath, '..')
    if (parent === apath) {
      if (required) {
        throw new Error('No sit directory.')
      } else {
        return null
      }
    } else {
      return findSitSettting(parent, required)
    }
  }
}

const settingPath = findSitSettting(process.env.SIT_SETTING_DIR || '.')
const SitSetting = yamlSafeLoad(settingPath)
SitSetting._internal_ = {}
SitSetting._internal_.settingPath = settingPath

module.exports = SitSetting
