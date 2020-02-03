'use strict';

const {
  mkdirSyncRecursive,
  absolutePath,
  writeSyncCSV,
  csvSafeLoad
} = require('./utils/file');

const SitSetting = require('./SitSetting');

const _mergedDefaultOptions = (opts) => {
  const defaultOpts = {};
  return Object.assign({}, defaultOpts, opts)
}

function Local(opts) {
  opts = _mergedDefaultOptions(opts);

  const distDirPath = SitSetting.dist.path
    , distSheetName = SitSetting.dist.sheetName;

  mkdirSyncRecursive(distDirPath);

  const updateData = (result) => {
    const csvFile = `${distDirPath}/${distSheetName}`;

    return new Promise((resolve, reject) => {
      try {
        writeSyncCSV(csvFile, result);
        resolve(csvFile);
      } catch (err) {
        reject(err);
      }
    });
  }

  const getData = () => {
    const fullDistPath = absolutePath(distDirPath)
          , fullPath = `${fullDistPath}/${distSheetName}`

    return csvSafeLoad(fullPath);
  }

  return {
    updateData,
    getData
  }
}

module.exports = Local;
