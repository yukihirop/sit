'use strict';

const fs = require('fs-extra')
  , path = require('path')
  , rmdir = require('rmdir');

global.testFileCopySync = (fromPath, toPath, opts) => {
  fs.copySync(fromPath, toPath, opts);
}

global.testIsFileExist = (file) => {
  try {
    fs.statSync(file);
    return true
  } catch (err) {
    if (err.code === 'ENOENT') return false
  }
}

global.testRmDirSync = (file, isRelative = true, callback) => {
  let loadPath = file;
  const currentPath = fs.realpathSync('./');

  if (isRelative) {
    loadPath = path.resolve(currentPath, file)
  }

  rmdir(loadPath, (err, dirs, files) => {
    if (err) throw err;
    callback()
  });
}
