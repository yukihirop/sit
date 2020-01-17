'use strict';

const GoogleSpreadSheet = require('google-spreadsheet');
const { yamlSafeLoad, jsonSafeLoad } = require('../utils/file');

const _createSheetId = (uri, baseURL) => {
  // https://teratail.com/questions/116620
  const regExp = new RegExp(`${baseURL}(.*?)/.*?`);
  const sheetId = uri.match(regExp)[1];
  return sheetId;
}

function GSSClient(uri, opts) {
  const { baseURL, settingPath } = opts;
  const sheetId = _createSheetId(uri, baseURL);
  const doc = new GoogleSpreadSheet(sheetId);

  var yamlData = yamlSafeLoad(settingPath)
    , credPath = yamlData["sheet"]["gss"]["auth"]["credPath"]
    , creds = jsonSafeLoad(credPath);

  return new Promise((resolve, reject) => {
    doc.useServiceAccountAuth(creds, (err) => {
      if (err) reject(err);
      resolve(doc);
    });
  });
}

module.exports = GSSClient;
