'use strict';

const {
  absolutePath,
  isExistFile,
  pathJoin,
  pathRelative,
  currentPath
} = require('../../utils/file');

const SitSetting = require('../../SitSetting');

const INITIAL_HASH = '0000000000000000000000000000000000000000';

const HOME_DIR = process.env[process.platform == "win32" ? "USERPROFILE" : "HOME"];

class SitBase {
  constructor() {
    this.localRepoName = SitSetting.repo.local
    this.localRepo = this.findLocalRepo() || `./${this.localRepoName}`;
    this.homeDir = HOME_DIR;
  }

  _INITIAL_HASH() {
    return INITIAL_HASH;
  }

  static homeDir() {
    return HOME_DIR;
  }

  findLocalRepo(path = process.env.SIT_DIR || '.', required = false) {
    const apath = absolutePath(path)
    const repoPath = `${apath}/${this.localRepoName}`
    if (isExistFile(repoPath)) {
      return pathRelative(currentPath, repoPath)
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
