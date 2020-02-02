'use strict';

const {
  appendFile,
  yamlSafeLoad,
  rootAbsolutePath,
  absolutePath,
  isExistFile,
  fileBasename,
  fileCopySync
} = require('./utils/file');

const fs = require('fs-extra')

class Clasp {
  constructor(opts) {
    this.settingPath = opts.settingPath;
    this.settingData = yamlSafeLoad(this.settingPath);
    this.localRepo = this.settingData["repo"]["local"];
    this.claspPath = `${this.localRepo}/scripts/clasp`;
  }

  init() {
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
}

module.exports = Clasp;
