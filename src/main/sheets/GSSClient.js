
const { GoogleSpreadsheet } = require('../monkey_patches/google-spreadsheet');

const { jsonSafeLoad } = require('../utils/file');
const SitSetting = require('../SitSetting');

const {
  pathJoin,
  pathDirname,
} = require('../utils/file');

const _createSheetId = (uri, baseURL) => {
  // https://teratail.com/questions/116620
  const regExp = new RegExp(`${baseURL}/(.*?)/.*?`);
  const sheetId = uri.match(regExp)[1];
  return sheetId;
};

function GSSClient(uri, opts) {
  const { baseURL, type } = opts;
  const sheetId = _createSheetId(uri, baseURL);
  const doc = new GoogleSpreadsheet(sheetId);

  const { auth } = SitSetting.sheet.gss;
  let creds;

  if (auth) {
    const { settingPath } = SitSetting._internal_;
    creds = jsonSafeLoad(pathJoin(pathDirname(settingPath), auth.credPath));
    if (Object.keys(creds).length === 0) {
      die(`\
error: Can not access for ${type}
error: credentials file not found.`);
    }
  } else {
    const clientEmail = process.env.SIT_GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.SIT_GOOGLE_PRIVATE_KEY;

    if (clientEmail === undefined) {
      die(`\
error: Can not access for ${type}
error: 'SIT_GOOGLE_SERVICE_ACCOUNT_EMAIL' is not set.`);
    }
    if (privateKey === undefined) {
      die(`\
error: Can not access for ${type}
error: 'SIT_GOOGLE_PRIVATE_KEY' is not set.`);
    }

    creds = {
      client_email: clientEmail,
      private_key: privateKey.replace(/\\n/g, '\n'),
    };
  }

  return new Promise((resolve, reject) => {
    doc.useServiceAccountAuth(creds).then(() => {
      resolve(doc);
    }).catch(err => {
      reject(err);
    });
  });
}

module.exports = GSSClient;
