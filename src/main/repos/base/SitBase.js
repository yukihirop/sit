'use strict';

const {
  absolutePath,
  isExistFile,
  pathJoin
} = require('../../utils/file');

const SitSetting = require('../../SitSetting');

const INITIAL_HASH = '0000000000000000000000000000000000000000';

const HOME_DIR = process.env[process.platform == "win32" ? "USERPROFILE" : "HOME"];

class SitBase {
  constructor() {
    this.localRepoName = SitSetting.repo.local
    this.localRepo = `${process.env.SIT_DIR}/${this.localRepoName}` || this.findLocalRepo();
    this.homeDir = HOME_DIR;
  }

  _INITIAL_HASH() {
    return INITIAL_HASH;
  }

  static homeDir() {
    return HOME_DIR;
  }

  findLocalRepo(path = '.', required = true) {
    const apath = absolutePath(path)
    const repoPath = `${apath}/${this.localRepoName}`
    if (isExistFile(repoPath)) {
      return repoPath
    } else {
      const parent = pathJoin(apath, '..')
      if (parent === apath) {
        if (required) {
          throw new Error('No sit directory.')
        } else {
          return null
        }
      } else {
        return this.findLocalRepo(parent, required)
      }
    }
  }
}

module.exports = SitBase;
