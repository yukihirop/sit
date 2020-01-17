'use strict';

const AppSheet = require('./Sheet');
const AppLocal = require('./Local');

module.exports = function transtory(opts) {
  const defaultOpts = {
    type: 'GoogleSpreadSheet',
    baseURL: 'https://docs.google.com/spreadsheets/d/',
    worksheetIndex: 0,
    settingPath: `./.sitconfig`
  };

  const options = Object.assign({}, defaultOpts, opts);
  var Sheet = {}
    , sheet = AppSheet(options)
    , local = AppLocal(options)

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

  return {
    Sheet
  }
}
