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

  Repo.fetch = (repoName, branch, opts = {}) => {
    const { prune, verbose } = opts;

    if (repo.remoteRepo(repoName) === undefined) {
      console.error(`\
fatal: '${repoName}' does not appear to be a sit repository
fatal: Could not read from remote repository.

Please make sure you have the correct access rights and the repository exists.`);
      return
    } else {
      if (branch) {
        sheet.getRows(repoName, branch)
          .then(data => {
            const remoteHash = repo.hashObjectFromData(`${data.join('\n')}\n`, { type: 'blob', write: true });

            repo.fetch(repoName, branch, { prune, remoteHash })
              .then(result => {
                if (!verbose) return;

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
              })
              .catch(err => {
                console.error(err.message);
                process.exit(1);
              });
          })
          .catch(err => {
            console.error(`fatal: Couldn't find remote ref '${branch}'`);
          });

      } else {
        sheet.getRows(repoName, "refs/remotes", ['branch', 'sha1']).then(data => {
          const remoteRefs = csv2JSON(data.slice(1));
          const remoteBranches = Object.keys(remoteRefs);

          repo.fetch(repoName, null, { prune, remoteBranches, remoteRefs }, (repoName, addedBranches) => {
            const promises = addedBranches.map(branch => {
              sheet.getRows(repoName, branch)
                .then(data => {
                  repo.hashObjectFromData(`${data.join('\n')}\n`, { type: 'blob', write: true });
                })
                .catch(err => {
                  console.error(`fatal: Couldn't find remote ref '${branch}'`);
                });
            })

            Promise.all(promises)
          })
            .then(msg => {
              if (msg.length >= 1) {
                msg.unshift(`From ${repo.remoteRepo(repoName)}`)
                console.log(msg.join('\n'));
              }
            })

        }).catch(err => {
          console.error(`fatal: Couldn't find remote ref '${branch}'`);
        });
      }
    }
  }

  Repo.push = (repoName, branch, opts = {}) => {
    const { type, force } = opts;
    const REMOTEHEADHash = repo._refResolve('REMOTE_HEAD');
    const HEADHash = repo._refResolve('HEAD');

    if (repo.remoteRepo(repoName) === undefined) {
      console.error(`\
fatal: '${repoName}' does not appear to be a sit repository
fatal: Could not read from remote repository.

Please make sure you have the correct access rights and the repository exists.`);
      return
    } else {
      if (branch) {
        // Fetch refs/remotes from sheet
        sheet.getRows(repoName, "refs/remotes", ['branch', 'sha1']).then(data => {
          const json = csv2JSON(data);
          const remoteHash = json[branch];

          if (HEADHash === remoteHash) {
            console.log('Everything up-to-date');
            return;
          }

          const isPushableAboutREMOTEREADHash = (REMOTEHEADHash === repo._INITIAL_HASH()) ? true : (REMOTEHEADHash === remoteHash)
          if (!force && (remoteHash !== undefined) && !isPushableAboutREMOTEREADHash) {
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
          repo.push(repoName, branch, { ...opts, HEADHash }).then(hashData => {
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
            console.error(err.message);
            process.exit(1);
          });
        });
      } else {
        console.error("branch is required")
      }
    }
  }

  Repo.clone = (repoName, url, opts) => {
    sheet = new AppSheet({ ...gopts, url });
    // TODO: Check url is valid

    if (repoName) {
      if (url) {
        sheet.getRows(repoName, 'refs/remotes', ['branch', 'sha1']).then(data => {
          const json = csv2JSON(data);
          const remoteHash = json['master'];

          if (remoteHash === undefined) {
            console.error(`This Spreadsheet may not be repository.\nPlease visit ${url}\nMake sure that this Spreadsheet is rpeository.`)
          }

          sheet.getRows(repoName, 'master').then(data => {
            try {
              // Initialize local repo
              let result = repo.init();

              // Copy clasp scripts
              clasp.update();

              if (!result) {
                throw new Error(`fatal: destination path '${repo.distFilePath}' already exists and is not an empty directory.`)
              }

              let sha = repo.hashObjectFromData(`${data.join('\n')}\n`, { type: 'blob', write: true });

              // Update local repo
              repo.clone(repoName, url, sha, data.join('\n'), opts);

              console.log(`\
Cloning into ... '${repo.distFilePath}'\n\
remote: Total 1\n\
remote: done.`);

            } catch (err) {
              repo.rollback();
              console.error(err.message);
            }
          }).catch(err => {
            console.error(`fatal: Couldn't find remote ref 'master'`);
          });
        }).catch(err => {
          console.error(`fatal: repository '${url}' not found`);
        });
      } else {
        console.error('url is required')
      }
    } else {
      console.error('repository is required')
    }
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
    };
  }

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
          console.error(`Do not support options ${opts}`)
        }

      })
      .catch(err => {
        console.error(err.message);
      });
  }

  Repo.hashObject = (path, opts = {}) => {
    return repo.hashObject(path, opts);
  }

  Repo.branch = (opts = {}) => {
    return repo.branch(opts);
  }

  Repo.checkout = (repoName, name, opts = {}) => {
    return repo.checkout(repoName, name, opts);
  }

  Repo.status = (opts = {}) => {
    return repo.status(opts);
  }

  Repo.diff = (opts = {}) => {
    return repo.diff(opts);
  }

  Repo.commit = (opts = {}) => {
    return repo.commit(opts);
  }

  Repo.merge = (repoName, branch, opts = {}) => {
    return repo.merge(repoName, branch, opts);
  }

  Repo.browseRemote = (repoName) => {
    return repo.browseRemote(repoName);
  }

  Repo.config = (key, value, opts = {}) => {
    const { global, local } = opts;
    if (global) {
      return new SitConfig('global').update(key, value);
    } else if (local) {
      return new SitConfig('local').update(key, value);
    }
  }

  Repo.remote = (subcommand, repoName, url, opts = {}) => {
    return repo.remote(subcommand, repoName, url, opts);
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
