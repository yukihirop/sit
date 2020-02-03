'use strict';

const {
  iniParse,
  isExistFile
} = require('../utils/file');

const SitSetting = require('../SitSetting');

const configpath = `${SitSetting.repo.local}/config`;

if (isExistFile(configpath)) {
  module.exports = iniParse(configpath);
} else {
  module.exports = {};
}
