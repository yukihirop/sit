const { Command } = require('../src/main/monkey_patches/commander');
const sit = require('../src/main/index');

function StashCmd() {
  const stashCmd = new Command();

  stashCmd
    .name('stash')
    .description('stash cli')

  stashCmd
    .command('save [saveMessage]')
    .description('Save your local modifications to a new stash entry and roll them back to HEAD (in the working tree and in the index)')
    .action((saveMessage, options) => {
      options = Object.assign(options, { saveMessage })
      sit().Repo.stash('save', options)
    });

  stashCmd
    .command('apply [stashKey]')
    .description('Like pop, but do not remove the state from the stash list. Unlike pop')
    .action((stashKey, options) => {
      options = Object.assign(options, { stashKey })
      sit().Repo.stash('apply', options)
    });

  stashCmd
    .command('pop [stashKey]')
    .description('Remove a single stashed state from the stash list and apply it on top of the current working tree state')
    .action((stashKey, options) => {
      options = Object.assign(options, { stashKey })
      sit().Repo.stash('pop', options)
    });

  stashCmd
    .command('list')
    .description('List the stash entries that you currently have.')
    .action((options) => {
      sit().Repo.stash('list', options)
    });

  stashCmd
    .command('show [stashKey]')
    .description(' Show the changes recorded in the stash entry as a diff between the stashed contents and the commit back when the stash entry was first created.')
    .option(
      '-p, --print',
      'display diff from HEAD'
    )
    .action((stashKey, options) => {
      options = Object.assign(options, { stashKey })
      sit().Repo.stash('show', options)
    });

  stashCmd
    .command('drop [stashKey]')
    .description('Remove a single stash entry from the list of stash entries.')
    .action((stashKey, options) => {
      options = Object.assign(options, { stashKey })
      sit().Repo.stash('drop', options)
    });

  return stashCmd
}

module.exports = StashCmd;
