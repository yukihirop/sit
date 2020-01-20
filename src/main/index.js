'use strict';

const Validator = require('./Validator');
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

  opts = Object.assign({}, defaultOpts, opts);

  const validator = new Validator(opts)
  var Sheet = {}
    , Repo = {};

  const repo = AppRepo(opts);

  if (validator.isValid()) {

    const sheet = AppSheet(opts)
      , local = AppLocal(opts)

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
  } else {
    console.log(...validator.getErrors());
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
