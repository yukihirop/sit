const { Command } = require('../src/main/monkey_patches/commander');
const {
  appendFile,
  yamlSafeLoad,
  rootAbsolutePath,
  absolutePath,
  isExistFile
} = require('../src/main/utils/file');

const fs = require('fs-extra')
  , path = require('path')
  , execSync = require('child_process').execSync;

function ClaspCmd() {
  const claspCmd = new Command();

  claspCmd
    .name('clasp')
    .description('clasp cli')

  claspCmd
    .command('init')
    .action(() => {
      const yamlData = yamlSafeLoad('./.sitconfig');
      const localRepo = yamlData["repo"]["local"];
      const claspPath = `${localRepo}/scripts/clasp`;

      const rootFilesPath = rootAbsolutePath('./src/clasp');
      const destPath = absolutePath(claspPath);

      const rootClaspignorePath = rootAbsolutePath('./src/clasp/.claspignore');
      const destClaspignorePath = absolutePath('./.claspignore');

      if (isExistFile(localRepo)) {
        // copy .claspignore.
        fs.copySync(rootClaspignorePath, destClaspignorePath);
        // copy clasp/*.js into local repo.
        fs.copySync(`${rootFilesPath}`, `${destPath}`, { mkdirp: true });
        // append don't ignore GAS codes into .claspignore
        appendFile(`${destClaspignorePath}`, `!${path.basename(localRepo)}/scripts/clasp/**/*.js`);

        if (isExistFile(`${localRepo}/scripts/clasp`)) {
          console.log(`update files: ${claspPath}`);
        } else {
          console.log(`create files: ${claspPath}`);
        }
      } else {
        console.error(`Don't exists local repo: ${localRepo}.`);
      }
    });

  return claspCmd
}

module.exports = ClaspCmd;
