'use strict';

const merge = require('deepmerge');

function Worksheet() {
  /*
  {
    '0.1': { rowNum: 0, colNum: 1, value: 'hello', type: 'item' },
    '0.2': { rowNum: 0, colNum: 2, value: 'common.text.hello', type: 'key' },
    '1.1': { rowNum: 1, colNum: 1, value: 'good night', type: 'item' },
  }
  */
  const csvData = (csvData) => {
    const delimiter = '.';
    let data = {};

    csvData.forEach((row, rowIndex) => {
      row.forEach((cellValue, colIndex) => {
        var itemResult = {}
          , key = `${rowIndex}${delimiter}${colIndex}`;

        itemResult[key] = {};
        itemResult[key].colNum = colIndex;
        itemResult[key].rowNum = rowIndex;
        itemResult[key].value = cellValue;
        itemResult[key].type = 'item';

        data = merge(data, itemResult);
      });
    });

    return data;
  }

  return {
    csvData
  }
}

module.exports = Worksheet;
