'use strict';

const AppSheet = require('./Sheet');
const AppLocal = require('./Local');
const AppRepo = require('./Repo');

function sit(opts) {
  const defaultOpts = {
    type: 'GoogleSpreadSheet',
    baseURL: 'https://docs.google.com/spreadsheets/d/',
    worksheetIndex: 0,
    settingPath: `./.sitconfig`
  };

  const options = Object.assign({}, defaultOpts, opts);
  var Sheet = {}
    , Repo = {}
    , sheet = AppSheet(options)
    , local = AppLocal(options)
    , repo = AppRepo(options)

  Sheet.fetch = (worksheetName) => {
    return new Promise((resolve, reject) => {
      sheet.getRows(worksheetName, rows => {
        var result = sheet.rows2CSV(rows);
        local.updateData(worksheetName, result).then(file => {
          resolve(file);
        })
      });
    })
  }

  Sheet.push = (worksheetName = 'master') => {
    return new Promise((resolve, reject) => {
      sheet.pushRows(worksheetName, (data) => {
        resolve(data);
      });
    })
  }

  Repo.init = () => {
    return repo.init();
  }

  return {
    Sheet,
    Repo
  }
}

module.exports = sit;
