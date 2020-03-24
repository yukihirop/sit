
const fs = require('fs')
  , fsExtra = require('fs-extra')
  , path = require('path')
  , yaml = require('js-yaml')
  , csv = require('csv')
  , csvSync = require('csv-parse/lib/sync')
  , zlib = require('zlib')
  , recursive = require('recursive-readdir')
  , rmdir = require('rmdir')
  , bufferReplace = require('buffer-replace')
  , ini = require('ini');

const currentPath = fs.realpathSync('./');
const rootPath = path.resolve(__dirname, '../../../');

const isExistFile = (file) => {
  try {
    fs.statSync(file);
    return true;
  } catch (err) {
    if (err.code === 'ENOENT') return false;
  }
};

const isDir = (file) => {
  try {
    const stats = fs.statSync(file);
    return stats.isDirectory();
  } catch (err) {
    if (err.code === 'ENOENT') return false;
  }
};

const writeSyncFile = (file, data, check = false) => {
  if (check) {
    if (isExistFile(file) === false) {
      fs.writeFileSync(file, data);
    }
  } else {
    fs.writeFileSync(file, data);
  }
};

const mkdirSyncRecursive = (dir) => {
  const fullPath = path.resolve(currentPath, dir);
  fullPath.split('/').reduce((acc, item) => {
    const path = item ? [acc, item].join('/') : '';
    if (path && !fs.existsSync(path)) {
      fs.mkdirSync(path);
    }
    return path;
  }, '');
};

const yamlSafeLoad = (file, isRelative = true, encoding = 'utf-8') => {
  let loadPath = file;

  if (isRelative) {
    loadPath = path.resolve(currentPath, file);
  }

  const yamlText = fs.readFileSync(loadPath, encoding)
    , yamlData = yaml.safeLoad(yamlText);
  return yamlData;
};

const rootYamlSafeLoad = (file, isRelative = true, encoding = 'utf-8') => {
  let loadPath = file;

  if (isRelative) {
    loadPath = path.resolve(rootPath, file);
  }

  const yamlText = fs.readFileSync(loadPath, encoding)
    , yamlData = yaml.safeLoad(yamlText);
  return yamlData;
};

const yamlDumpWriteSyncFile = (file, data) => {
  const yamlText = yaml.dump(data);
  writeSyncFile(file, yamlText);
};

const jsonSafeLoad = (file) => {
  const fullPath = path.resolve(currentPath, file);
  return require(fullPath);
};

const packageJSON = () => {
  return require(`${rootPath}/package.json`);
};

const absolutePath = (file) => {
  return path.resolve(currentPath, file);
};

const rootAbsolutePath = (file) => {
  return path.resolve(rootPath, file);
};

const writeSyncCSV = (file, data, check = false) => {
  if (check) {
    if (isExistFile(file) === false) {
      csv.stringify(data, (_, output) => {
        fs.writeFileSync(file, output);
      });
    }
  } else {
    csv.stringify(data, (_, output) => {
      fs.writeFileSync(file, output);
    });
  }
};

const csvSafeLoad = (file) => {
  const data = fs.readFileSync(file);
  return csvSync(data);
};

const appendFile = (file, data) => {
  const fullPath = absolutePath(file);
  fs.appendFileSync(fullPath, data);
};

const fileSafeLoad = (file, isRelative = true, encoding = 'utf-8') => {
  let loadPath = file;
  let data, err;

  if (isRelative) {
    loadPath = path.resolve(currentPath, file);
  }

  if (isExistFile(loadPath)) {
    data = fs.readFileSync(loadPath, encoding);
    err = null;
  } else {
    data = null;
    err = new Error(`Do not exist file: ${loadPath}`);
  }

  return { err, data };
};

const fileUnzipSync = (file, isRelative = true) => {
  let loadPath = file;

  if (isRelative) {
    loadPath = path.resolve(currentPath, file);
  }

  const content = fs.readFileSync(loadPath);

  return zlib.unzipSync(Buffer.from(content, 'base64'));
};

const fileDeflateSync = (data) => {
  return zlib.deflateSync(data);
};

const fileBasename = (file) => {
  return path.basename(file);
};

const fileCopySync = (fromPath, toPath, opts) => {
  fsExtra.copySync(fromPath, toPath, opts);
};

/* eslint-disable no-useless-catch */
const deleteSyncFile = (path) => {
  try {
    fs.unlinkSync(path);
  } catch (error) {
    throw error;
  }
};
/* eslint-enable no-useless-catch */

const mTimeMs = (file, isRelative = true) => {
  let loadPath = file;

  if (isRelative) {
    loadPath = path.resolve(currentPath, file);
  }

  return fs.statSync(loadPath).mtimeMs;
};

const rmDirSync = (file, isRelative = true) => {
  let loadPath = file;

  if (isRelative) {
    loadPath = path.resolve(currentPath, file);
  }

  rmdir(loadPath, (err) => {
    if (err) throw err;
  });
};

const iniParse = (file, isRelative = true, encoding = 'utf-8') => {
  let loadPath = file;

  if (isRelative) {
    loadPath = path.resolve(currentPath, file);
  }

  return ini.parse(fs.readFileSync(loadPath, encoding));
};

const iniStringify = (config, data) => {
  return ini.stringify(config, data);
};

const pathJoin = (to, from) => {
  return path.join(to, from);
};

const pathDirname = (file) => {
  return path.dirname(file);
};

const pathRelative = (from, to) => {
  return path.relative(from, to);
};

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
  fileUnzipSync,
  fileDeflateSync,
  fileBasename,
  fileCopySync,
  recursive,
  deleteSyncFile,
  mTimeMs,
  rmDirSync,
  iniParse,
  iniStringify,
  pathJoin,
  pathDirname,
  pathRelative,
  currentPath,
  bufferReplace,
};
