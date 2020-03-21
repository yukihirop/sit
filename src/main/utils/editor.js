'use strict';

// Reference
// https://hide-o-55.hatenadiary.org/entry/20111025/1319541282
//

const { spawn } = require('child_process');

const open = (file, callback) => {
  const editor = process.env.EDITOR || 'vim';
  const child = spawn(editor, [file], {
    cwd: process.cwd(),
    customFds: [0, 1, 2],
  });
  callback(file);
};

module.exports = {
  open,
};
