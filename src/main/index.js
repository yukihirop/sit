'use strict';

const Validator = require('./Validator');
const AppSheet = require('./Sheet');
const AppLocal = require('./Local');
const AppRepo = require('./SitRepo');

function sit(opts) {
  const defaultOpts = {
    type: 'GoogleSpreadSheet',
    baseURL: 'https://docs.google.com/spreadsheets/d/',
    worksheetIndex: 0,
    settingPath: `./.sitconfig`
  };

  opts = Object.assign({}, defaultOpts, opts);

  const validator = new Validator(opts)
  var Sheet = {}
    , Repo = {};

  const repo = new AppRepo(opts);

  if (validator.isValid()) {

    const sheet = new AppSheet(opts)
      , local = new AppLocal(opts)

    Sheet.fetch = (repoName, branch) => {
      return new Promise((resolve, reject) => {
        sheet.getRows(repoName, branch, rows => {
          var result = sheet.rows2CSV(rows);
          local.updateData(result).then(file => {
            resolve(file);
          })
        });
      })
    }

    Sheet.push = (repoName, branch = 'master') => {
      return new Promise((resolve, reject) => {
        sheet.pushRows(repoName, branch, (data) => {
          resolve(data);
        });
      })
    }
  } else {
    console.log(...validator.getErrors());
  }

  Repo.init = () => {
    return repo.init();
  }

  Repo.objectRead = (sha) => {
    return repo.objectRead(sha)
  }

  Repo.catFile = (obj, opts) => {
    return repo.catFile(obj, opts);
  }

  Repo.hashObject = (path, opts) => {
    return repo.hashObject(path, opts);
  }

  Repo.commit = (opts) => {
    return repo.commit(opts);
  }

  return {
    Sheet,
    Repo
  }
}

module.exports = sit;
