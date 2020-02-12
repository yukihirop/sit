'use strict';

const {
  appendFile,
  rootAbsolutePath,
  absolutePath,
  isExistFile,
  fileBasename,
  fileCopySync,
  pathJoin
} = require('./utils/file');

const SitSetting = require('./SitSetting');

class Clasp {
  constructor(opts) {
    this.localRepoName = SitSetting.repo.local
    this.localRepo = `${process.env.SIT_DIR}/${this.localRepoName}` || this.findLocalRepo();
    this.claspPath = `${this.localRepo}/scripts/clasp`;
  }

  update() {
    const rootFilesPath = rootAbsolutePath('./src/clasp');
    const destPath = absolutePath(this.claspPath);
    const rootClaspignorePath = rootAbsolutePath('./src/clasp/.claspignore');
    const destClaspignorePath = absolutePath('./.claspignore');

    if (isExistFile(this.localRepo)) {
      // copy .claspignore.
      fileCopySync(rootClaspignorePath, destClaspignorePath);
      // copy clasp/*.js into local repo.
      fileCopySync(`${rootFilesPath}`, `${destPath}`, { mkdirp: true });
      // append don't ignore GAS codes into .claspignore
      appendFile(`${destClaspignorePath}`, `!${fileBasename(this.localRepo)}/scripts/clasp/**/*.js`);
      if (isExistFile(`${this.localRepo}/scripts/clasp`)) {
        console.log(`update files: ${this.claspPath}`);
      } else {
        console.log(`create files: ${this.claspPath}`);
      }
    } else {
      console.error(`Don't exists local repo: ${this.localRepo}.`);
    }
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

module.exports = Clasp;
