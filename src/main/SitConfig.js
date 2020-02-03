'use strict';

const {
  yamlSafeLoad
} = require('./utils/file');

module.exports = yamlSafeLoad('.sitconfig')
