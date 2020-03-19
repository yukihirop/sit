#!/usr/bin/env node

/* refereence
  https://github.com/tj/commander.js/pull/1024/files
*/
const sit = require('./src/main/index');
const { Command } = require('./src/main/monkey_patches/commander')
  , pkg = require('./package.json')
  , program = new Command()
  , initCmd = require('./cmd/init')()
  , claspCmd = require('./cmd/clasp')()
  , repoCmd = require('./cmd/repo')()
  , stashCmd = require('./cmd/stash')()

program
  .version(pkg.version)

program
  .description('sit cli')

program
  .command('cat-file <hash>')
  .description('cat sit objects')
  .option(
    '-t, --type',
    'show object type'
  )
  .option(
    '-s, --size',
    'show object size'
  )
  .option(
    '-p, --pretty-print',
    "pretty-print object's content"
  )
  .action((hash, options) => {
    sit().Repo.catFile(hash, options);
  })

program
  .command('hash-object <path>')
  .description('compute hash sit object')
  .option(
    '-t, --type <type>',
    'object type',
    'blob'
  )
  .option(
    '-w, --write',
    'write the object into the object database'
  )
  .action((path, options) => {
    const hash = sit().Repo.hashObject(path, options);
    console.log(hash);
  })

program
  .command('branch')
  .description('operate branch')
  .option(
    '-a, --all',
    'display branch all'
  )
  .option(
    '-D, --deleteBranch <deleteBranch>',
    'delete branch'
  )
  .option(
    '-m, --moveBranch <moveBranch>',
    'move/rename a branch and its reflog'
  )
  .action(options => {
    sit().Repo.branch(options);
  });

program
  .command('checkout [repository] [name]')
  .description('checkout branch')
  .option(
    '-b, --branch <branch>',
    'branch'
  )
  .action((repository, name, options) => {
    const { branch } = options;
    sit().Repo.checkout(repository, name, { branch });
  });

program
  .command('status')
  .description('status dist file')
  .action(options => {
    sit().Repo.status(options);
  });

program
  .command('diff')
  .description('diff dist file')
  .action(options => {
    sit().Repo.diff(options);
  });

program
  .command('commit')
  .description('commit dist file')
  .option(
    '-m, --message <message>',
    'commit message'
  )
  .action(options => {
    sit().Repo.commit(options);
  })

program
  .command('push <repository> <branch>')
  .description('push rows into Sheet')
  .option(
    '-t, --type <type>',
    'sheet type',
    'GoogleSpreadSheet'
  )
  .option(
    '-f, --force',
    'override sheet'
  )
  .action((repository, branch, options) => {
    const { type, force } = options;
    sit({
      type: type
    }).Repo.push(repository, branch, options);
  });

program
  .command('fetch <repository> [branch]')
  .description('fetch rows from Sheet')
  .option(
    '-t, --type <type>',
    'sheet type',
    'GoogleSpreadSheet'
  )
  .option(
    '--prune',
    'prune refs/remotes'
  )
  .option(
    '--verbose',
    'display info',
    true
  )
  .action((repository, branch, options) => {
    const { type, prune, verbose } = options;
    sit({
      type: type
    }).Repo.fetch(repository, branch, { type, prune, verbose })
  });

program
  .command('merge [repository] [branch]')
  .description('merge rows')
  .option(
    '--continue',
    'continue merge'
  )
  .option(
    '--stat',
    'merge status'
  )
  .option(
    '--abort',
    'abort merge'
  )
  .action((repository, branch, options) => {
    sit().Repo.merge(repository, branch, options);
  });

program
  .command('clone <repository> <url>')
  .description('clone rows from sheet')
  .option(
    '-t, --type <type>',
    'sheet type',
    'GoogleSpreadSheet'
  )
  .action((repository, url, options) => {
    sit().Repo.clone(repository, url, options);
  });

program
  .command('browse-remote [repository]')
  .description('browse remote repository')
  .action((repository, _options) => {
    sit().Repo.browseRemote(repository);
  });

program
  .command('config <key> <value>')
  .description('configure sitconfig')
  .option(
    '--global',
    'global setting'
  )
  .option(
    '--local',
    'local setting'
  )
  .action((key, value, options) => {
    sit().Repo.config(key, value, options);
  });

program
  .command('remote <subcommand> <repository> [url]')
  .description('set sitconfig')
  .option(
    '-t, --type <type>',
    'sheet type',
    'GoogleSpreadSheet'
  )
  .action((subcommand, repository, url, options) => {
    sit().Repo.remote(subcommand, repository, url, options)
  })

program
  .command('log')
  .description('Shows the commit logs')
  .option(
    '--oneline',
    'display oneline commit message'
  )
  .action((options) => {
    sit().Repo.log(options);
  });

program
  .command('reflog')
  .description('Shows the ref logs')
  .action((options) => {
    sit().Repo.reflog(options)
  });

program
  .command('show-ref')
  .description('Show refs')
  .action((options) => {
    sit().Repo.showRef(options)
  })

program
  .command('rev-parse [args]')
  .description('Many Sit porcelainish commands take mixture of flags')
  .option(
    '--short',
    'display short'
  )
  .action((args, options) => {
    sit().Repo.revParse(args, options)
  })

program
  .useSubcommand(initCmd)
  .useSubcommand(claspCmd)
  .useSubcommand(repoCmd)
  .useSubcommand(stashCmd)

if (process.argv.length <= 2) {
  program.help();
} else {
  const checkConditions = [
    process.argv.indexOf('-h') == -1,
    process.argv.indexOf('--help') == -1,
    process.argv.indexOf('clone') == -1,
    process.argv.indexOf('init') == -1
  ];
  const isCheck = !checkConditions.some(c => c === false);

  if (isCheck) {
    sit().Repo.checkLocalRepo();
  }
  program.parse(process.argv);
}
