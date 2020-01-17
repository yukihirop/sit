'use strict';

const {
  mkdirSyncRecursive,
  yamlSafeLoad,
  absolutePath,
  writeSyncCSV,
  csvSafeLoad
} = require('./utils/file');

const _mergedDefaultOptions = (opts) => {
  const defaultOpts = {};
  return Object.assign({}, defaultOpts, opts)
}

function Local(opts) {
  opts = _mergedDefaultOptions(opts);

  var { settingPath } = opts;
  var yamlData = yamlSafeLoad(settingPath)
    , distDirPath = yamlData["local"]["distDirPath"];

  mkdirSyncRecursive(distDirPath);

  const updateData = (worksheetName, result) => {
    const csvFile = `${distDirPath}/${worksheetName}.csv`;

    return new Promise((resolve, reject) => {
      try {
        writeSyncCSV(csvFile, result);
        resolve(csvFile);
      } catch (err) {
        reject(err);
      }
    });
  }

  const getData = (worksheetName) => {
    return new Promise((resolve, reject) => {
      try {
        var fullDistPath = absolutePath(distDirPath)
          , fullPath = `${fullDistPath}/${worksheetName}.csv`

        resolve(csvSafeLoad(fullPath))
      } catch (err) {
        reject(err)
      }
    })
  }

  return {
    updateData,
    getData
  }
}

module.exports = Local;
