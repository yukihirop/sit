'use strict';

const GoogleSpreadSheet = require('./sheets/GSS');

function Sheet(opts) {
  const { type } = opts;
  var sheet = {}

  switch (type) {
    case 'GoogleSpreadSheet':
      sheet = GoogleSpreadSheet(opts);
      break;
  }

  return sheet;
}

module.exports = Sheet;
