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

  const worksheet = new Worksheet();

  const loadInfo = (repoName, sheetName, callback) => {
    let remoteURL;

    if (!url) {
      remoteURL = SitConfig.config('local').remote[repoName].url;
    } else {
      remoteURL = url
    }

    return Client(remoteURL, opts).then(doc => {
      new Promise((resolve, reject) => {
        doc.loadInfo().then(() => {
          if (doc) {
            const whs = Object.keys(doc._rawSheets).map(key => doc._rawSheets[key]);
            const wh = whs.filter(sheet => sheet._rawProperties.title == sheetName)[0]
            resolve(wh);
          } else {
            console.error(`Make sharing settings for the service account.\nPlease visit ${remoteURL}`);
            process.exit(1);
          }
        }).catch(err => reject(err));
      }).then(sheet => {
        if (callback) callback(doc, sheet);
      })
    });
  };

  const getRows = (repoName, sheetName) => {
    return new Promise((resolve, reject) => {
      loadInfo(repoName, sheetName, (_, sheet) => {
        if (sheet) {
          sheet.getRows()
            .then(rows => resolve(rows))
            .catch(err => reject(err));
        } else {
          reject(true)
        }
      });
    });
  };

  /* e.x.)
    data = [['master', '0230dedd90bfa7fb5abd035d7f5495dcbe2ad850']]
    data = [['こんちは', 'hello', 'greeting.hello'],
            ['さようなら', 'good bye', 'greeting.good_bye']]
  */
  const pushRows = (repoName, sheetName, data, { clear, specifyIndex }) => {
    return loadInfo(repoName, sheetName, (doc, sheet) => {
      new Promise((resolve, reject) => {
        const header = data[0];

        if (sheet) {
          sheet.getRows()
            .then(rows => {
              let oldData = rows2CSV(rows, header);
              let newData;

              if (clear) {
                newData = data;
              } else {
                newData = overrideCSV(oldData, data, specifyIndex);
              }

              let oldCSVData = worksheet.csvData(oldData);
              let newCSVData = worksheet.csvData(newData);

              if (clear) {
                _bulkPushRow(sheet, oldCSVData, newCSVData, header, true);
              } else {
                _bulkPushRow(sheet, newCSVData, newCSVData, header, false);
              }

              resolve(newData);
            })
            .catch(err => reject(err));
        } else {
          doc.addWorksheet({
            title: sheetName,
            gridProperties: {
              rowCount: SitSetting.sheet.gss.defaultWorksheet.rowCount,
              columnCount: SitSetting.sheet.gss.defaultWorksheet.colCount
            }
          })
            .then((newSheet) => {
              let csvData = worksheet.csvData(data);
              _bulkPushRow(newSheet, csvData, csvData, header, false);
              resolve(csvData);
            })
            .catch(err => reject(err));
        }
      });
    });
  }

  const rows2CSV = (rows, header = _header()) => {
    let result = [];

    rows.forEach(row => {
      let rowResult = [];

      header.forEach(header => {
        rowResult.push(row[header])
      });
      result.push(rowResult)
    });
    result.unshift(header);

    return result;
  }

  // private

  const _bulkPushRow = async (sheet, oldData, newData, header, clear = false) => {
    let dataLength = Object.keys(oldData).length + Object.keys(newData).length;
    const rowCount = Math.ceil(dataLength / header.length);

    await sheet.loadCells({
      'startRowIndex': 0,
      'endRowIndex': rowCount,
      'startColumnIndex': 0,
      'endColumnIndex': header.length
    });

    // i is itemIndex
    const colCount = sheet.columnCount;
    for (let i = 0; i < rowCount; ++i) {
      // j is langIndex or keyIndex
      for (let j = 0; j < colCount; ++j) {
        let el = newData[`${i}.${j}`];
        if (typeof el !== 'undefined') {
          sheet.getCell(i, j).value = el.value;
        } else {
          if (clear) {
            sheet.getCell(i, j).value = '';
          }
        }
      }
    }

    await sheet.saveUpdatedCells();
  }

  const _header = () => {
    const sheetSchema = SitSetting.sheet.gss.openAPIV3Schema.properties;
    const keys = Object.keys(sheetSchema)
    const result = keys.map(key => {
      return sheetSchema[key]['description']
    });
    return result;
  }

  return {
    getRows,
    pushRows,
    rows2CSV
  }
}

module.exports = GSS;
