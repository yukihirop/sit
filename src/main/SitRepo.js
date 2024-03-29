
require('./utils/global');

const jsdiff = require('diff')
  , chokidar = require('chokidar')
  , opener = require('opener');

const {
  diffArray,
} = require('./utils/array');

const {
  isExistFile,
  fileSafeLoad,
  writeSyncFile,
  recursive,
  mTimeMs,
  rmDirSync,
  fileBasename,
  pathRelative,
  pathJoin,
  currentPath,
} = require('./utils/file');

const {
  colorize,
} = require('./utils/string');

const editor = require('./utils/editor')
  , moment = require('moment');

const SitBaseRepo = require('./repos/base/SitBaseRepo');
const SitConfig = require('./repos/SitConfig');
const SitRefParser = require('./repos/refs/SitRefParser');
const SitRepoValidator = require('./repos/validators/SitRepoValidator');
const SitCommit = require('./repos/objects/SitCommit');
const SitLogParser = require('./repos/logs/SitLogParser');

class SitRepo extends SitBaseRepo {
  init(opts = {}) {
    const { data } = opts;

    if (isExistFile(this.localRepo)) {
      return false;
    } else {
      this._mkdirSyncRecursive()
        ._mkdirSyncRecursive('refs/heads')
        ._mkdirSyncRecursive('refs/remotes')
        ._mkdirSyncRecursive('objects')
        ._mkdirSyncRecursive('logs/refs/heads')
        ._mkdirSyncRecursive('logs/refs/remotes')
        ._writeSyncFile('HEAD', 'ref: refs/heads/master', true)
        ._writeSyncFile('config', '', true);

      writeSyncFile(`${this.homeDir}/.sitconfig`, '', true);

      // Create distFile
      this._createDistFile(data);

      return true;
    }
  }

  rollback() {
    const { localRepo } = this;

    if (isExistFile(localRepo)) {
      rmDirSync(localRepo);
    } else {
      console.log(`Do not exist local repo: ${localRepo}`);
    }
  }

  clone(repoName, url, masterHash, masterData, opts) {
    const { type } = opts;

    // STEP 1: Update config
    const config = new SitConfig('local');
    config.updateSection(`remote.${repoName}`, { type, url, fetch: `+refs/heads/*:refs/remotes/${repoName}/*` });
    config.updateSection('branch.master', { remote: 'origin', merge: 'refs/heads/master' });

    // STEP 2: Create Merge Commit Object
    // STEP 3: Update refs/heads/master
    // STEP 4: Create refs/remotes/origin/HEAD
    // STEP 5: Update logs/refs/heads/master
    // STEP 6: Update logs/refs/remotes/origin/HEAD
    // STEP 7: Update logs/HEAD
    const mergeCommitHash = this._createMergeCommit(masterHash, this._INITIAL_HASH(), 'master', type);
    this._writeSyncFile('refs/heads/master', mergeCommitHash)
      ._writeSyncFile(`refs/remotes/${repoName}/HEAD`, `ref: refs/remotes/${repoName}/master`)
      ._writeLog('logs/refs/heads/master', this._INITIAL_HASH(), mergeCommitHash, `clone: from ${url}`)
      ._writeLog(`logs/refs/remotes/${repoName}/HEAD`, this._INITIAL_HASH(), mergeCommitHash, `clone: from ${url}`)
      ._writeLog('logs/HEAD', this._INITIAL_HASH(), mergeCommitHash, `clone: from ${url}`);

    // STEP 8: Update dist file instead of Update index
    this._createDistFile(masterData, true);
  }

  isLocalRepo() {
    return isExistFile(this.localRepo);
  }

  beforeHEADHash() {
    return this._refResolve('HEAD');
  }

  afterHEADHash() {
    return this._add(this.distFilePath, {});
  }

  _HEADCSVData(callback) {
    const blobHash = this._refBlob('HEAD');

    this.catFile(blobHash)
      .then(obj => {
        const stream = obj.serialize().toString();
        const csvData = stream.split('\n').map(line => { return line.split(','); });
        callback(csvData);
      })
      .catch(err => { throw err; });
  }

  _add(path, opts) {
    // STEP 1: Update index
    // Do not necessary.

    // STEP 2: Create sit objects (blob)
    return this.hashObject(path, Object.assign(opts, { type: 'blob', write: true }));
  }

  catFile(name) {
    return new Promise((resolve, reject) => {
      this._objectFind(name)
        .then(sha => {
          const { err, obj } = this._objectRead(sha);
          if (err) reject(err);
          resolve(obj);
        })
        .catch(err => reject(err));
    });
  }

  hashObject(path, opts) {
    const { type, write } = opts;
    const { err, data } = fileSafeLoad(path);
    if (err) die(err.message);
    return this._objectHash(data.trim(), type, write);
  }

  hashObjectFromData(data, opts) {
    const { type, write } = opts;
    return this._objectHash(data.trim(), type, write);
  }

  branch(opts = {}) {
    const { all, deleteBranch, moveBranch } = opts;
    const currentBranch = this._branchResolve('HEAD');
    let fullBranchDirPath;

    if (deleteBranch) {
      if (deleteBranch === currentBranch) {
        die(`error: Cannot delete branch '${deleteBranch}' checked out`);
      } else {
        this._objectFind(deleteBranch).then((sha) => {
          if (!sha) {
            die(`error: branch '${deleteBranch}' not found.`);
          }

          // STEP 1: Delete logs/refs/heads/<deleteBranch>
          // STEP 2: Delete refs/heads/<deleteBranch>
          const deleteHash = this._refResolve(`refs/heads/${deleteBranch}`);
          this._deleteSyncFile(`logs/refs/heads/${deleteBranch}`)
            ._deleteSyncFile(`refs/heads/${deleteBranch}`);

          console.log(`Deleted branch ${deleteBranch} ( was ${deleteHash.slice(0, 7)})`);
        });
      }
    } else if (moveBranch) {
      const currentHash = this._refResolve('HEAD');

      // STEP 1: Copy from refs/heads/<currentBranch> to refs/heads/<moveBranch>
      // STEP 2: Copy from logs/refs/heads/<currentBranch> to logs/reefs/heads/<moveBranch>
      // STEP 3: Write logs/HEAD
      // STEP 4: Update HEAD
      // STEP 5: Delete refs/heads/<currentBranch>
      // STEP 6: Delete logs/refs/heads/<currentBranch>
      this._fileCopySync(`refs/heads/${currentBranch}`, `refs/heads/${moveBranch}`)
        ._fileCopySync(`logs/refs/heads/${currentBranch}`, `logs/refs/heads/${moveBranch}`)
        ._writeLog('logs/HEAD', currentHash, currentHash, `Branch: renamed refs/heads/origin to refs/heads/${moveBranch}`)
        ._writeSyncFile('HEAD', `ref: refs/heads/${moveBranch}`, false)
        ._deleteSyncFile(`refs/heads/${currentBranch}`)
        ._deleteSyncFile(`logs/refs/heads/${currentBranch}`);
    } else {
      if (all) {
        fullBranchDirPath = this._getPath('refs');
      } else {
        fullBranchDirPath = this._getPath('refs/heads');
      }

      recursive(fullBranchDirPath)
        .then(files => {
          const result = files.reduce((acc, file) => {
            const refPath = pathRelative(this.localRepo, file);
            if (refPath.indexOf('stash') === -1) {
              const branch = this._branchResolve(refPath);
              const refParser = new SitRefParser(this, branch, refPath);

              if (branch === currentBranch) {
                acc.push(`* ${refParser.displayedBranch()}`);
              } else {
                acc.push(`  ${refParser.displayedBranch()}`);
              }
            }
            return acc;
          }, []);

          if (result.length !== 0) {
            console.log(result.join('\n'));
          }
        })
        .catch(err => {
          die(err.message);
        });
    }
  }

  checkout(repoName, name, opts = {}) {
    const { branch } = opts;
    const currentBranch = this._branchResolve('HEAD');
    const currentHash = this._refResolve('HEAD');
    let isRemote;

    if (repoName && name) {
      isRemote = true;
    } else if (!repoName && name) {
      isRemote = false;
    } else if (repoName && !name) {
      isRemote = false;
      // May be repoName mean branch
      name = repoName;
      repoName = null;
    }

    if (repoName) {
      if (!this.remoteRepo(repoName)) {
        die(`\
fatal: '${repoName}' does not appear to be a sit repository
fatal: Could not read from remote repository.

Please make sure you have the correct access rights and the repository exists.`);
      }
    }

    // checkout local
    if (!branch && !isRemote) {
      if (name === currentBranch) {
        console.log(`Already on '${name}'`);
      } else if (name) {
        this._objectFind(name)
          .then(sha => {
            if (sha) {
              // STEP 1: Update HEAD
              // STEP 2: Append logs/HEAD
              // STEP 3: Update dist file instead of Update index
              const blobHash = this._refBlobFromCommitHash(sha);

              this._writeSyncFile('HEAD', `ref: refs/heads/${name}`, false)
                ._writeLog('logs/HEAD', currentHash, sha, `checkout: moving from ${currentBranch} to ${name}`)
                .catFile(blobHash).then(obj => {
                  writeSyncFile(this.distFilePath, obj.serialize().toString());
                });

              console.log(`Switched to branch '${name}'`);
            }
          })
          .catch(err => {
            die(err.message);
          });
      }
      // checkout local from remote
    } else if (!branch && isRemote) {
      const refRemotePath = `refs/remotes/${repoName}/${name}`;

      if (!this._isExistFile(refRemotePath)) {
        const err = new Error(`error: pathspec '${name}' did not match any file(s) known to sit`);
        die(err.message);
      }

      const branchHash = this._refResolve(refRemotePath);

      const config = new SitConfig('local');
      config.updateSection(`branch.${name}`, { remote: repoName, merge: `refs/heads/${name}` });

      // STEP 1: Copy from refs/heads/<repoName>/<branch> to refs/heads/<branch>
      // STEP 2: Update logs/refs/heads/<branch>
      // STEP 3: checkout <branch>
      this._fileCopySync(`refs/remotes/${repoName}/${name}`, `refs/heads/${name}`)
        ._writeLog(`logs/refs/heads/${name}`, null, branchHash, `branch: Created from refs/remotes/${repoName}/${name}`)
        .checkout(null, name);
    } else if (branch) {
      const validator = new SitRepoValidator();

      if (!validator.isBranch(branch)) {
        const err = validator.errors[0];
        die(err.message);
      }

      const fullCurrentRefPath = this._getPath(`refs/heads/${branch}`);

      if (isExistFile(fullCurrentRefPath)) {
        die(`fatal: A branch named '${branch}' already exists.`);
      } else {
        // STEP 1: Update HEAD
        // STEP 2: Update refs/heads/<branch>
        // STEP 3: Append logs/HEAD
        // STEP 4: Append logs/refs/heads/<branch>
        this._writeSyncFile('HEAD', `ref: refs/heads/${branch}`, false)
          ._writeSyncFile(`refs/heads/${branch}`, currentHash, false)
          ._writeLog('logs/HEAD', currentHash, currentHash, `checkout: moving from ${currentBranch} to ${branch}`)
          ._writeLog(`logs/refs/heads/${branch}`, null, currentHash, 'branch: Created from HEAD');

        console.log(`Switched to a new branch '${branch}'`);
      }
    }
  }

  /* eslint-disable prefer-const */
  diff(opts = {}) {
    const { compareBlobHash } = opts;
    opts = Object.assign(opts, { type: 'blob' });

    const blobHashAtHEAD = this._refBlob('HEAD');

    if (compareBlobHash && blobHashAtHEAD !== this._INITIAL_HASH()) {
      const index = `${blobHashAtHEAD.slice(0, 7)}..${compareBlobHash.slice(0, 7)}`;
      this.catFile(blobHashAtHEAD).then(obj => {
        this.catFile(compareBlobHash).then(compareObj => {
          const headData = obj.serialize().toString();
          const compareData = compareObj.serialize().toString();

          if (headData !== compareData) {
            let patch = jsdiff.createPatch(index, headData, compareData, `a/${this.distFilePath}`, `b/${this.distFilePath}`);
            patch = patch
              .replace(/^[---].*\t/gm, '--- ')
              .replace(/^[+++].*\t/gm, '+++ ')
              .replace(/^\-.*/gm, colorize('$&', 'removed'))
              .replace(/^\+.*/gm, colorize('$&', 'added'))
              .replace(/^@@.+@@/gm, colorize('$&', 'section'));
            console.log(patch);
          }
        });
      });
    } else if (compareBlobHash && blobHashAtHEAD === this._INITIAL_HASH()) {
      const index = `${blobHashAtHEAD.slice(0, 7)}..${compareBlobHash.slice(0, 7)}`;
      this.catFile(compareBlobHash).then(compareObj => {
        const headData = '';
        const compareData = compareObj.serialize().toString();

        if (headData !== compareData) {
          let patch = jsdiff.createPatch(index, headData, compareData, `a/${this.distFilePath}`, `b/${this.distFilePath}`);
          patch = patch
            .replace(/^[---].*\t/gm, '--- ')
            .replace(/^[+++].*\t/gm, '+++ ')
            .replace(/^\-.*/gm, colorize('$&', 'removed'))
            .replace(/^\+.*/gm, colorize('$&', 'added'))
            .replace(/^@@.+@@/gm, colorize('$&', 'section'));
          console.log(patch);
        }
      });
    } else {
      const calculateHash = this.hashObject(this.distFilePath, opts);
      const index = `${blobHashAtHEAD.slice(0, 7)}..${calculateHash.slice(0, 7)}`;

      if (blobHashAtHEAD !== this._INITIAL_HASH()) {
        this.catFile(blobHashAtHEAD).then(obj => {
          const headStream = obj.serialize().toString();
          let { err, data } = fileSafeLoad(this.distFilePath);
          data = data.trim();

          if (err) {
            die(err.message);
          }
          if (headStream !== data) {
            let patch = jsdiff.createPatch(index, headStream, data, `a/${this.distFilePath}`, `b/${this.distFilePath}`);
            patch = patch
              .replace(/^[---].*\t/gm, '--- ')
              .replace(/^[+++].*\t/gm, '+++ ')
              .replace(/^\-.*/gm, colorize('$&', 'removed'))
              .replace(/^\+.*/gm, colorize('$&', 'added'))
              .replace(/^@@.+@@/gm, colorize('$&', 'section'));
            console.log(patch);
          }
        });
      } else {
        const headStream = '';
        let { err, data } = fileSafeLoad(this.distFilePath);
        data = data.trim();
        if (err) {
          die(err.message);
        }
        if (headStream !== data) {
          let patch = jsdiff.createPatch(index, headStream, data, `a/${this.distFilePath}`, `b/${this.distFilePath}`);
          patch = patch
            .replace(/^[---].*\t/gm, '--- ')
            .replace(/^[+++].*\t/gm, '+++ ')
            .replace(/^\-.*/gm, colorize('$&', 'removed'))
            .replace(/^\+.*/gm, colorize('$&', 'added'))
            .replace(/^@@.+@@/gm, colorize('$&', 'section'));
          console.log(patch);
        }
      }
    }
  }
  /* eslint-enable prefer-const */

  status(opts = {}) {
    opts = Object.assign(opts, { type: 'blob' });

    const currentBranch = this._branchResolve('HEAD');
    const currentHash = this._refBlob('HEAD');
    const calculateHash = this.hashObject(this.distFilePath, opts);

    if (currentHash !== calculateHash) {
      const modified = `modified: ${this.distFilePath}`;
      console.log(`\
On branch ${currentBranch}\n\

\t${colorize(modified, 'mark')}\n\

no changes added to commit`);
    } else {
      console.log(`\
On branch ${currentBranch}\n\
nothing to commit`);
    }
  }

  // private
  commit(opts = {}) {
    const { message } = opts
      , refBranch = this._HEAD()
      , branch = refBranch.split('/').slice(-1)[0]
      , beforeHEADHash = this._refResolve('HEAD')
      , blobHash = this._add(this.distFilePath, opts)
      , isExistMessage = (message !== '') && (message !== undefined)
      // STEP 1: Create sit objects (commit)
      , afterHEADHash = this._createCommit(blobHash, beforeHEADHash, message)
      , isChangeHash = beforeHEADHash !== afterHEADHash;

    if (isExistMessage && isChangeHash) {
      // STEP 2: Update COMMIT_EDITMSG
      // STEP 3: Update ORIG_HEAD
      // STEP 4: Update HEAD
      // STEP 5: Update logs/HEAD
      // STEP 6: Update logs/refs/heads/<branch>
      this._writeSyncFile('COMMIT_EDITMSG', message)
        ._writeSyncFile('ORIG_HEAD', beforeHEADHash)
        ._writeSyncFile(refBranch, afterHEADHash)
        ._writeLog('logs/HEAD', beforeHEADHash, afterHEADHash, `commit ${message}`)
        ._writeLog(`logs/${refBranch}`, beforeHEADHash, afterHEADHash, `commit ${message}`);

      // STEP 7: Update index
      // Do not necessary

      // STEP 8: display info
      // TODO: display insertions(+), deletions(-) info
      console.log(`[${branch} ${afterHEADHash.slice(0, 7)}] ${message}`);
    } else if (isExistMessage && !isChangeHash) {
      console.log(`On branch ${branch}\nnothing to commit`);
    } else {
      die('Need message to commit');
    }
  }

  push(repoName, branch, opts) {
    const { HEADBlobHash } = opts;

    return new Promise((resolve, reject) => {
      const logPath = `logs/refs/remotes/${repoName}/${branch}`;
      const localRefPath = `refs/heads/${branch}`;
      const refPath = `refs/remotes/${repoName}/${branch}`;
      const beforeHash = this._refResolve(refPath);
      const afterHash = this._refResolve('HEAD');

      if (this._isExistFile(localRefPath)) {
        // STEP 1: Update logs/refs/remotes/<repoName>/<branch>
        // STEP 2: Update refs/remotes/<repoName>/<branch>
        // STEP 3: Update REMOTE_HAD
        this._writeLog(logPath, beforeHash, afterHash, 'update by push')
          ._writeSyncFile(refPath, afterHash)
          ._writeSyncFile('REMOTE_HEAD', HEADBlobHash);

        resolve({ beforeHash, afterHash });
      } else {
        reject(new Error(`\
error: src refspec '${branch}' does not match any\n\
error: failed to push some refs to '${repoName}'`));
      }
    });
  }

  fetch(repoName, branch, opts = {}, handler = () => { }) {
    const { type, prune, remoteHash, remoteRefs, remoteBranches } = opts;

    return new Promise((resolve, reject) => {
      if (repoName) {
        if (branch) {
          const beforeHash = this._refResolve(`refs/remotes/${repoName}/${branch}`);
          const logPath = `logs/refs/remotes/${repoName}/${branch}`;
          const refPath = `refs/remotes/${repoName}/${branch}`;
          const branchCount = 1;

          // STEP 1: Update FETCH_HEAD
          // STEP 2: Update logs/refs/remotes/<repoName>/<branch>
          // STEP 3: Update refs/remotes/<repoName>/<branch>
          const afterHash = this._createMergeCommit(remoteHash, beforeHash, branch, type);
          this._writeSyncFile('FETCH_HEAD', `${afterHash}\t\tbranch '${branch}' of ${repoName}`)
            ._writeSyncFile(refPath, afterHash)
            ._writeLog(logPath, beforeHash, afterHash, `fetch ${repoName} ${branch}: fast-forward`);

          resolve({ beforeHash, afterHash, branchCount });
        } else {
          recursive(`${this.localRepo}/refs/remotes/${repoName}`)
            .then(files => {
              const localBranches = files.map(file => fileBasename(file));
              const diffBranches = diffArray(localBranches, remoteBranches);
              const msg = [];
              const added = [];

              Object.keys(diffBranches).forEach(status => {
                const branches = diffBranches[status];

                switch (status) {
                  case 'added':
                    branches.forEach(b => {
                      this.fetch(repoName, b, { type, prune: false, verbose: false, remoteHash: remoteRefs[b] });
                      added.push(b);
                      msg.push(`* [new branch]\t\t${b}\t\t-> ${repoName}/${b}`);
                    });
                    break;
                  case 'removed':
                    if (!prune) break;
                    branches.forEach(b => {
                      // STEP 1: Delete refs/remotes/<repoName>/<branch>
                      // STEP 2: Delete logs/refs/remotes/<repoName>/<branch>
                      this._deleteSyncFile(`refs/remotes/${repoName}/${b}`)
                        ._deleteSyncFile(`logs/refs/remotes/${repoName}/${b}`);

                      msg.push(`- [deleted]\t\t(none)\t\t-> ${repoName}/${b}`);
                    });
                    break;
                }
              });

              if (added.length > 1) {
                handler(repoName, added);
              }

              resolve(msg);
            });
        }
      } else {
        reject(new Error('repository is required'));
      }
    });
  }

  merge(repoName, branch, opts = {}) {
    const isContinue = opts.continue;
    const { stat, abort, type } = opts;
    const refBranch = this._HEAD();

    if (!stat && !isContinue && !abort && branch !== this.currentBranch()) {
      console.log(`\
The current branch is '${this.currentBranch()}'\n\
Sorry... Only the same branch ('${repoName}/${this.currentBranch()}') on the remote can be merged`);
      return;
    }

    // --continue
    if (isContinue) {
      if (!this._isExistFile('MERGE_HEAD')) {
        die('fatal: There is no merge in progress (MERGE_HEAD missing)');
      }

      // STEP 1: Update COMMIT_EDITMSG (MERGE_MSG + α)
      const { err, data } = fileSafeLoad(`${this.localRepo}/MERGE_MSG`);
      const mergeMsg = data;
      if (err) die(err.message);

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
#\n`;

      msg = `${mergeMsg}\n#\n${msg}`;
      this._writeSyncFile('COMMIT_EDITMSG', msg);

      // STEP 2: Open COMMIT_EDITMSG in Editor
      editor.open(`${this.localRepo}/COMMIT_EDITMSG`, file => {
        console.log('hint: Waiting for your editor to close the file...');
        process.stdin.pause();

        const beforeMTime = mTimeMs(file);
        const watcher = chokidar.watch(file);
        watcher.on('change', (path) => {
          const afterMTime = mTimeMs(path);

          if (beforeMTime !== afterMTime) {
            const { err, data } = fileSafeLoad(`${this.localRepo}/MERGE_MSG`);
            const commitMsg = data.split('\n')[0];
            if (err) die(err.message);

            const HEADHash = this._refResolve('HEAD');
            const HEADBranch = this._branchResolve('HEAD');
            const calculateHash = this._add(this.distFilePath, {});
            const mergeCommitHash = this._createMergeCommit(calculateHash, HEADHash, HEADBranch, type);
            const remoteHEADHash = this._refResolve('MERGE_HEAD');

            // STEP 3: Update logs/HEAD
            // STEP 4: Update logs/refs/heads/<HEAD-branch>
            // STEP 5: Update ORIG_HEAD (commit)
            // STEP 6: Update HEAD
            // STEP 7: Update REMOTE_HEAD (blob)
            // STEP 9: Delete MERGE_MODE
            // STEP 10: Delete MERGE_MSG
            // STEP 11: Delete MERGE_HEAD (blob)
            this._writeLog('logs/HEAD', HEADHash, mergeCommitHash, `commit (merge): ${commitMsg} into ${this.currentBranch()}`)
              ._writeLog(`logs/refs/heads/${this.currentBranch()}`, HEADHash, mergeCommitHash, `commit (merge): ${commitMsg} into ${this.currentBranch()}`)
              ._writeSyncFile('ORIG_HEAD', HEADHash)
              ._writeSyncFile(refBranch, mergeCommitHash)
              ._writeSyncFile('REMOTE_HEAD', remoteHEADHash)
              ._deleteSyncFile('MERGE_MODE')
              ._deleteSyncFile('MERGE_MSG')
              ._deleteSyncFile('MERGE_HEAD');

            // STEP 12: Create sit object (commit)

            process.stdin.resume();
            console.log(`[${this.currentBranch()} ${mergeCommitHash.slice(0, 7)}] ${commitMsg} into ${this.currentBranch()}`);

            watcher.close();
          }
        });
      });
    } else if (this._isExistFile('MERGE_HEAD') && !stat && !abort && branch) {
      die('\
error: Merging is not possible because you have unmerged files.\n\
hint: Fix them up in the work tree, and then use \'sit merge --continue\'\n\
hint: as appropriate to mark resolution and make a commit.\n\
fatal: Existing because of an unresolved conflict.');
    }

    // --abort
    if (abort) {
      if (this._isExistFile('MERGE_HEAD')) {
        // STEP 1: Update logs/HEAD
        // STEP 2: Delete MERGE_MODE
        // STEP 3: Delete MERGE_MSG
        // STEP 4: Delete MERGE_HEAD
        // STEP 5: Update dist file
        const origCommitHEADHash = this._refResolve('ORIG_HEAD');
        const origHEADHash = this._refBlob('ORIG_HEAD');
        this._writeLog('logs/HEAD', origCommitHEADHash, origCommitHEADHash, 'reset: moving to HEAD')
          ._writeSyncFile(refBranch, origCommitHEADHash)
          ._deleteSyncFile('MERGE_MODE')
          ._deleteSyncFile('MERGE_MSG')
          ._deleteSyncFile('MERGE_HEAD')
          .catFile(origHEADHash)
          .then(obj => {
            writeSyncFile(this.distFilePath, obj.serialize().toString());
          });
      } else {
        die('fatal: There is no merge to abort (MERGE_HEAD missing).');
      }
    }

    // --stat
    if (stat) {
      if (this._isExistFile('MERGE_HEAD')) {
        die(`\
fatal: You have not concluded your merge (MERGE_HEAD exists)
Please, commit your changes before you merge.`);
      } else {
        console.log('Already up to date.');
        return;
      }
    }

    if (repoName && branch) {
      const headHash = this.hashObject(this.distFilePath, { type: 'blob', write: false });
      const remoteHash = this._refBlob(`refs/remotes/${repoName}/${branch}`);

      if (headHash === remoteHash) {
        console.log('Already up to date.');
        return;
      }

      this.catFile(remoteHash).then(remoteObj => {
        this.catFile(headHash).then(headObj => {
          const remoteStream = remoteObj.serialize().toString();
          const headStream = headObj.serialize().toString();
          const remoteData = remoteStream.split('\n');
          const headData = headStream.split('\n');

          this._twoWayMerge(headData, remoteData, 'HEAD', `${repoName}/${branch}`, result => {
            const headCommitHash = this._refResolve('HEAD');
            const saveData = result.data.join('\n');

            // Conflict
            if (result.conflict) {
              // STEP 1: Update MERGE_HEAD ( ≒ REMOTE_HEAD・blob)
              // STEP 2: Update MERGE_MODE
              // STEP 3: Update MERGE_MSG
              // STEP 4: Update ORIG_HEAD (commit)
              // STEP 5: Create sit object (blob)
              this._writeSyncFile('MERGE_HEAD', remoteHash)
                ._writeSyncFile('MERGE_MODE', '')
                ._writeSyncFile('MERGE_MSG', `Merge remote-tracking branch '${repoName}/${branch}'\n\n# Conflict\n#\t${this.distFilePath}`)
                ._writeSyncFile('ORIG_HEAD', headCommitHash)
                .hashObjectFromData(saveData, { type: 'blob', write: true });

              // STEP 6: File update
              writeSyncFile(this.distFilePath, saveData);

              console.log(`\
Two-way-merging ${this.distFilePath}
CONFLICT (content): Merge conflict in ${this.distFilePath}
two-way-merge failed; fix conflicts and then commit the result.`);
            } else {
              // STEP 5: Create Merge Commit
              const blobHashAtHEAD = this.hashObjectFromData(saveData, { type: 'blob', write: true });
              const mergeCommitHash = this._createMergeCommit(blobHashAtHEAD, headCommitHash, branch, type);

              // STEP 1: Update ORIG_HEAD
              // STEP 2: Update logs/HEAD
              // STEP 3: Update logs/refs/<HEAD-branch>
              // STEP 4: Update HEAD
              this._writeSyncFile('ORIG_HEAD', headCommitHash)
                ._writeSyncFile(refBranch, mergeCommitHash)
                ._writeLog('logs/HEAD', headCommitHash, mergeCommitHash, `merge ${repoName}/${branch}: Fast-forward`)
                ._writeLog(`logs/refs/heads/${branch}`, headCommitHash, mergeCommitHash, `merge ${repoName}/${branch}: Fast-forward`);

              // STEP 6: Update dist file
              writeSyncFile(this.distFilePath, saveData);

              console.log(`\
Updating ${headCommitHash.slice(0, 7)}..${mergeCommitHash.slice(0, 7)}\n
Fast-forward
  ${this.distFilePath}
  1 file changed`);
            }
          });
        });
      });
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
      die(err.message);
    }
  }

  remote(subcommand, repoName, url, opts) {
    const { type } = opts;
    const config = new SitConfig('local');

    switch (subcommand) {
      case 'add':
        config.updateSection(`remote.${repoName}`, { type, url, fetch: `+refs/heads/*:refs/remotes/${repoName}/*` });
        break;
      case 'rm':
        config.updateSection(`remote.${repoName}`, null);
        break;
      case 'get-url':
        const { remote } = config.config;
        if (remote === undefined || remote[repoName] === undefined) {
          die(`fatal: No such remote '${repoName}'`);
        } else {
          console.log(config.config.remote[repoName].url);
        }
        break;
      default:
        console.log(`Do not support subcommand: '${subcommand}'`);
        break;
    }
  }

  log(commitHash = this._refResolve('HEAD'), opts = {}) {
    const { oneline } = opts;
    this.commits = this.commits || [];
    this.catFile(commitHash).then(obj => {
      if (obj instanceof SitCommit) {
        const commitData = obj.humanizeKVLM();
        const { parent } = commitData;
        this.commits.push(obj.createCommitLog(commitHash, commitData, { oneline }));

        if (parent === this._INITIAL_HASH()) {
          return console.log(this.commits.join('\n'));
        } else {
          return this.log(parent, { oneline });
        }
      }
    });
  }

  stash(subcommand = undefined, opts = {}) {
    const blobHEADHash = this._refBlob('HEAD');

    if (subcommand === 'save') {
      let { saveMessage } = opts;
      if (saveMessage) saveMessage = `On ${this.currentBranch()}: ${saveMessage}`;

      let calculateBlobHash = this.hashObject(this.distFilePath, { type: 'blob' });

      if (blobHEADHash === calculateBlobHash) {
        console.log('No local changes to save');
      } else {
        const commitStash = this._refResolve('refs/stash');
        const commitHEADHash = this._refResolve('HEAD');
        calculateBlobHash = this.hashObject(this.distFilePath, { type: 'blob', write: true });

        // STEP 1: Update ORIG_HEAD
        // STEP 2: Update logs/HEAD
        this._writeSyncFile('ORIG_HEAD', commitHEADHash)
          ._writeLog('logs/HEAD', commitHEADHash, commitHEADHash, 'reset: moving to HEAD', false);

        // STEP 3: Create stash commit
        if (saveMessage === undefined) saveMessage = `WIP on ${this.currentBranch()}: ${commitHEADHash.slice(0, 7)} ${this._COMMIT_EDITMSG()}`;
        const genCommitHash = this._createCommit(calculateBlobHash, commitHEADHash, saveMessage);

        // STEP 3: Update refs/stash
        // STEP 4: Update logs/refs/stash
        // STEP 5: Update dist File
        this._writeSyncFile('refs/stash', genCommitHash, false)
          ._writeLog('logs/refs/stash', commitStash, genCommitHash, saveMessage, false)
          .catFile(blobHEADHash).then(obj => {
            writeSyncFile(this.distFilePath, obj.serialize().toString());
            console.log(`Saved working directory and index state ${saveMessage}`);
          });
      }
    } else if (subcommand === 'apply') {
      let { stashKey } = opts;
      const { popHandler } = opts;
      if (!stashKey) stashKey = 'stash@{0}';

      const stashCommitHash = this._refStash(stashKey, false);
      const stashBlobHash = this._refBlobFromCommitHash(stashCommitHash);
      this.catFile(stashBlobHash).then(obj => {
        const { err, data } = fileSafeLoad(this.distFilePath);
        if (err) die(err.message);

        const distData = data.split('\n');
        const stashData = obj.serialize().toString().split('\n');

        this._twoWayMerge(distData, stashData, 'Updated upstream', 'Stashed changes', result => {
          // STEP 1: Create sit object(blob)
          this.hashObjectFromData(result.data.join('\n'), { type: 'blob', write: true });
          // STEP 2: Update dist file
          writeSyncFile(this.distFilePath, result.data.join('\n'));

          if (result.conflict) {
            console.log(`\
Two-way-merging ${this.distFilePath}
CONFLICT (content): Merge conflict in ${this.distFilePath}`);
          } else if (popHandler) {
            popHandler(stashKey, stashCommitHash);
          } else {
            console.log(`\
On branch ${this.currentBranch()}
Changes not staged for commit:

\tmodified:\t${this.distFilePath}

no changes added to commit`);
          }
        });
      });
    } else if (subcommand === 'pop') {
      let { stashKey } = opts;
      if (!stashKey) stashKey = 'stash@{0}';

      const popHandler = (stashKey, stashCommitHash) => {
        if (stashKey === 'stash@{0}') {
          this._writeSyncFile('refs/stash', this._refStash(stashKey, true));
        }
        this._deleteLineLog('logs/refs/stash', stashKey);

        console.log(`\
On branch ${this.currentBranch()}
Changes not staged for commit:

\tmodified:\t${this.distFilePath}

Dropped ${stashKey} (${stashCommitHash})`);
      };

      this.stash('apply', { stashKey, popHandler });
    } else if (subcommand === 'list') {
      const currentBranch = this._branchResolve('HEAD');
      const parser = new SitLogParser(this, currentBranch, 'logs/refs/stash');
      try {
        const stashList = parser.parseForLog('stash');
        if (stashList === '') {
          console.log('stash list is nothing');
        } else {
          console.log(stashList);
        }
      } catch (err) {
        console.log('stash list is nothing');
      }
    } else if (subcommand === 'show') {
      let { stashKey } = opts;
      const { print } = opts;
      if (!stashKey) stashKey = 'stash@{0}';

      const stashCommitHash = this._refStash(stashKey, false);
      const compareBlobHash = this._refBlobFromCommitHash(stashCommitHash);

      if (print) {
        this.diff({ compareBlobHash });
      }
    } else if (subcommand === 'drop') {
      let { stashKey } = opts;
      if (!stashKey) stashKey = 'stash@{0}';

      const deleteStashCommitHash = this._refStash(stashKey, false);

      if (stashKey === 'stash@{0}') {
        this._writeSyncFile('refs/stash', this._refStash(stashKey, true));
      }
      this._deleteLineLog('logs/refs/stash', stashKey);

      if (stashKey === 'stash@{0}') {
        console.log(`Dropped refs/stash@{0} (${deleteStashCommitHash})`);
      } else {
        console.log(`Dropped ${stashKey} (${deleteStashCommitHash})`);
      }
    }
  }

  reflog() {
    try {
      const currentBranch = this._branchResolve('HEAD');
      const parser = new SitLogParser(this, currentBranch, 'logs/HEAD');
      const reflogList = parser.parseForLog('HEAD');

      console.log(reflogList);
    } catch (err) {
      console.log('reflog list is nothing');
    }
  }

  showRef() {
    const currentBranch = this._branchResolve('HEAD');

    recursive(`${this.localRepo}/refs`).then(files => {
      const result = files.reduce((acc, file) => {
        const refPath = pathRelative(this.localRepo, file);
        const parser = new SitRefParser(this, currentBranch, refPath);
        acc.push(parser.parseForLog());
        return acc;
      }, []);

      console.log(result.join('\n').trim());
    });
  }

  revParse(obj, opts = {}) {
    const { short, showToplevel } = opts;

    if (obj === undefined && showToplevel) {
      console.log(pathJoin(currentPath, this.localRepo));
    } else {
      this._objectFind(obj).then(sha => {
        if (short) {
          console.log(sha.slice(0, 7));
        } else {
          console.log(sha);
        }
      }).catch(err => {
        die(err.message);
      });
    }
  }

  createPullRequestData(toData, fromData, callback) {
    this.__createtwoWayMergeData(toData, fromData, (result) => {
      const header = result['0'].to;
      header.push('Index', 'Status');

      delete result['0'];

      const data = Object.values(result).reduce((acc, item, index) => {
        if (item.conflict) {
          if (item.to === null) {
            item.from.push(index, '+');
            acc.push(item.from);
          } else if (item.from === null) {
            item.to.push(index, '±');
            acc.push(item.to);
          } else {
            item.to.push(index, '-');
            item.from.push(index, '+');
            acc.push(item.to);
            acc.push(item.from);
          }
        } else {
          item.to.push(index, '');
          acc.push(item.to);
        }
        return acc;
      }, [header]);

      data.push(['']);
      data.push(['created at', moment().format()]);
      data.push(['reviewers', '']);
      data.push(['assignees', this.username()]);
      data.push(['message', '']);
      data.push(['labels', '']);
      data.push(['projects', '']);
      data.push(['milestone', '']);

      callback(data);
    });
  }
}

module.exports = SitRepo;
