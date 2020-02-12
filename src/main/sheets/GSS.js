'use strict';

const {
  diffArray,
  overrideCSV,
  isEqual
} = require('../utils/array');

const Client = require('./GSSClient');
const Worksheet = require('./Worksheet');
const SitSetting = require('../SitSetting');
const SitConfig = require('../repos/SitConfig');

const IGNORE_SHEETS = ["refs/remotes", "logs/refs/remotes"]

class GSS {
  constructor(opts = {}) {
    const defaultOpts = {
      type: 'GoogleSpreadSheet',
      baseURL: 'https://docs.google.com/spreadsheets/d'
    };
    const gopts = Object.assign({}, defaultOpts, opts);

    this.opts = gopts
    this.url = opts.url
    this.worksheet = new Worksheet()
  }

  loadInfo(repoName, callback) {
    let remoteURL;

    if (!this.url) {
      remoteURL = SitConfig.config('local').remote[repoName].url
    } else {
      remoteURL = this.url
    }

    return Client(remoteURL, this.opts).then(doc => {
      new Promise((resolve, reject) => {
        doc.loadInfo().then(() => {
          if (doc) {
            const whs = Object.keys(doc._rawSheets).map(key => doc._rawSheets[key]);
            resolve(whs);
          } else {
            console.error(`Make sharing settings for the service account.\nPlease visit ${remoteURL}`);
            process.exit(1);
          }
        }).catch(err => reject(err));
      }).then(sheets => {
        if (callback) callback(doc, sheets);
      })
    });
  }

  getSheetNames(repoName, callback) {
    this.loadInfo(repoName, async (_, sheets) => {
      const sheetNames = await sheets.reduce(async (pacc, sheet) => {
        await sheet.loadHeaderRow()

        let acc = await pacc

        if (isEqual(sheet.headerValues, this._header())) {
          acc.push(sheet._rawProperties.title)
        }
        return acc
      }, Promise.resolve([]))

      const diff = diffArray(IGNORE_SHEETS, sheetNames)
      callback(diff['added'])
    })
  }

  getRows(repoName, sheetName, header = this._header()) {
    return new Promise((resolve, reject) => {
      this.loadInfo(repoName, (_, sheets) => {
        const sheet = sheets.filter(sheet => sheet._rawProperties.title == sheetName)[0]
        if (sheet) {
          sheet.getRows()
            .then(rows => resolve(this._rows2CSV(rows, header)))
            .catch(err => reject(err))
        } else {
          reject(new Error(`Do not exist sheet: ${sheetName}`))
        }
      });
    });
  }

  /* e.x.)
    data = [['master', '0230dedd90bfa7fb5abd035d7f5495dcbe2ad850']]
    data = [['こんちは', 'hello', 'greeting.hello'],
            ['さようなら', 'good bye', 'greeting.good_bye']]
  */
  pushRows(repoName, sheetName, data, { clear, specifyIndex }) {
    const worksheet = this.worksheet;

    return this.loadInfo(repoName, (doc, sheets) => {
      const sheet = sheets.filter(sheet => sheet._rawProperties.title == sheetName)[0]
      new Promise((resolve, reject) => {
        const header = data[0];

        if (sheet) {
          sheet.getRows()
            .then(rows => {
              let oldData = this._rows2CSV(rows, header);
              let newData;

              if (clear) {
                newData = data;
              } else {
                newData = overrideCSV(oldData, data, specifyIndex);
              }

              let oldCSVData = worksheet.csvData(oldData);
              let newCSVData = worksheet.csvData(newData);

              if (clear) {
                this._bulkPushRow(sheet, oldCSVData, newCSVData, header, true);
              } else {
                this._bulkPushRow(sheet, newCSVData, newCSVData, header, false);
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
              this._bulkPushRow(newSheet, csvData, csvData, header, false);
              resolve(csvData);
            })
            .catch(err => reject(err));
        }
      });
    });
  }

  _rows2CSV(rows, header = this._header()) {
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

  async _bulkPushRow(sheet, oldData, newData, header, clear = false) {
    let dataLength = Object.keys(oldData).length + Object.keys(newData).length;
    const rowCount = Math.ceil(dataLength / header.length);

    await sheet.loadCells({
      'startRowIndex': 0,
      'endRowIndex': rowCount,
      'startColumnIndex': 0,
      'endColumnIndex': header.length
    });

    // i is itemIndex
    const colCount = header.length;
    for (let i = 0; i < rowCount; ++i) {
      // j is langIndex or keyIndex
      for (let j = 0; j < colCount; ++j) {
        const el = newData[`${i}.${j}`];
        const cell = sheet.getCell(i, j);

        if (typeof el !== 'undefined') {
          cell.value = el.value;
        } else {
          if (clear) {
            cell.value = '';
          }
        }
      }
    }

    await sheet.saveUpdatedCells();
  }

  _header() {
    const sheetSchema = SitSetting.sheet.gss.openAPIV3Schema.properties;
    const keys = Object.keys(sheetSchema)
    const result = keys.map(key => {
      return sheetSchema[key]['description']
    });
    return result;
  }
}

module.exports = GSS;
