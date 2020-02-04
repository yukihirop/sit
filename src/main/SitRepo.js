'use strict';

const jsdiff = require('diff')
  , chokidar = require('chokidar')
  , opener = require('opener');

const {
  isExistFile,
  fileSafeLoad,
  writeSyncFile,
  recursive,
  mTimeMs,
  rmDirSync
} = require('./utils/file');

const {
  colorize
} = require('./utils/string');

const editor = require('./utils/editor');

const SitBaseRepo = require('./repos/base/SitBaseRepo');
const SitConfig = require('./repos/SitConfig');

class SitRepo extends SitBaseRepo {
  init() {
    if (isExistFile(this.localRepo)) {
      return false
    } else {
      this._mkdirSyncRecursive()
        ._mkdirSyncRecursive("refs/heads")
        ._mkdirSyncRecursive("refs/remotes")
        ._mkdirSyncRecursive("objects")
        ._mkdirSyncRecursive("logs/refs/heads")
        ._mkdirSyncRecursive("logs/refs/remotes")
        ._writeSyncFile("HEAD", "ref: refs/heads/master", true)
        ._writeSyncFile("config", "", true);

      writeSyncFile(`${this.homeDir}/.sitconfig`, "", true);

      return true
    }
  }

  rollback() {
    const localRepo = this.localRepo;

    if (isExistFile(localRepo)) {
      rmDirSync(localRepo);
    } else {
      console.log(`Do not exist local repo: ${localRepo}`);
    }
  }

  clone(repoName, url, masterHash, data, opts) {
    const { type } = opts;

    // STEP 1: Update config
    const config = new SitConfig('local');
    config.updateSection(`remote.${repoName}`, { type: type, url: url, fetch: `+refs/heads/*:refs/remotes/${repoName}/*` });
    config.updateSection(`branch.master`, { remote: 'origin', merge: 'refs/heads/master' });

    // STEP 2: Update refs/heads/master
    // STEP 3: Create refs/remotes/origin/HEAD
    // STEP 4: Update logs/refs/heads/master
    // STEP 5: Update logs/refs/remotes/origin/HEAD
    // STEP 6: Update logs/HEAD
    this._writeSyncFile("refs/heads/master", masterHash)
      ._writeSyncFile(`refs/remotes/${repoName}/HEAD`, `ref: refs/remotes/${repoName}/master`)
      ._writeLog("logs/refs/heads/master", this._INITIAL_HASH(), masterHash, `clone: from ${url}`)
      ._writeLog(`logs/refs/remotes/${repoName}/HEAD`, this._INITIAL_HASH(), masterHash, `clone: from ${url}`)
      ._writeLog("logs/HEAD", this._INITIAL_HASH(), masterHash, `clone: from ${url}`);

    // STEP 7: Update dist file instead of Update index
    writeSyncFile(this.distFilePath, data);
  }

  isLocalRepo() {
    return isExistFile(this.localRepo);
  }

  currentBranch() {
    return this._branchResolve('HEAD');
  }

  beforeHEADHash() {
    return this._refResolve('HEAD');
  }

  afterHEADHash() {
    return this._add(this.distFilePath, {});
  }

  _add(path, opts) {
    // STEP 1: Update index
    // Do not necessary.

    // STEP 2: Create sit objects (blob)
    return this.hashObject(path, Object.assign(opts, { type: 'blob', write: true }));
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

  hashObjectFromData(data, opts) {
    const { type, write } = opts;
    return this._objectHash(data, type, write);
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

          // STEP 1: Delete logs/refs/heads/<deleteBranch>
          // STEP 2: Delete refs/heads/<deleteBranch>
          let deleteHash = this._refResolve(`refs/heads/${deleteBranch}`);
          this._deleteSyncFile(`logs/refs/heads/${deleteBranch}`)
            ._deleteSyncFile(`refs/heads/${deleteBranch}`);

          console.log(`Deleted branch ${deleteBranch} ( was ${deleteHash.slice(0, 7)})`);
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
          // STEP 2: Append logs/HEAD
          // STEP 3: Update dist file instead of Update index
          this._writeSyncFile(`HEAD`, `ref: refs/heads/${name}`, false)
            ._writeLog("logs/HEAD", currentHash, sha, `checkout: moving from ${currentBranch} to ${name}`)
            .catFile(sha).then(obj => {
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
        // STEP 2: Update refs/heads/<branch>
        // STEP 3: Append logs/HEAD
        // STEP 4: Append logs/refs/heads/<branch>
        this._writeSyncFile(`HEAD`, `ref: refs/heads/${branch}`, false)
          ._writeSyncFile(`refs/heads/${branch}`, currentHash, false)
          ._writeLog("logs/HEAD", currentHash, currentHash, `checkout: moving from ${currentBranch} to ${branch}`)
          ._writeLog(`logs/refs/heads/${branch}`, null, currentHash, "branch: Created from HEAD");

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

      if (headStream !== currentStream) {
        let patch = jsdiff.createPatch(index, headStream, currentStream, `a/${this.distFilePath}`, `b/${this.distFilePath}`);
        patch = patch
          .replace(/^[---].*\t/gm, '--- ')
          .replace(/^[+++].*\t/gm, '+++ ')
          .replace(/^\-.*/gm, colorize('$&', 'removed'))
          .replace(/^\+.*/gm, colorize('$&', 'added'))
          .replace(/^@@.+@@/gm, colorize('$&', 'section'));
        console.log(patch);
      }
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
      // STEP 2: Update ORIG_HEAD
      // STEP 3: Update HEAD
      // STEP 4: Update logs/HEAD
      // STEP 5: Update logs/refs/heads/<branch>
      this._writeSyncFile('COMMIT_EDITMSG', message)
        ._writeSyncFile('ORIG_HEAD', beforeHEADHash)
        ._writeSyncFile(refBranch, afterHEADHash)
        ._writeLog("logs/HEAD", beforeHEADHash, afterHEADHash, `commit ${message}`)
        ._writeLog(`logs/${refBranch}`, beforeHEADHash, afterHEADHash, `commit ${message}`);

      // STEP 6: Update index
      // Do not necessary

      // STEP 7: Create sit objects (commit, tree)
      // Do not necessary

      // STEP 8: display info
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
      const localRefPath = `refs/heads/${branch}`;
      const refPath = `refs/remotes/${repoName}/${branch}`;
      const beforeHash = this._refResolve(refPath);
      const afterHash = this._refResolve('HEAD');

      if (this._isExistFile(localRefPath)) {
        // STEP 1: Update logs/refs/remotes/<repoName>/<branch>
        // STEP 2: Update refs/remotes/<repoName>/<branch>
        this._writeLog(logPath, beforeHash, afterHash, `update by push`)
          ._writeSyncFile(refPath, afterHash);

        resolve({ beforeHash: beforeHash, afterHash: afterHash });
      } else {
        reject(`\
error: src refspec unknown does not match any\n\
error: failed to push some refs to '${repoName}'`)
      }
    });
  }

  fetch(remoteHash, repoName, branch) {
    return new Promise((resolve, reject) => {
      if (repoName) {
        if (branch) {
          const beforeHash = this._refResolve(`refs/remotes/${repoName}/${branch}`);
          const logPath = `logs/refs/remotes/${repoName}/${branch}`;
          const refPath = `refs/remotes/${repoName}/${branch}`;
          const branchCount = 1;

          // STEP 1: Update FETCH_HEAD
          // STEP 2: Update logs/refs/remotes/<repoName>/<branch>
          // STEP3: Update refs/remotes/<repoName>/<branch>
          this._writeSyncFile("FETCH_HEAD", `${remoteHash}\t\tbranch '${branch}' of ${repoName}`)
            ._writeLog(logPath, beforeHash, remoteHash, `fetch ${repoName} ${branch}: fast-forward`)
            ._writeSyncFile(refPath, remoteHash);

          resolve({ beforeHash, remoteHash, branchCount });
        } else {
          reject("branch is required")
        }
      } else {
        reject("reponame is required")
      }
    });
  }

  merge(repoName, branch, opts) {
    const isContinue = opts.continue;
    const { stat, abort } = opts;

    if (branch !== this.currentBranch()) {
      console.log(`\
The current branch is '${this.currentBranch()}'\n\
Sorry... Only the same branch ('${repoName}/${this.currentBranch()}') on the remote can be merged`);
      return;
    }

    // --continue
    if (isContinue) {

      if (!this._isExistFile('MERGE_HEAD')) {
        console.error('fatal: There is no merge in progress (MERGE_HEAD missing)');
        return;
      }

      // STEP 1: Update COMMIT_EDITMSG (MERGE_MSG + α)
      let mergeMsg = fileSafeLoad(`${this.localRepo}/MERGE_MSG`);
      let msg = `\
# It looks like you may be committing a merge.\n\
# If this is not correct, please remove the file\n\
# \t${this.localRepo}/MERGE_HEAD\n\
# and try again.\n\
\n\
\n\
# Please enter the commit message for your changes. Lines starting\n\
# with '#' will be ignored, and an empty message aborts the commit.\n\
#\n\
# On branch develop\n\
# All conflicts fixed but you are still merging.\n\
#
# Changes for commit:\n\
#\tmodified:\t${this.distFilePath}\n\
#\n`

      msg = `${mergeMsg}\n#\n${msg}`;
      this._writeSyncFile('COMMIT_EDITMSG', msg);

      // STEP 2: Open COMMIT_EDITMSG in Editor
      editor.open(`${this.localRepo}/COMMIT_EDITMSG`, file => {
        console.log('hint: Waiting for your editor to close the file...');
        process.stdin.pause();

        let beforeMTime = mTimeMs(file);
        let watcher = chokidar.watch(file);
        watcher.on('change', (path) => {
          let afterMTime = mTimeMs(path);

          if (beforeMTime !== afterMTime) {
            const commitMsg = fileSafeLoad(`${this.localRepo}/MERGE_MSG`).split('\n')[0];
            const headHash = this._refResolve("HEAD");
            const calculateHash = this._add(this.distFilePath, {});
            const refBranch = this._HEAD();
            const remoteHead = this._refResolve("MERGE_HEAD");

            // STEP 3: Update logs/HEAD
            // STEP 4: Update logs/refs/heads/<HEAD-branch>
            // STEP 5: Update ORIG_HEAD
            // STEP 6: Update HEAD
            // STEP 7: Update REMOTE_HEAD
            // STEP 9: Delete MERGE_MODE
            // STEP 10: Delete MERGE_MSG
            // STEP 11: Delete MERGE_HEAD
            this._writeLog("logs/HEAD", this.beforeHEADHash(), this.afterHEADHash(), `commit (merge): ${commitMsg} into ${this.currentBranch()}`)
              ._writeLog(`logs/refs/heads/${this.currentBranch()}`, this.beforeHEADHash(), this.afterHEADHash(), `commit (merge): ${commitMsg} into ${this.currentBranch()}`)
              ._writeSyncFile('ORIG_HEAD', headHash)
              ._writeSyncFile(refBranch, calculateHash)
              ._writeSyncFile("REMOTE_HEAD", remoteHead)
              ._deleteSyncFile('MERGE_MODE')
              ._deleteSyncFile('MERGE_MSG')
              ._deleteSyncFile('MERGE_HEAD');

            // STEP 12: Create sit object (commit)

            process.stdin.resume();
            console.log(`[${this.currentBranch()} ${this.afterHEADHash().slice(0, 7)}] ${commitMsg} into ${this.currentBranch()}`);

            watcher.close();
          }
        });
      });

    } else if (this._isExistFile('MERGE_HEAD') && !stat && !abort) {
      console.error(`\
error: Merging is not possible because you have unmerged files.\n\
hint: Fix them up in the work tree, and then use 'sit merge --continue'\n\
hint: as appropriate to mark resolution and make a commit.\n\
fatal: Existing because of an unresolved conflict.`);
      return;
    }

    // --abort
    if (abort) {
      if (this._isExistFile('MERGE_HEAD')) {
        // STEP 1: Update logs/HEAD
        // STEP 2: Delete MERGE_MODE
        // STEP 3: Delete MERGE_MSG
        // STEP 4: Delete MERGE_HEAD
        // STEP 5: Update dist file
        const origHEADHash = this._refResolve('ORIG_HEAD');
        this._writeLog("logs/HEAD", origHEADHash, origHEADHash, "reset: moving to HEAD")
          ._deleteSyncFile('MERGE_MODE')
          ._deleteSyncFile('MERGE_MSG')
          ._deleteSyncFile('MERGE_HEAD')
          .catFile(origHEADHash).then(obj => {
            writeSyncFile(this.distFilePath, obj.serialize().toString());
          });

      } else {
        console.error('fatal: There is no merge to abort (MERGE_HEAD missing).');
      }
    }

    // --stat
    if (stat) {
      if (this._isExistFile('MERGE_HEAD')) {
        console.error(`\
fatal: You have not concluded your merge (MERGE_HEAD exists)
Please, commit your changes before you merge.`);
        return;
      } else {
        console.log("Already up to date.");
      }
    }

    if (repoName && branch) {
      const headHash = this._refResolve("HEAD")
      const remoteHash = this._refResolveAtRemote(repoName, branch);

      this.catFile(remoteHash).then(remoteObj => {
        this.catFile(headHash).then(headObj => {
          const remoteStream = remoteObj.serialize().toString();
          const headStream = headObj.serialize().toString();
          const remoteData = remoteStream.split('\n');
          const headData = headStream.split('\n');

          this._twoWayMerge(headData, remoteData, "HEAD", `${repoName}/${branch}`, result => {
            // Conflict
            if (result.conflict) {
              // STEP 1: Update MERGE_HEAD
              // STEP 2: Update MERGE_MODE
              // STEP 3: Update MERGE_MSG
              // STEP 4: Update ORIG_HEAD
              // STEP 5: Create sit object (blob)
              this._writeSyncFile('MERGE_HEAD', remoteHash)
                ._writeSyncFile('MERGE_MODE', '')
                ._writeSyncFile('MERGE_MSG', `Merge remote-tracking branch '${repoName}/${branch}'\n\n# Conflict\n#\t${this.distFilePath}`)
                ._writeSyncFile('ORIG_HEAD', headHash)
                .hashObjectFromData(result.data.join('\n'), { type: 'blob', write: true })

              // STEP 6: File update
              writeSyncFile(this.distFilePath, result.data.join('\n'));

              console.log(`\
Two-way-merging ${this.distFilePath}
CONFLICT (content): Merge conflict in ${this.distFilePath}
two-way-merge failed; fix conflicts and then commit the result.`);

            } else {
              const headBranch = this._branchResolve('HEAD');


              // STEP 1: Update ORIG_HEAD
              // STEP 2: Update logs/HEAD
              // STEP 3: Update logs/refs/<HEAD-branch>
              // STEP 4: Update HEAD
              this._writeSyncFile('ORIG_HEAD', headHash)
                ._writeLog('logs/HEAD', headHash, remoteHash, `merge ${repoName}/${branch}: Fast-forward`)
                ._writeLog(`logs/refs/heads/${headBranch}`, headHash, remoteHash, `merge ${repoName}/${branch}: Fast-forward`)
                ._writeSyncFile('HEAD', remoteHash);

              console.log(`\
Updating ${headHash.slice(0, 7)}..${remoteHash.slice(0, 7)}\n
Fast-forward
  ${this.distFilePath}
  1 file changed`)
            }
          });
        });
      })
    }
  }

  browseRemote(repoName) {
    if (!repoName) {
      repoName = 'origin';
    }

    try {
      const url = this.remoteRepo(repoName);
      opener(url);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  }
}

module.exports = SitRepo;
