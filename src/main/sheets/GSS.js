'use strict';

const {
  overrideCSV
} = require('../utils/array');

const Client = require('./GSSClient');
const Worksheet = require('./Worksheet');
const SitSetting = require('../SitSetting');
const SitConfig = require('../repos/SitConfig');

function GSS(opts) {
  const { url } = opts;
  const sheetSchema = SitSetting.sheet.gss.openAPIV3Schema.properties;

  const worksheet = new Worksheet();

  const getInfo = (repoName, sheetName, callback) => {
    let remoteURL;

    if (!url) {
      remoteURL = SitConfig.config('local').remote[repoName].url;
    } else {
      remoteURL = url
    }

    return Client(remoteURL, opts).then(doc => {
      new Promise((resolve, reject) => {
        doc.getInfo((err, info) => {
          if (err) reject(err);
          if (info) {
            var wh = info.worksheets.filter(sheet => sheet.title == sheetName)[0]
            resolve(wh);
          } else {
            console.error(`Make sharing settings for the service account.\nPlease visit ${remoteURL}`);
            process.exit(1);
          }
        });
      }).then((sheet) => {
        if (callback) callback(doc, sheet);
      }).catch(err => {
        console.error(err);
        process.exit(1);
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
        if (callback) callback(true, null)
      }
    });
  };

  /* e.x.)
    data = [['master', '0230dedd90bfa7fb5abd035d7f5495dcbe2ad850']]
    data = [['こんちは', 'hello', 'greeting.hello'],
            ['さようなら', 'good bye', 'greeting.good_bye']]
  */
  const pushRows = (repoName, sheetName, data, clear = false, headers = _headers(sheetSchema)) => {
    return getInfo(repoName, sheetName, (doc, sheet) => {
      new Promise((resolve, reject) => {
        if (sheet) {
          sheet.getRows((err, rows) => {
            if (err) reject(err);
            let oldData = rows2CSV(rows, headers);
            let newData;

            if (clear) {
              newData = data;
            } else {
              newData = overrideCSV(oldData, data, 0);
            }

            let oldCSVData = worksheet.csvData(oldData);
            let newCSVData = worksheet.csvData(newData);

            if (clear) {
              _bulkPushRow(sheet, oldCSVData, newCSVData, headers, true);
            } else {
              _bulkPushRow(sheet, newCSVData, newCSVData, headers, false);
            }

            resolve(newData);
          });
        } else {
          doc.addWorksheet({
            title: sheetName
          }, (err, newSheet) => {
            if (err) reject(err);
            let csvData = worksheet.csvData(data);
            _bulkPushRow(newSheet, csvData, csvData, headers, false);
            resolve(csvData);
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

  const _bulkPushRow = (sheet, oldData, newData, headers = _headers(sheetSchema), clear = false) => {
    let dataLength = Object.keys(oldData).length + Object.keys(newData).length;
    const maxRowCount = Math.ceil(dataLength / headers.length);

    sheet.getCells({
      'min-row': 1,
      'max-row': maxRowCount,
      'return-empty': true
    }, (err, cells) => {
      if (err) throw err;

      // i is itemIndex
      const colCount = sheet.colCount;
      const rowCount = cells.length / colCount;
      for (let i = 0; i < rowCount; ++i) {
        // j is langIndex or keyIndex
        for (let j = 0; j < colCount; ++j) {
          let el = newData[`${i}.${j}`];
          if (typeof el !== 'undefined') {
            cells[i * colCount + j].value = el.value;
          } else {
            if (clear) {
              cells[i * colCount + j].value = '';
            }
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
