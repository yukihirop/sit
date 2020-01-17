'use strict';

const fs = require('fs')
  , path = require('path')
  , yaml = require('js-yaml')
  , csv = require('csv')
  , csvSync = require('csv-parse/lib/sync');

const currentPath = fs.realpathSync('./');

const isExistFile = (file) => {
  try {
    fs.statSync(file);
    return true
  } catch (err) {
    if (err.code === 'ENOENT') return false
  }
}

const writeSyncFile = (file, data, check = false) => {
  if (check) {
    if (isExistFile(file) === false) {
      fs.writeFile(file, data, (err) => {
        if (err) throw err;
      });
    }
  } else {
    fs.writeFile(file, data, (err) => {
      if (err) throw err;
    });
  }
}

const mkdirSyncRecursive = (dir) => {
  const fullPath = path.resolve(currentPath, dir)
  fullPath.split('/').reduce((acc, item) => {
    const path = item ? [acc, item].join('/') : '';
    if (path && !fs.existsSync(path)) {
      fs.mkdirSync(path);
    }
    return path;
  }, '');
}

const yamlSafeLoad = (file, isRelative = true, encoding = 'utf-8') => {
  var loadPath = file;

  if (isRelative) {
    loadPath = path.resolve(currentPath, file)
  }

  var yamlText = fs.readFileSync(loadPath, encoding)
    , yamlData = yaml.safeLoad(yamlText);
  return yamlData
}

const yamlDumpWriteSyncFile = (file, data) => {
  const yamlText = yaml.dump(data);
  writeSyncFile(file, yamlText);
}

const jsonSafeLoad = (file) => {
  const fullPath = path.resolve(currentPath, file);
  return require(fullPath);
}

const packageJSON = () => {
  return require(`${currentPath}/package.json`);
}

const absolutePath = (file) => {
  return path.resolve(currentPath, file);
}

const writeSyncCSV = (file, data, check = false) => {
  if (check) {
    if (isExistFile(file) === false) {
      csv.stringify(data, (_, output) => {
        fs.writeFile(file, output, (err) => {
          if (err) throw err;
        });
      });
    }
  } else {
    csv.stringify(data, (_, output) => {
      fs.writeFile(file, output, (err) => {
        if (err) throw err;
      });
    })
  }
}

const csvSafeLoad = (file) => {
  const data = fs.readFileSync(file);
  return csvSync(data)
}

module.exports = {
  isExistFile,
  writeSyncFile,
  mkdirSyncRecursive,
  yamlSafeLoad,
  yamlDumpWriteSyncFile,
  jsonSafeLoad,
  packageJSON,
  absolutePath,
  writeSyncCSV,
  csvSafeLoad
}
