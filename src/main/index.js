'use strict';

const AppSheet = require('./Sheet');
const AppRepo = require('./SitRepo');
const AppClasp = require('./Clasp');
const SitConfig = require('./repos/SitConfig');

const {
  csv2JSON
} = require('./utils/array');

function sit(opts) {
  const defaultOpts = {
    type: 'GoogleSpreadSheet',
    baseURL: 'https://docs.google.com/spreadsheets/d/',
    worksheetIndex: 0
  };

  let gopts = Object.assign({}, defaultOpts, opts);

  let Sheet = {}
    , Repo = {}
    , Clasp = {};

  let sheet = new AppSheet(gopts);
  const repo = new AppRepo(gopts)
    , clasp = new AppClasp(gopts);

  Repo.fetch = (repoName, branch) => {
    if (repo.remoteRepo(repoName) === undefined) {
      return console.error(`\
fatal: '${repoName}' does not appear to be a sit repository
fatal: Could not read from remote repository.

Please make sure you have the correct access rights and the repository exists.`);
    }

    sheet.getRows(repoName, branch, (err, rows) => {
      if (err) return console.error(`fatal: Couldn't find remote ref '${branch}'`);

      let data = sheet.rows2CSV(rows);
      let sha = repo.hashObjectFromData(`${data.join('\n')}\n`, { type: 'blob', write: true });
      repo.fetch(sha, repoName, branch).then(result => {
        const { beforeHash, remoteHash, branchCount } = result

        if (beforeHash === remoteHash) {
          console.log(`\
remote: Total ${branchCount}\n\
From ${repo.remoteRepo(repoName)}
* branch\t\t${branch}\t-> FETCH_HEAD`)
        } else {
          console.log(`\
remote: Total ${branchCount}\n\
From ${repo.remoteRepo(repoName)}
* branch\t\t${branch}\t-> FETCH_HEAD\n\
${beforeHash.slice(0, 7)}..${remoteHash.slice(0, 7)}\t${branch}\t-> ${repoName}/${branch}`)
        }
      }).catch(err => {
        console.error(err);
      });
    });
  }

  Repo.push = (repoName, branch = 'master', opts) => {
    const { type, force } = opts;
    const REMOTEHEADHash = repo._refResolve('REMOTE_HEAD');
    const HEADHash = repo._refResolve('HEAD');

    // Fetch refs/remotes from sheet
    sheet.getRows(repoName, "refs/remotes", (err, rows) => {
      if (err) throw err;

      const data = sheet.rows2CSV(rows, ['branch', 'sha1']);
      const json = csv2JSON(data);
      const remoteHash = json[branch];

      if (HEADHash === remoteHash) {
        console.log('Everything up-to-date');
        return;
      }

      if (!force && (remoteHash !== undefined) && (REMOTEHEADHash !== remoteHash)) {
        console.error(`\
To ${repo.remoteRepo(repoName)}\n\
! [rejected]\t\t${branch} -> ${branch} (non-fast-forward)\n\
error: failed to push some refs to '${repo.remoteRepo(repoName)}'\n\
hint: Updates wre rejected because the tip of your current branch is behind\n\
hint: its remote counterpart. Integrate the remote changes (e.q.\n\
hint: 'sit pull ...' before pushing again.\n\
hint: See the 'Note abount fast-forwards' in 'sit push --help' for details.`);
        return;
      }

      // Update local repo
      repo.push(repoName, branch, opts).then(hashData => {
        const { beforeHash, afterHash } = hashData;

        if (!force && (remoteHash !== undefined) && (beforeHash === afterHash)) {
          console.log(`Everything up-to-date`);
          return;
        }

        repo._HEADCSVData(csvData => {
          const updateBranchPromise = sheet.pushRows(repoName, branch, csvData, { clear: true });
          const updateRefRemotePromise = sheet.pushRows(repoName, "refs/remotes", repo._refCSVData(branch, repoName), { clear: false, specifyIndex: 0 });
          const updateRefLogRemotePromise = sheet.pushRows(repoName, "logs/refs/remotes", repo._refLastLogCSVData(branch, repoName), { clear: false });

          return Promise.all([updateRefRemotePromise, updateRefLogRemotePromise, updateBranchPromise]).then(() => {

            console.log(`\
Writed objects: 100% (1/1)
Total 1\n\
remote:\n\
remote: Create a pull request for ${branch} on ${type} by visiting:\n\
remote:     ${repo.remoteRepo(repoName)}\n\
remote:\n\
To ${repo.remoteRepo(repoName)}\n\
\t${beforeHash.slice(0, 7)}..${afterHash.slice(0, 7)}  ${branch} -> ${branch}`);
          });
        });
      }).catch(err => {
        console.error(err);
        process.exit(1);
      });
    });
  }

  Repo.clone = (repoName, url, opts) => {
    sheet = new AppSheet({ ...gopts, url });
    // TODO: Check url is valid

    sheet.getRows(repoName, 'refs/remotes', (err, rows) => {
      if (err) return console.log(`fatal: repository '${url}' not found`);

      const data = sheet.rows2CSV(rows, ['branch', 'sha1']);
      const json = csv2JSON(data);
      const remoteHash = json['master'];

      if (remoteHash === undefined) {
        console.error(`This Spreadsheet may not be repository.\nPlease visit ${url}\nMake sure that this Spreadsheet is rpeository.`)
        process.exit(1);
      }

      sheet.getRows(repoName, 'master', (err, rows) => {
        if (err) return console.error(`fatal: Couldn't find remote ref 'master'`);

        try {
          // Initialize local repo
          let result = repo.init();

          // Copy clasp scripts
          clasp.update();

          if (!result) {
            throw new Error(`fatal: destination path '${repo.distFilePath}' already exists and is not an empty directory.`)
          }

          let data = sheet.rows2CSV(rows);
          let sha = repo.hashObjectFromData(`${data.join('\n')}\n`, { type: 'blob', write: true });

          // Update local repo
          repo.clone(repoName, url, sha, data.join('\n'), opts);

          console.log(`\
Cloning into ... '${repo.distFilePath}'\n\
remote: Total 1\n\
remote: done.`);

        } catch (err) {
          console.error(err.message);
          repo.rollback();
          process.exit(1);
        }
      });
    });
  }

  Repo.init = () => {
    const result = repo.init();
    if (result) {
      console.log(`created local repo: ${repo.localRepo}`);
    } else {
      console.log(`already exist local repo: ${repo.localRepo}`);
    }
  }

  Repo.checkLocalRepo = () => {
    if (!repo.isLocalRepo()) {
      console.error(`fatal: not a sit repository (or any of the parent directories): ${repo.localRepo}`);
      process.exit();
    };
  }

  Repo.catFile = (obj, opts) => {
    const { type, size, prettyPrint } = opts;

    repo.catFile(obj).then(result => {

      if (type) {
        console.log(result.fmt);
        return;
      } else if (size) {
        console.log(result.size);
        return;
      } else if (prettyPrint) {
        console.log(result.serialize().toString());
        return;
      } else {
        return;
      }

    }).catch(err => {
      console.log(err);
    });
  }

  Repo.hashObject = (path, opts) => {
    return repo.hashObject(path, opts);
  }

  Repo.branch = (opts) => {
    return repo.branch(opts);
  }

  Repo.checkout = (name, opts) => {
    return repo.checkout(name, opts);
  }

  Repo.status = (opts) => {
    return repo.status(opts);
  }

  Repo.diff = (opts) => {
    return repo.diff(opts);
  }

  Repo.commit = (opts) => {
    return repo.commit(opts);
  }

  Repo.merge = (repoName, branch, options) => {
    return repo.merge(repoName, branch, options);
  }

  Repo.browseRemote = (repoName) => {
    return repo.browseRemote(repoName);
  }

  Repo.config = (key, value, opts) => {
    const { global, local } = opts;
    if (global) {
      return new SitConfig('global').update(key, value);
    } else if (local) {
      return new SitConfig('local').update(key, value);
    }
  }

  Clasp.update = () => {
    return clasp.update();
  }

  return {
    Sheet,
    Repo,
    Clasp
  }
}

module.exports = sit;
