
require('./utils/global');

const AppSheet = require('./Sheet');
const AppRepo = require('./SitRepo');
const AppClasp = require('./Clasp');
const SitConfig = require('./repos/SitConfig');

const {
  csv2JSON,
} = require('./utils/array');

const {
  colorize,
} = require('./utils/string');

function sit(opts) {
  const defaultOpts = {
    type: 'GoogleSpreadSheet',
  };

  process.env.SIT_DIR = (process.env.SIT_DIR === undefined) ? '.' : process.env.SIT_DIR;
  process.env.SIT_SETTING_DIR = (process.env.SIT_SETTING_DIR === undefined) ? '.' : process.env.SIT_SETTING_DIR;

  const gopts = Object.assign({}, defaultOpts, opts);

  const Sheet = {}
    , Repo = {}
    , Clasp = {};

  let sheet = new AppSheet(gopts);
  const repo = new AppRepo(gopts)
    , clasp = new AppClasp();

  Repo.fetch = (repoName, branch, opts = {}) => {
    const { prune, verbose, type } = opts;

    if (!repo.remoteRepo(repoName)) {
      die(`\
fatal: '${repoName}' does not appear to be a sit repository
fatal: Could not read from remote repository.

Please make sure you have the correct access rights and the repository exists.`);
    } else if (branch) {
      sheet.getRows(repoName, branch)
        .then(data => {
          const remoteHash = repo.hashObjectFromData(data.join('\n'), { type: 'blob', write: true });

          repo.fetch(repoName, branch, { prune, remoteHash, type })
            .then(result => {
              if (!verbose) return;

              const { beforeHash, afterHash, branchCount } = result;
              if (beforeHash === remoteHash) {
                console.log(`\
remote: Total ${branchCount}\n\
From ${repo.remoteRepo(repoName)}
  * branch\t\t${branch}\t-> FETCH_HEAD`);
              } else {
                console.log(`\
remote: Total ${branchCount}\n\
From ${repo.remoteRepo(repoName)}
  * branch\t\t${branch}\t-> FETCH_HEAD\n\
  ${beforeHash.slice(0, 7)}..${afterHash.slice(0, 7)}\t${branch}\t-> ${repoName}/${branch}`);
              }
            })
            .catch(err => {
              die(err.message);
            });
        })
        .catch(() => {
          die(`fatal: Couldn't find remote ref '${branch}'`);
        });
    } else {
      if (!repo._isExistFile(`refs/remotes/${repoName}`)) return;

      sheet.getRows(repoName, 'refs/remotes', ['branch', 'sha1']).then(data => {
        sheet.getSheetNames(repoName, remoteBranches => {
          const remoteRefs = csv2JSON(data.slice(1));

          repo.fetch(repoName, null, { prune, remoteBranches, remoteRefs, type }, (repoName, addedBranches) => {
            const promises = addedBranches.map(branch => {
              sheet.getRows(repoName, branch)
                .then(data => {
                  repo.hashObjectFromData(data.join('\n'), { type: 'blob', write: true });
                })
                .catch(() => {
                  die(`fatal: Couldn't find remote ref '${branch}'`);
                });
            });

            Promise.all(promises);
          })
            .then(msg => {
              if (msg.length >= 1) {
                msg.unshift(`From ${repo.remoteRepo(repoName)}`);
                console.log(msg.join('\n'));
              }
            });
        });
      }).catch(() => {
        die(`fatal: Couldn't find remote ref '${branch}'`);
      });
    }
  };

  Repo.push = (repoName, branch, opts = {}) => {
    const { type, force } = opts;
    const REMOTEHEADBlobHash = repo._refResolve('REMOTE_HEAD');
    const HEADBlobHash = repo._refBlob('HEAD');

    if (repo.remoteRepo(repoName) === undefined) {
      die(`\
fatal: '${repoName}' does not appear to be a sit repository
fatal: Could not read from remote repository.

Please make sure you have the correct access rights and the repository exists.`);
    } else if (branch) {
      // Fetch refs/remotes from sheet
      sheet.getRows(repoName, 'refs/remotes', ['branch', 'sha1']).then(data => {
        const json = csv2JSON(data);
        const remoteHash = json[branch];

        if (HEADBlobHash === remoteHash) {
          console.log('Everything up-to-date');
          return;
        }

        const isPushableAboutREMOTEREADHash = (REMOTEHEADBlobHash === repo._INITIAL_HASH()) ? true : (REMOTEHEADBlobHash === remoteHash);
        if (!force && (remoteHash !== undefined) && !isPushableAboutREMOTEREADHash) {
          die(`\
To ${repo.remoteRepo(repoName)}\n\
${colorize('! [rejected]', 'error')}\t\t${branch} -> ${branch} (non-fast-forward)\n\
${colorize(`error: failed to push some refs to '${repo.remoteRepo(repoName)}'`, 'error')}\n\
${colorize('\
hint: Updates wre rejected because the tip of your current branch is behind\n\
hint: its remote counterpart. Integrate the remote changes (e.q.\n\
hint: \'sit pull ...\' before pushing again.\n\
hint: See the \'Note abount fast-forwards\' in \'sit push --help\' for details.', 'info')}`);
        }

        // Update local repo
        const isNewBranch = repo._isExistFile(`refs/remotes/${repoName}/${branch}`) === false;
        repo.push(repoName, branch, { ...opts, HEADBlobHash }).then(hashData => {
          const { beforeHash, afterHash } = hashData;

          if (!force && (remoteHash !== undefined) && (beforeHash === afterHash)) {
            console.log('Everything up-to-date');
            return;
          }

          repo._HEADCSVData(csvData => {
            const updateBranchPromise = sheet.pushRows(repoName, branch, csvData, { clear: true });
            const updateRefRemotePromise = sheet.pushRows(repoName, 'refs/remotes', repo._refCSVData(branch, repoName), { clear: false, specifyIndex: 0 });
            const updateRefLogRemotePromise = sheet.pushRows(repoName, 'logs/refs/remotes', repo._refLastLogCSVData(branch, repoName), { clear: false });

            return Promise.all([updateRefRemotePromise, updateRefLogRemotePromise, updateBranchPromise]).then(() => {
              const baseMsg = `\
Writed objects: 100% (1/1)
Total 1\n\
remote:\n\
remote: Create a pull request for ${branch} on ${type} by visiting:\n\
remote:     ${repo.remoteRepo(repoName)}\n\
remote:\n\
To ${repo.remoteRepo(repoName)}`;

              let detailMsg = `${beforeHash.slice(0, 7)}..${afterHash.slice(0, 7)}  ${branch} -> ${branch}`;
              if (force) {
                detailMsg = `\t+ ${detailMsg} (forced update)`;
              } else if (isNewBranch) {
                detailMsg = `\t* [new branch]\t${detailMsg}`;
              }
              console.log(`${baseMsg}\n${detailMsg}`);
            });
          });
        }).catch(err => {
          die(err.message);
        });
      });
    } else {
      die('branch is required');
    }
  };

  Repo.clone = (repoName, url, opts) => {
    sheet = new AppSheet({ ...gopts, url });
    // TODO: Check url is valid

    if (repoName) {
      if (url) {
        sheet.getRows(repoName, 'refs/remotes', ['branch', 'sha1']).then(data => {
          const json = csv2JSON(data);
          const remoteHash = json.master;

          if (remoteHash === undefined) {
            die(`This Spreadsheet may not be repository.\nPlease visit ${url}\nMake sure that this Spreadsheet is rpeository.`);
          }

          sheet.getRows(repoName, 'master').then(data => {
            try {
              // Initialize local repo
              const result = repo.init();

              if (!result) {
                throw new Error(`fatal: destination path '${repo.distFilePath}' already exists and is not an empty directory.`);
              }

              // Copy clasp scripts
              clasp.update();

              const sha = repo.hashObjectFromData(data.join('\n'), { type: 'blob', write: true });

              // Update local repo
              repo.clone(repoName, url, sha, data, opts);

              console.log(`\
Cloning into ... '${repo.distFilePath}'\n\
remote: Total 1\n\
remote: done.`);
            } catch (err) {
              repo.rollback();
              die(err.message);
            }
          }).catch(() => {
            die('fatal: Couldn\'t find remote ref \'master\'');
          });
        }).catch(() => {
          die(`fatal: repository '${url}' not found`);
        });
      } else {
        die('url is required');
      }
    } else {
      die('repository is required');
    }
  };

  Repo.init = () => {
    const data = sheet.header();
    const result = repo.init({ data });
    if (result) {
      console.log(`created local repo: ${repo.localRepo}`);
      console.log(`created dist file: ${repo.distFilePath}`);
    } else {
      console.log(`already exist local repo: ${repo.localRepo}`);
    }
  };

  Repo.checkLocalRepo = () => {
    if (!repo.isLocalRepo()) {
      die(`fatal: not a sit repository (or any of the parent directories): ${repo.localRepo}`);
    };
  };

  Repo.catFile = (obj, opts) => {
    const { type, size, prettyPrint } = opts;

    repo.catFile(obj)
      .then(result => {
        if (type) {
          console.log(result.fmt);
        } else if (size) {
          console.log(result.size);
        } else if (prettyPrint) {
          console.log(result.serialize().toString());
        } else {
          die(`Do not support options ${opts}`);
        }
      })
      .catch(err => {
        die(err.message);
      });
  };

  Repo.hashObject = (path, opts = {}) => {
    return repo.hashObject(path, opts);
  };

  Repo.branch = (opts = {}) => {
    return repo.branch(opts);
  };

  Repo.checkout = (repoName, name, opts = {}) => {
    return repo.checkout(repoName, name, opts);
  };

  Repo.status = (opts = {}) => {
    return repo.status(opts);
  };

  Repo.diff = (opts = {}) => {
    return repo.diff(opts);
  };

  Repo.commit = (opts = {}) => {
    return repo.commit(opts);
  };

  Repo.merge = (repoName, branch, opts = {}) => {
    return repo.merge(repoName, branch, opts);
  };

  Repo.browseRemote = (repoName) => {
    return repo.browseRemote(repoName);
  };

  Repo.config = (key, value, opts = {}) => {
    const { global, local } = opts;
    if (global) {
      return new SitConfig('global').update(key, value);
    } else if (local) {
      return new SitConfig('local').update(key, value);
    }
  };

  Repo.remote = (subcommand, repoName, url, opts = {}) => {
    return repo.remote(subcommand, repoName, url, opts);
  };

  Repo.log = (opts = {}) => {
    return repo.log(repo._refResolve('HEAD'), opts);
  };

  Repo.stash = (subcommand, opts = {}) => {
    return repo.stash(subcommand, opts);
  };

  Repo.reflog = () => {
    return repo.reflog();
  };

  Repo.showRef = () => {
    return repo.showRef();
  };

  Repo.revParse = (obj, opts = {}) => {
    return repo.revParse(obj, opts);
  };

  Repo.pullRequest = (repoName, toFrom, opts = {}) => {
    const { type } = opts;
    const pattern = /^(?<toBranch>.+)\.{3}(?<fromBranch>.+)$/;
    const result = toFrom.match(pattern);
    let toBranch, fromBranch;

    if (result) {
      toBranch = result.groups.toBranch;
      fromBranch = result.groups.fromBranch;
    } else {
      toBranch = null;
      fromBranch = null;
    }

    if (!toBranch || !fromBranch) {
      die(`fatal: ambiguous argument '${toFrom}': unknown revision or path not in the working tree.`);
    }

    if (!repo._isExistFile(`refs/remotes/${repoName}/${toBranch}`)) {
      die(`error: pathspec '${repoName}/${toBranch}' did not match any file(s) known to sit`);
    }

    if (!repo._isExistFile(`refs/remotes/${repoName}/${fromBranch}`)) {
      die(`error: pathspec '${repoName}/${fromBranch}' did not match any file(s) known to sit`);
    }

    sheet.getRows(repoName, toBranch).then(toData => {
      sheet.getRows(repoName, fromBranch).then(fromData => {
        repo.createPullRequestData(toData, fromData, (result) => {
          const prBranch = `[pr] ${toBranch}...${fromBranch}`;

          sheet.pushRows(repoName, prBranch, result, { clear: true }).then(() => {
            const baseMsg = `\
Total 1\n\
remote:\n\
remote: Create a pull request for '${toBranch}' from '${fromBranch}' on ${type} by visiting:\n\
remote:     ${repo.remoteRepo(repoName)}\n\
remote:\n\
To ${repo.remoteRepo(repoName)}`;

            const detailMsg = `\tPlease look at sheet: '${prBranch}' in ${type}`;
            console.log(`${baseMsg}\n${detailMsg}`);
          });
        });
      });
    });
  };

  Clasp.update = () => {
    return clasp.update();
  };

  return {
    Sheet,
    Repo,
    Clasp,
  };
}

module.exports = sit;
