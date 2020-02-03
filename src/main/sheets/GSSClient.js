'use strict';

const GoogleSpreadSheet = require('google-spreadsheet');

const { jsonSafeLoad } = require('../utils/file');
const SitSetting = require('../SitSetting');

const _createSheetId = (uri, baseURL) => {
  // https://teratail.com/questions/116620
  const regExp = new RegExp(`${baseURL}(.*?)/.*?`);
  const sheetId = uri.match(regExp)[1];
  return sheetId;
}

function GSSClient(uri, opts) {
  const { baseURL } = opts;
  const sheetId = _createSheetId(uri, baseURL);
  const doc = new GoogleSpreadSheet(sheetId);

  const credPath = SitSetting.sheet.gss.auth.credPath
    , creds = jsonSafeLoad(credPath);

  return new Promise((resolve, reject) => {
    doc.useServiceAccountAuth(creds, (err) => {
      if (err) reject(err);
      resolve(doc);
    });
  });
}

module.exports = GSSClient;
