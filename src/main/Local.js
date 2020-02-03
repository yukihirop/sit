'use strict';

const {
  mkdirSyncRecursive,
  absolutePath,
  writeSyncCSV,
  csvSafeLoad
} = require('./utils/file');

const SitConfig = require('./SitConfig');

const _mergedDefaultOptions = (opts) => {
  const defaultOpts = {};
  return Object.assign({}, defaultOpts, opts)
}

function Local(opts) {
  opts = _mergedDefaultOptions(opts);

  const distDirPath = SitConfig.dist.path
    , distSheetName = SitConfig.dist.sheetName;

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
