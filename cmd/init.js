const { Command } = require('../src/main/monkey_patches/commander');
const { rootYamlSafeLoad, yamlDumpWriteSyncFile, isExistFile } = require('../src/main/utils/file');

const fs = require('fs')
  , currentPath = fs.realpathSync('./');

function InitCmd() {
  const initCmd = new Command();

  initCmd
    .name('init')
    .description('create setting file (.sitsetting)')
    .action(() => {
      var yamlData = rootYamlSafeLoad('./src/main/template.sitsetting.yaml');
      var settingPath = `${currentPath}/.sitsetting`;

      if (isExistFile(settingPath)) {
        console.log(`already exist file: ${settingPath}`);
      } else {
        yamlDumpWriteSyncFile(settingPath, yamlData);
        console.log(`created setting file: ${settingPath}`);
      }
    });

  return initCmd
}

module.exports = InitCmd;
