'use strict';

const path = require('path');

const pathRelative = (from, to) => {
  return path.relative(from, to)
}

module.exports = {
  pathRelative
}
