'use strict';

// Copy from https://github.com/tj/commander.js/pull/1024/files
const { Command } = require('commander');

Command.prototype.useSubcommand = function (subCommand) {
  if (this._args.length > 0) throw Error('useSubcommand cannot be applied to a command with explicit args');
  if (!subCommand._name) throw Error('subCommand name is not specified');

  var listener = function (args, unknown) {
    // Parse any so-far unknown options
    args = args || [];
    unknown = unknown || [];

    var parsed = subCommand.parseOptions(unknown);
    if (parsed.args.length) args = parsed.args.concat(args);
    unknown = parsed.unknown;

    // Output help if necessary

    const helpRequested = unknown.includes(subCommand._helpLongFlag) || unknown.includes(subCommand._helpShortFlag);
    const noFutherValidCommands = args.length === 0 || !subCommand.listeners('command:' + args[0]);
    const noFurtherCommandsButExpected = args.length === 0 && unknown.length === 0 && subCommand.commands.length > 0;
    if ((helpRequested && noFutherValidCommands) || noFurtherCommandsButExpected) {
      subCommand.outputHelp();
      subCommand._exit(0, 'commander.useSubcommand.listener', `outputHelp(${subCommand._name})`);
    }

    subCommand.parseArgs(args, unknown);
  };

  for (const label of [subCommand._name, subCommand._alias]) {
    if (label) this.on('command:' + label, listener);
  }
  this.commands.push(subCommand);
  subCommand.parent = this;
  return this;
};

/**
 * Returns an object with all options values, including parent options values
 * This makes it especially useful with useSubcommand as it collects
 * options from the whole command chain, including parent levels.
 * beware that subcommand opts enjoy the priority over the parent ones
 *
 * @returns {Object} dictionary of option values
 */

Command.prototype.collectAllOptions = function () {
  var allOpts = {};
  var node = this;
  while (node) {
    allOpts = node.options
      .map(o => o.attributeName())
      .filter(o => typeof node[o] !== 'function')
      .reduce((r, o) => ({ [o]: node[o], ...r }), allOpts); // deeper opts enjoy the priority
    node = node.parent;
  }
  return allOpts;
};

module.exports = {
  Command,
};
