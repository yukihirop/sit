'use strict';

// Copy from https://github.com/millermedeiros/disparity/blob/master/disparity.js

const ansi = require('ansi-styles');
const colors = {
  charsRemoved: ansi.bgRed,
  charsAdded: ansi.bgGreen,
  removed: ansi.red,
  mark: ansi.red,
  added: ansi.green,
  error: ansi.red,
  info: ansi.yellow,
  header: ansi.yellow,
  section: ansi.magenta,
};

const colorize = (str, colorId) => {
  var color = colors[colorId];
  // avoid highlighting the "\n" (would highlight till the end of the line)
  return str.replace(/[^\n\r]+/g, color.open + '$&' + color.close);
};

module.exports = {
  colorize,
};
