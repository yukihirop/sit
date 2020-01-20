'use strict';

const {
  isExistFile,
  yamlSafeLoad,
  mkdirSyncRecursive,
  writeSyncFile
} = require('./utils/file');

function Repo(opts) {
  const { settingPath } = opts;
  const yamlData = yamlSafeLoad(settingPath)
    , localRepo = yamlData["repo"]["local"];

  const init = () => {

    if (isExistFile(localRepo)) {
      console.log(`already exist local repo: ${localRepo}`);
    } else {
      mkdirSyncRecursive(localRepo)
      mkdirSyncRecursive(`${localRepo}/refs/heads`);
      mkdirSyncRecursive(`${localRepo}/refs/remotes`);
      mkdirSyncRecursive(`${localRepo}/objects`);
      mkdirSyncRecursive(`${localRepo}/logs/refs/heads`);

      writeSyncFile(`${localRepo}/HEAD`, "ref: refs/heads/master", true);
      writeSyncFile(`${localRepo}`, "", true);

      console.log(`created local repo: ${localRepo}`);
    }
  }

  return {
    init
  }
}

module.exports = Repo;
