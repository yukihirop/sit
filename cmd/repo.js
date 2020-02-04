const { Command } = require('../src/main/monkey_patches/commander');
const sit = require('../src/main/index');

function RepoCmd() {
  const repoCmd = new Command();

  repoCmd
    .name('repo')
    .description('repo cli')

  repoCmd
    .command('init')
    .action(() => {
      sit().Repo.init();
      sit().Clasp.update();
    });

  return repoCmd
}

module.exports = RepoCmd;
