
const Diff = require('diff');

const csv2JSON = (csvData) => {
  const result = {};

  csvData.forEach(line => {
    const key = line[0];
    const lineSize = line.length;

    if (lineSize > 3) {
      result[key] = line.slice(1);
    } else {
      result[key] = line[1];
    }
  });

  return result;
};

const overrideCSV = (csvTo, csvFrom, specifyIndex) => {
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
    }, {});
    const toKeys = Object.keys(toData);

    const allKeys = uniq([...toKeys, ...fromKeys]);

    result = allKeys.map((key) => {
      const line = toData[key];

      if (line === undefined) {
        return fromData[key];
      }

      if (fromKeys.indexOf(key) === -1) {
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
};

// https://qiita.com/piroor/items/02885998c9f76f45bfa0
const uniq = (array) => {
  const knownElements = {};
  const uniquedArray = [];
  for (const elem of array) {
    if (elem in knownElements)
      continue;
    uniquedArray.push(elem);
    knownElements[elem] = true;
  }
  return uniquedArray;
};

const diffArray = (to, from) => {
  const diff = Diff.diffArrays(to, from);
  const data = diff.reduce((acc, item) => {
    const { added } = item;
    const { removed } = item;

    if (added) {
      acc.added = acc.added || [];
      acc.added.push(...item.value);
    } else if (removed) {
      acc.removed = acc.removed || [];
      acc.removed.push(...item.value);
    }

    return acc;
  }, {});

  const addedData = data.added || [];
  const removedData = data.removed || [];
  const sharedData = _getDuplicateValues([...addedData, ...removedData]);
  const addedOnly = _getUniqueValues([...addedData, ...sharedData]);
  const removedOnly = _getUniqueValues([...removedData, ...sharedData]);

  return {
    added: addedOnly,
    removed: removedOnly,
  };
};

const isEqual = (to, from) => {
  return JSON.stringify(to) === JSON.stringify(from);
};

// https://www.nxworld.net/tips/js-array-filter-snippets.html
const _getDuplicateValues = ([...array]) => {
  return array.filter((value, index, self) => self.indexOf(value) === index && self.lastIndexOf(value) !== index);
};

// https://www.nxworld.net/tips/js-array-filter-snippets.html
const _getUniqueValues = ([...array]) => {
  return array.filter((value, index, self) => self.indexOf(value) === self.lastIndexOf(value));
};

module.exports = {
  csv2JSON,
  overrideCSV,
  diffArray,
  isEqual,
};
