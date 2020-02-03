'use strict';

const fs = require('fs')
  , fsExtra = require('fs-extra')
  , path = require('path')
  , yaml = require('js-yaml')
  , csv = require('csv')
  , csvSync = require('csv-parse/lib/sync')
  , zlib = require('zlib')
  , recursive = require('recursive-readdir')
  , rmdir = require('rmdir')
  , ini = require('ini');

const currentPath = fs.realpathSync('./');
const rootPath = path.resolve(__dirname, '../../../');

const isExistFile = (file) => {
  try {
    fs.statSync(file);
    return true
  } catch (err) {
    if (err.code === 'ENOENT') return false
  }
}

const isDir = (file) => {
  try {
    const stats = fs.statSync(file)
    return stats.isDirectory()
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

const rootYamlSafeLoad = (file, isRelative = true, encoding = 'utf-8') => {
  var loadPath = file;

  if (isRelative) {
    loadPath = path.resolve(rootPath, file)
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
  return require(`${rootPath}/package.json`);
}

const absolutePath = (file) => {
  return path.resolve(currentPath, file);
}

const rootAbsolutePath = (file) => {
  return path.resolve(rootPath, file);
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

const appendFile = (file, data) => {
  const fullPath = absolutePath(file);
  fs.appendFile(fullPath, data, (err) => {
    if (err) throw err;
  });
}

const fileSafeLoad = (file, isRelative = true, encoding = 'utf-8') => {
  let loadPath = file;

  if (isRelative) {
    loadPath = path.resolve(currentPath, file);
  }

  return fs.readFileSync(loadPath, encoding);
}

const fileUnzip = (file, isRelative = true, callback) => {
  let loadPath = file;

  if (isRelative) {
    loadPath = path.resolve(currentPath, file)
  }

  const content = fs.readFileSync(loadPath);

  zlib.unzip(content, (err, binary) => {
    callback(err, binary);
  });
}

const fileDeflate = (data, callback) => {
  zlib.deflate(data, (err, buffer) => {
    callback(err, buffer);
  });
}

const fileBasename = (file) => {
  return path.basename(file);
}

const fileCopySync = (fromPath, toPath, opts) => {
  fsExtra.copySync(fromPath, toPath, opts);
}

const deleteSyncFile = (path) => {
  try {
    fs.unlinkSync(path);
  } catch (error) {
    throw error;
  }
}

const mTimeMs = (file, isRelative = true) => {
  let loadPath = file;

  if (isRelative) {
    loadPath = path.resolve(currentPath, file)
  }

  return fs.statSync(loadPath).mtimeMs;
}

const rmDirSync = (file, isRelative = true) => {
  let loadPath = file;

  if (isRelative) {
    loadPath = path.resolve(currentPath, file)
  }

  rmdir(loadPath, (err, dirs, files) => {
    if (err) throw err;
  });
}

const iniParse = (file, isRelative = true, encoding = 'utf-8') => {
  let loadPath = file;

  if (isRelative) {
    loadPath = path.resolve(currentPath, file)
  }

  return ini.parse(fs.readFileSync(loadPath, encoding));
}

const iniStringify = (config, data) => {
  return ini.stringify(config, data);
}

module.exports = {
  isExistFile,
  isDir,
  writeSyncFile,
  mkdirSyncRecursive,
  yamlSafeLoad,
  rootYamlSafeLoad,
  yamlDumpWriteSyncFile,
  jsonSafeLoad,
  packageJSON,
  absolutePath,
  rootAbsolutePath,
  writeSyncCSV,
  csvSafeLoad,
  appendFile,
  fileSafeLoad,
  fileUnzip,
  fileDeflate,
  fileBasename,
  fileCopySync,
  recursive,
  deleteSyncFile,
  mTimeMs,
  rmDirSync,
  iniParse,
  iniStringify
}
