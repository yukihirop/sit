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
  .action(options => {
    sit().Repo.branch(options);
  });

program
  .command('checkout [name]')
  .description('checkout branch')
  .option(
    '-b, --branch <branch>',
    'branch'
  )
  .action((name, options) => {
    sit().Repo.checkout(name, options);
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
  .command('fetch <repository> <branch>')
  .description('fetch rows from Sheet')
  .option(
    '-t, --type <type>',
    'sheet type',
    'GoogleSpreadSheet'
  )
  .action((repository, branch, options) => {
    const { type } = options;
    sit({
      type: type
    }).Repo.fetch(repository, branch)
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
  .useSubcommand(initCmd)
  .useSubcommand(claspCmd)
  .useSubcommand(repoCmd)

if (process.argv.length <= 2) {
  program.help();
} else {
  const checkConditions = [
    process.argv.indexOf('-h') == -1,
    process.argv.indexOf('--help') == -1,
    process.argv.indexOf('clone') == -1
  ];
  const isCheck = !checkConditions.some(c => c === false);

  if (isCheck) {
    sit().Repo.checkLocalRepo();
  }
  program.parse(process.argv);
}
