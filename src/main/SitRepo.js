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
}

module.exports = SitRepo;
