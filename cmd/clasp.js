const { Command } = require('../src/main/monkey_patches/commander');
const sit = require('../src/main/index');

function ClaspCmd() {
  const claspCmd = new Command();

  claspCmd
    .name('clasp')
    .description('clasp cli')

  claspCmd
    .command('init')
    .action(() => {
      sit().Clasp.init();
    });

  return claspCmd
}

module.exports = ClaspCmd;
