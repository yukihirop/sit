'use strict';

const {
  yamlSafeLoad
} = require('../utils/file');

const Client = require('./GSSClient');
const Worksheet = require('./Worksheet');

function GSS(opts) {
  const { settingPath } = opts;

  const settingData = yamlSafeLoad(settingPath)
    , remotes = settingData["repo"]["remote"]
    , sheetSchema = settingData["sheet"]["gss"]["openAPIV3Schema"]["properties"];

  const worksheet = new Worksheet();

  const getInfo = (repoName, sheetName, callback) => {
    return Client(remotes[repoName], opts).then(doc => {
      new Promise((resolve, reject) => {
        doc.getInfo((err, info) => {
          if (err) reject(err);
          var wh = info.worksheets.filter(sheet => sheet.title == sheetName)[0]
          resolve(wh);
        });
      }).then((sheet) => {
        if (callback) callback(doc, sheet);
      });
    });
  };

  const getRows = (repoName, sheetName, callback) => {
    return getInfo(repoName, sheetName, (_, sheet) => {
      if (sheet) {
        sheet.getRows((err, rows) => {
          if (callback) {
            if (err) {
              callback(err, null)
            } else {
              callback(null, rows);
            };
          }
        });
      } else {
        if(callback) callback(true, null)
      }
    });
  };

  /* e.x.)
    data = [['master', '0230dedd90bfa7fb5abd035d7f5495dcbe2ad850']]
    data = [['こんちは', 'hello', 'greeting.hello'],
            ['さようなら', 'good bye', 'greeting.good_bye']]
  */
  const pushRows = (repoName, sheetName, data, force = false, headers = _headers(sheetSchema)) => {
    return getInfo(repoName, sheetName, (doc, sheet) => {
      new Promise((resolve, reject) => {

        if (sheet) {
          sheet.getRows((err, rows) => {
            if (err) reject(err);
            let csvData = rows2CSV(rows, headers);

            if (force) {
              csvData = data;
            } else {
              csvData.push(...data);
            }

            _bulkPushRow(sheet, worksheet.csvData(csvData), headers);
            resolve(csvData);
          });
        } else {
          doc.addWorksheet({
            title: sheetName
          }, (err, newSheet) => {
            if (err) reject(err);
            _bulkPushRow(newSheet, worksheet.csvData(data), headers);
            resolve(data);
          });
        }
      });
    });
  }

  const rows2CSV = (rows, headers = _headers(sheetSchema)) => {
    let result = [];

    rows.forEach(row => {
      let rowResult = [];

      headers.forEach(header => {
        rowResult.push(row[header])
      });
      result.push(rowResult)
    });
    result.unshift(headers);

    return result;
  }

  // private

  const _bulkPushRow = (sheet, data, headers = _headers(sheetSchema)) => {
    const maxRowCount = Math.ceil(Object.keys(data).length / headers.length);

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
