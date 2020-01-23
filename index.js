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
    }).Sheet.fetch(repository, branch).then(result => {
      console.log(`updated file: ${result}`);
    });
  });

program
  .command('push <repository> <branch>')
  .description('push rows into Sheet')
  .option(
    '-t, --type <type>',
    'sheet type',
    'GoogleSpreadSheet'
  )
  .action((repository, branch, options) => {
    const { type } = options;
    sit({
      type: type
    }).Sheet.push(repository, branch).then(result => {
      result.forEach(data => {
        console.log(data);
      })
    });
  });

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
  .useSubcommand(initCmd)
  .useSubcommand(claspCmd)
  .useSubcommand(repoCmd)

if (process.argv.length <= 2) {
  program.help();
} else {
  program.parse(process.argv);
}
