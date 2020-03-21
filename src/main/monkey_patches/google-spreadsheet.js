const {
  GoogleSpreadsheet,
  GoogleSpreadsheetRow,
  GoogleSpreadsheetFormulaError
} = require('google-spreadsheet');

const {
  GoogleSpreadsheetWorksheet
} = require('./google-spreadsheet/GoogleSpreadsheetWorksheet');

module.exports = {
  GoogleSpreadsheet,
  GoogleSpreadsheetWorksheet,
  GoogleSpreadsheetRow,

  GoogleSpreadsheetFormulaError,
};
