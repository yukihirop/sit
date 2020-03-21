const { GoogleSpreadsheetWorksheet } = require('google-spreadsheet');

// Copy from https://github.com/theoephraim/node-google-spreadsheet/blob/786be59c75f34c9deae0b184885173c6812583ad/lib/GoogleSpreadsheetWorksheet.js#L483-L488
// this uses the "values" getter and does not give all the info about the cell contents
// it is used internally when loading header cells
GoogleSpreadsheetWorksheet.prototype.getCellsInRange = async function (a1Range, options) {
  const response = await this._spreadsheet.axios.get(`/values/${encodeURIComponent(this.a1SheetName)}!${a1Range}`, {
    params: options,
  });
  return response.data.values || [];
};

module.exports = GoogleSpreadsheetWorksheet;
