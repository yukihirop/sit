'use strict';

const jsdiff = require('diff');

const {
  isExistFile,
  mkdirSyncRecursive,
  fileSafeLoad,
  writeSyncFile,
  recursive
} = require('./utils/file');

const {
  colorize
} = require('./utils/string');

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

  catFile(obj) {
    return new Promise((resolve, reject) => {
      this._objectFind(obj).then(sha => {
        this._objectRead(sha).then(obj => {
          resolve(obj);
        })
      });
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

  branch(opts = {}) {
    const { all, deleteBranch } = opts;
    const currentBranch = this._branchResolve('HEAD');
    let fullBranchDirPath;

    if (deleteBranch) {
      if (deleteBranch === currentBranch) {
        console.error(`error: Cannot delete branch '${deleteBranch}' checked out`);
      } else {
        this._objectFind(deleteBranch).then((sha) => {
          if (!sha) {
            console.error(`error: branch '${deleteBranch}' not found.`)
          }

          let deleteHash = this._refResolve(`refs/heads/${deleteBranch}`);

          // STEP 1: Delete logs/refs/heads/<deleteBranch>
          this._deleteSyncFile(`logs/refs/heads/${deleteBranch}`);

          // STEP 2: Delete refs/heads/<deleteBranch>
          this._deleteSyncFile(`refs/heads/${deleteBranch}`);

          console.log(`Deleted branch ${deleteBranch} ( was ${deleteHash.slice(0,7)})`);
        });
      }

    } else {

      if (all) {
        fullBranchDirPath = this._getPath('refs');
      } else {
        fullBranchDirPath = this._getPath('refs/heads');
      }

      recursive(fullBranchDirPath, (err, files) => {
        if (err) reject(err);

        files.map(file => {
          let refPath = file.split('/').slice(1).join('/')
          let branch = this._branchResolve(refPath);

          if (branch === currentBranch) {
            console.log(`* ${branch}`);
          } else {
            console.log(`  ${branch}`);
          }
        });
      });
    }
  }

  checkout(name, opts = {}) {
    const { branch } = opts;
    const currentBranch = this._branchResolve(`HEAD`);
    const currentHash = this._refResolve('HEAD');
    const fullCurrentRefPath = this._getPath(`refs/heads/${branch}`);

    if (name === currentBranch) {
      console.log(`Already on '${name}'`);
    } else if (name) {
      this._objectFind(name).then(sha => {
        if (sha) {
          // STEP 1: Update HEAD
          this._writeSyncFile(`HEAD`, `ref: refs/heads/${name}`, false);

          // STEP 2: Append logs/HEAD
          this._writeLog("logs/HEAD", currentHash, sha, `checkout: moving from ${currentBranch} to ${name}`);

          // STEP 3: Update dist file instead of Update index
          this.catFile(sha).then(obj => {
            writeSyncFile(this.distFilePath, obj.serialize().toString());
          })

          console.log(`Switched to branch '${name}'`);
        }
      });
    }

    if (branch) {
      if (isExistFile(fullCurrentRefPath)) {
        console.error(`fatal: A branch named '${branch}' already exists.`);
      } else {

        // STEP 1: Update HEAD
        this._writeSyncFile(`HEAD`, `ref: refs/heads/${branch}`, false);

        // STEP 2: Update refs/heads/<branch>
        this._writeSyncFile(`refs/heads/${branch}`, currentHash, false);

        // STEP 3: Append logs/HEAD
        this._writeLog("logs/HEAD", currentHash, currentHash, `checkout: moving from ${currentBranch} to ${branch}`);

        // STEP 4: Append logs/refs/heads/<branch>
        this._writeLog(`logs/refs/heads/${branch}`, null, currentHash, "branch: Created from HEAD");

        console.log(`Switched to a new branch '${branch}'`);
      }
    }
  }

  diff(opts = {}) {
    opts = Object.assign(opts, { type: 'blob' });
    const headHash = this._refResolve('HEAD');
    const calculateHash = this.hashObject(this.distFilePath, opts);
    const index = `${headHash.slice(0, 7)}..${calculateHash.slice(0, 7)}`;

    this.catFile(headHash).then(obj => {
      const headStream = obj.serialize().toString();
      const currentStream = fileSafeLoad(this.distFilePath);

      let patch = jsdiff.createPatch(index, headStream, currentStream, this.distFilePath, this.distFilePath);
      patch = patch
        .replace(/^[---].*\t/gm, '--- ')
        .replace(/^[+++].*\t/gm, '+++ ')
        .replace(/^\-.*/gm, colorize('$&', 'removed'))
        .replace(/^\+.*/gm, colorize('$&', 'added'))
        .replace(/^@@.+@@/gm, colorize('$&', 'section'));
      console.log(patch);
    });
  }

  status(opts = {}) {
    opts = Object.assign(opts, { type: 'blob' });

    const currentBranch = this._branchResolve('HEAD');
    const currentHash = this._refResolve('HEAD');
    const calculateHash = this.hashObject(this.distFilePath, opts);

    if (currentHash !== calculateHash) {
      console.log(`modified: ${this.distFilePath}`);
    } else {
      console.log(`\
On branch ${currentBranch}\n\
nothing to commit`
      );
    }
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
