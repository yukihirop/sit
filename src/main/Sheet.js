
const GSS = require('./sheets/GSS');

function Sheet(opts) {
  const { type } = opts;
  let sheet = {};

  switch (type) {
    case 'GoogleSpreadSheet':
      sheet = new GSS(opts);
      break;
  }

  return sheet;
}

module.exports = Sheet;
