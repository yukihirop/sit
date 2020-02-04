'use strict';

const csv2JSON = (csvData) => {
  let result = {}

  csvData.forEach(line => {
    let key = line[0];
    let lineSize = line.length;

    if (lineSize > 3) {
      result[key] = line.slice(1);
    } else {
      result[key] = line[1];
    }
  });

  return result;
}

function overrideCSV(csvTo, csvFrom, specifyIndex) {
  let result = [];

  if (Number.isInteger(specifyIndex)) {
    const fromData = csvFrom.reduce((acc, line) => {
      acc[line[specifyIndex]] = line;
      return acc;
    }, {});
    const fromKeys = Object.keys(fromData);

    const toData = csvTo.reduce((acc, line) => {
      acc[line[specifyIndex]] = line;
      return acc;
    }, {})
    const toKeys = Object.keys(toData);

    const allKeys = uniq([...toKeys, ...fromKeys]);

    result = allKeys.map((key) => {
      let line = toData[key];

      if (line === undefined) {
        return fromData[key];
      }

      if (fromKeys.indexOf(key) == -1) {
        return line;
      } else {
        return fromData[key];
      }
    });
  } else {
    // Cut csvFrom header
    result = [...csvTo, ...csvFrom.slice(1)];
  }

  return result;
}

// https://qiita.com/piroor/items/02885998c9f76f45bfa0
function uniq(array) {
  const knownElements = {};
  const uniquedArray = [];
  for (const elem of array) {
    if (elem in knownElements)
      continue;
    uniquedArray.push(elem);
    knownElements[elem] = true;
  }
  return uniquedArray;
}

module.exports = {
  csv2JSON,
  overrideCSV
}
