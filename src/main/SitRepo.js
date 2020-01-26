'use strict';

const {
  isExistFile,
  mkdirSyncRecursive,
  fileSafeLoad,
  writeSyncFile
} = require('./utils/file');

const SitBaseRepo = require('./repos/SitBaseRepo');

class SitRepo extends SitBaseRepo {
  init() {
    const localRepo = this.localRepo;

    if (isExistFile(localRepo)) {
      console.log(`already exist local repo: ${localRepo}`);
    } else {
      mkdirSyncRecursive(localRepo)
      mkdirSyncRecursive(`${localRepo}/refs/heads`);
      mkdirSyncRecursive(`${localRepo}/refs/remotes`);
      mkdirSyncRecursive(`${localRepo}/objects`);
      mkdirSyncRecursive(`${localRepo}/logs/refs/heads`);
      mkdirSyncRecursive(`${localRepo}/logs/refs/remotes`);

      writeSyncFile(`${localRepo}/HEAD`, "ref: refs/heads/master", true);
      writeSyncFile(`${localRepo}`, "", true);

      console.log(`created local repo: ${localRepo}`);
    }
  }

  catFile(obj, opts) {
    const { type, size, prettyPrint } = opts

    this._objectFind(obj).then(sha => {
      this._objectRead(sha).then(obj => {
        if (type) {
          console.log(obj.fmt);
        }

        if (size) {
          console.log(obj.size);
        }

        if (prettyPrint) {
          console.log(obj.serialize().toString());
        }
      }).catch(err => {
        console.log(err);
      })
    })
  }

  hashObject(path, opts) {
    const { type, write } = opts;
    const data = fileSafeLoad(path);
    return this._objectHash(data, type, write);
  }

  // private
  _add(path, opts) {
    // STEP 1: Update index
    // Do not necessary.

    // STEP 2: Create sit objects (blob)
    return this.hashObject(path, Object.assign(opts, { type: 'blob', write: true }));
  }

  // private
  commit(opts = {}) {
    const { message } = opts
      , refBranch = this._HEAD()
      , branch = refBranch.split('/').slice(-1)[0]
      , beforeHEADHash = this._refResolve('HEAD')
      , afterHEADHash = this._add(this.distFilePath, opts)
      , isExistMessage = (message !== '') && (message !== undefined)
      , isChangeHash = beforeHEADHash !== afterHEADHash;

    if (isExistMessage && isChangeHash) {
      // STEP 1: Update COMMIT_EDITMSG
      this._writeSyncFile('COMMIT_EDITMSG', message);

      // STEP 2: Update HEAD
      this._writeSyncFile(refBranch, afterHEADHash);

      // STEP 3: Update logs/HEAD
      this._writeLog("logs/HEAD", beforeHEADHash, afterHEADHash, `commit ${message}`);

      // STEP 4: Update logs/refs/heads/<branch>
      this._writeLog(`logs/${refBranch}`, beforeHEADHash, afterHEADHash, `commit ${message}`);

      // STEP 5: Update index
      // Do not necessary

      // STEP 6: Create sit objects (commit, tree)
      // Do not necessary

      // STEP 7: display info
      // TODO: display insertions(+), deletions(-) info
      console.log(`[${branch} ${afterHEADHash.slice(0, 7)}] ${message}`);

    } else if (isExistMessage && !isChangeHash) {
      console.log(`On branch ${branch}\nnothing to commit`);
    } else {
      console.error('Need message to commit');
    }
  }

  push(repoName, branch, opts) {
    return new Promise((resolve, reject) => {
      const logPath = `logs/refs/remotes/${repoName}/${branch}`;
      const refPath = `refs/remotes/${repoName}/${branch}`;
      const beforeHash = this._refResolve(refPath);
      const afterHash = this._refResolve('HEAD');

      // STEP 1: Update logs/refs/remotes/<repoName>/<branch>
      this._writeLog(logPath, beforeHash, afterHash, `update by push`);

      // STEP 2: Update refs/remotes/<repoName>/<branch>
      this._writeSyncFile(refPath, afterHash);

      resolve({ beforeHash: beforeHash, afterHash: afterHash });
    });
  }
}

module.exports = SitRepo;
