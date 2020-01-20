'use strict';

const uuidv4 = require('uuid/v4');

const Client = require('./GSSClient');
const { yamlSafeLoad } = require('../utils/file');
const Worksheet = require('./Worksheet');
const Local = require('../Local')

const _mergedDefaultOptions = (opts) => {
  const defaultOpts = {
    workSheetName: 'シート1'
  }
  return Object.assign({}, defaultOpts, opts)
}

function GSS(opts) {
  const { settingPath } = opts;

  var settingData = yamlSafeLoad(settingPath)
    , url = settingData["sheet"]["gss"]["url"]
    , sheetSchema = settingData["sheet"]["gss"]["openAPIV3Schema"]["properties"]
    , headerData = Object.keys(sheetSchema);

  opts = _mergedDefaultOptions(opts);

  const client = Client(url, opts);
  const local = new Local(opts);
  const worksheet = new Worksheet(headerData);

  const getInfo = (worksheetName, callback) => {
    return client.then(doc => {
      new Promise((resolve, reject) => {
        doc.getInfo((err, info) => {
          if (err) reject(err);
          var wh = info.worksheets.filter(sheet => sheet.title == worksheetName)[0]
          resolve(wh);
        });
      }).then(sheet => {
        if (callback) {
          callback(sheet);
        }
      });
    });
  };

  const getRows = (worksheetName, callback) => {
    return getInfo(worksheetName, sheet => {
      new Promise((resolve, reject) => {
        sheet.getRows((err, rows) => {
          if (err) reject(err);
          resolve(rows);
        });
      }).then(rows => {
        if (callback) {
          callback(rows);
        }
      });
    });
  };

  const pushRows = (worksheetName, callback) => {
    return client.then(doc => {
      new Promise((resolve, reject) => {
        doc.addWorksheet({
          title: uuidv4()
        }, (err, sheet) => {
          if (err) reject(err);
          resolve(sheet);
        });
      }).then(sheet => {
        local.getData(worksheetName).then(result => {
          _bulkPushRow(sheet, worksheet.csvData(result));
          if (callback) callback(result);
        });
      });
    });
  }

  const rows2CSV = (rows) => {
    var headers = _headers(sheetSchema);
    var result = [];

    rows.forEach(row => {
      var rowResult = []
      headers.forEach(header => {
        rowResult.push(row[header])
      });
      result.push(rowResult)
    });
    result.unshift(headers);
    return result;
  }

  // private

  const _bulkPushRow = (sheet, data) => {
    const maxRowCount = Math.ceil(Object.keys(data).length / _headers(sheetSchema).length);

    sheet.getCells({
      'min-row': 1,
      'max-row': maxRowCount,
      'return-empty': true
    }, (err, cells) => {
      if (err) throw err;

      // i is itemIndex
      const colCount = sheet.colCount;
      const rowCount = cells.length / colCount
      for (let i = 0; i < rowCount; ++i) {
        // j is langIndex or keyIndex
        for (let j = 0; j < colCount; ++j) {
          var el = data[`${i}.${j}`];
          if (typeof el !== 'undefined') {
            cells[i * colCount + j].value = el.value
          }
        }
      }

      sheet.bulkUpdateCells(cells);
    });
  }

  const _headers = (sheetSchema) => {
    var keys = Object.keys(sheetSchema)
    var result = keys.map(key => {
      return sheetSchema[key]['description']
    });
    return result;
  }

  return {
    getInfo,
    getRows,
    pushRows,
    rows2CSV
  }
}

module.exports = GSS;
