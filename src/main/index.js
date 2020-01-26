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

    Repo.push = (repoName, branch = 'master', opts) => {
      const { type, force } = opts;

      // Update local repo
      repo.push(repoName, branch, opts).then((hashData) => {

        const { beforeHash, afterHash } = hashData;

        if (beforeHash === afterHash) {
          console.log('Everything up-to-date');
          return;
        }

        // Push spreadsheet
        let updateBranchPromise = sheet.pushRows(repoName, branch, local.getData(), force);
        let updateRefRemotePromise = sheet.pushRows(repoName, "refs/remotes", [[branch, afterHash]], false, ['reponame', 'sha1']);

        return Promise.all([updateRefRemotePromise, updateBranchPromise]).then(() => {

          console.log(`\
Writed objects: 100% (1/1)
Total 1\n\
remote:\n\
remote: Create a pull request for ${branch} on ${type} by visiting:\n\
remote:     ${repo.remoteRepo(repoName)}\n\
remote:\n\
To ${repo.remoteRepo(repoName)}\n\
    ${beforeHash.slice(0, 7)}..${afterHash.slice(0, 7)}  ${branch} -> ${branch}
`);
        });
      });
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

  Repo.status = (opts) => {
    return repo.status(opts);
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
