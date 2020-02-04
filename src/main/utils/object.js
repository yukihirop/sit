'use strict';

const flatten = require('flat');
const unflatten = flatten.unflatten;

const compact = (obj) => {
  const data = flatten(obj)
  let result = Object.keys(data).reduce((acc, key) => {
    if (data[key]) {
      acc[key] = data[key]
    }
    return acc;
  }, {});

  return unflatten(result);
}

module.exports = {
  flatten,
  compact,
  unflatten
}
