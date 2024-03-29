
const {
  isExistFile,
  isDir,
  writeSyncFile,
  mkdirSyncRecursive,
  fileSafeLoad,
  fileUnzipSync,
  fileDeflateSync,
  fileBasename,
  deleteSyncFile,
  iniParse,
  fileCopySync,
  absolutePath,
  pathJoin,
  pathDirname,
} = require('../../utils/file');

const {
  isEqual,
} = require('../../utils/array');

const SitSetting = require('../../SitSetting')
  , SitConfig = require('../SitConfig');

const recursive = require('recursive-readdir')
  , crypto = require('crypto')
  , moment = require('moment');

const SitBlob = require('../objects/SitBlob')
  , SitCommit = require('../objects/SitCommit')
  , SitLogger = require('../logs/SitLogger')
  , SitBase = require('./SitBase')
  , SitLogParser = require('../logs/SitLogParser')
  , SitRefParser = require('../refs/SitRefParser');

class SitBaseRepo extends SitBase {
  constructor(opts) {
    super(opts);
    this.distFilePath = pathJoin(pathDirname(SitSetting._internal_.settingPath), `${SitSetting.dist.path}/${SitSetting.dist.sheetName}`);
    this.localConfig = new SitConfig('local').config;
    this.globalConfig = new SitConfig('global').config;
  }

  remoteRepo(repoName) {
    const { remote } = new SitConfig('local').config;
    if (remote === undefined || remote[repoName] === undefined) {
      return undefined;
    } else {
      const repoData = remote[repoName];
      if (repoData) {
        return repoData.url;
      } else {
        return undefined;
      }
    }
  }

  username() {
    const { localConfig } = this;
    const { globalConfig } = this;
    const defaultName = 'anonymous';
    let result;

    if (localConfig.user) {
      if (localConfig.user.name) {
        result = localConfig.user.name;
      } else if (globalConfig.user) {
        if (globalConfig.user.name) {
          result = globalConfig.user.name;
        } else {
          result = defaultName;
        }
      } else {
        result = defaultName;
      }
    } else if (globalConfig.user) {
      if (globalConfig.user.name) {
        result = globalConfig.user.name;
      } else {
        result = defaultName;
      }
    } else {
      result = defaultName;
    }

    return result;
  }

  email() {
    const { localConfig } = this;
    const { globalConfig } = this;
    const defaultEmail = 'anonymous@example.com';
    let result;

    if (localConfig.user) {
      if (localConfig.user.email) {
        result = localConfig.user.email;
      } else if (globalConfig.user) {
        if (globalConfig.user.email) {
          result = globalConfig.user.email;
        } else {
          result = defaultEmail;
        }
      } else {
        result = defaultEmail;
      }
    } else if (globalConfig.user) {
      if (globalConfig.user.email) {
        result = globalConfig.user.email;
      } else {
        result = defaultEmail;
      }
    } else {
      result = defaultEmail;
    }

    return result;
  }

  currentBranch() {
    return this._branchResolve('HEAD');
  }

  _refBlob(ref) {
    const commitHash = this._refResolve(ref);
    let blobHash = null;

    if (commitHash === this._INITIAL_HASH()) {
      return this._INITIAL_HASH();
    }

    const { err, obj } = this._objectRead(commitHash);
    if (err) die(err.message);

    if (obj instanceof SitCommit) {
      blobHash = obj.blobHash();
    }

    return blobHash;
  }

  _refBlobFromCommitHash(commitHash) {
    let blobHash = null;

    if (commitHash === this._INITIAL_HASH()) {
      return this._INITIAL_HASH();
    }

    const { err, obj } = this._objectRead(commitHash);
    if (err) die(err.message);

    if (obj instanceof SitCommit) {
      blobHash = obj.blobHash();
    }

    return blobHash;
  }

  _createDistFile(data, write = false) {
    // STEP 7: Update dist file instead of Update index
    const distDir = pathDirname(this.distFilePath);
    if (!isExistFile(distDir)) {
      mkdirSyncRecursive(distDir);
    }
    if (!isExistFile(this.distFilePath)) {
      writeSyncFile(this.distFilePath, data);
    }
    if (write) {
      writeSyncFile(this.distFilePath, data);
    }
  }

  _refCSVData(branch, repoName) {
    let refPath;

    if (repoName) {
      refPath = `refs/remotes/${repoName}/${branch}`;
    } else {
      refPath = `refs/heads/${branch}`;
    }

    const parser = new SitRefParser(this, branch, refPath);
    return parser.parseToCSV();
  }

  _refLastLogCSVData(branch, repoName) {
    let logPath;

    if (repoName) {
      logPath = `logs/refs/remotes/${repoName}/${branch}`;
    } else {
      logPath = `logs/refs/heads/${branch}`;
    }

    const parser = new SitLogParser(this, branch, logPath);
    const logData = parser.parseToCSV();
    return [logData[0], logData.slice(-1)[0]];
  }

  /* eslint-disable prefer-const */
  _HEAD() {
    let { err, data } = fileSafeLoad(this.__repoFile(false, 'HEAD'));
    if (err) die(err.message);
    data = data.trim();

    if (data.startsWith('ref: ')) {
      return data.slice(5);
    } else {
      throw new Error('Invalid format HEAD');
    }
  }
  /* eslint-enable prefer-const */

  /* eslint-disable prefer-const */
  _COMMIT_EDITMSG() {
    let { err, data } = fileSafeLoad(this.__repoFile(false, 'COMMIT_EDITMSG'));
    if (err) die(err.message);
    data = data.trim();
    // Use only the first line message
    return data.split('\n')[0];
  }
  /* eslint-enable prefer-const */

  _isExistFile(path) {
    return isExistFile(`${this.localRepo}/${path}`);
  }

  _writeLog(file, beforeSHA, afterSHA, message, mkdir = true) {
    new SitLogger().write(file, beforeSHA, afterSHA, message, mkdir);
    return this;
  }

  _deleteLineLog(file, key) {
    const parser = new SitLogParser(this, this.currentBranch(), file);
    const logger = new SitLogger();

    logger.bulkOverWrite(file, parser.remakeLog(key));
    return this;
  }

  _writeSyncFile(path, data, mkdir = true) {
    if (mkdir) {
      const fullDirPath = this.localRepo + '/' + path.split('/').slice(0, -1).join('/');

      if (!isExistFile(fullDirPath)) {
        mkdirSyncRecursive(fullDirPath);
      }
    }

    writeSyncFile(`${this.localRepo}/${path}`, data);
    return this;
  }

  _readFileSync(path) {
    const { err, data } = fileSafeLoad(`${this.localRepo}/${path}`);
    if (err) die(err.message);
    return data;
  }

  _fileCopySync(from, to) {
    fileCopySync(`${this.localRepo}/${from}`, `${this.localRepo}/${to}`);
    return this;
  }

  _iniParse(path) {
    return iniParse(`${this.localRepo}/${path}`);
  }

  _deleteSyncFile(path) {
    deleteSyncFile(`${this.localRepo}/${path}`);
    return this;
  }

  _mkdirSyncRecursive(file) {
    if (file) {
      mkdirSyncRecursive(absolutePath(`${this.localRepoName}/${file}`));
    } else {
      mkdirSyncRecursive(absolutePath(this.localRepoName));
    }
    return this;
  }

  _createCommitMessage(blobHash, parentHash, message) {
    let result = '';
    const space = ' '
      , author = this.username()
      , email = this.email()
      , committer = author
      , timewithZone = `${moment().format('x')}${space}${moment().format('ZZ')}`;

    result += `blob${space}${blobHash}\n`;
    result += `parent${space}${parentHash}\n`;
    result += `author${space}${author}${space}<${email}>${space}${timewithZone}\n`;
    result += `committer${space}${committer}${space}<${email}>${space}${timewithZone}\n`;
    result += '\n';
    result += message;

    return result;
  }

  _createCommit(blobHash, parentHash, message) {
    const msg = this._createCommitMessage(blobHash, parentHash, message);
    return this._objectHash(msg, 'commit', true);
  }

  _createMergeCommitMessage(blobHash, parentHash, branch, type) {
    let result = '';
    const space = ' '
      , author = this.username()
      , authorEmail = this.email()
      , committer = type
      , committerEmail = `noreply@${type.toLowerCase()}.com`
      , timewithZone = `${moment().format('x')}${space}${moment().format('ZZ')}`
      , mergeMessage = `Merge from ${type}/${branch}`;

    result += `blob${space}${blobHash}\n`;
    result += `parent${space}${parentHash}\n`;
    result += `author${space}${author}${space}<${authorEmail}>${space}${timewithZone}\n`;
    result += `committer${space}${committer}${space}<${committerEmail}>${space}${timewithZone}\n`;
    result += '\n';
    result += mergeMessage;

    return result;
  }

  _createMergeCommit(blobHash, parentHash, branch, type) {
    const msg = this._createMergeCommitMessage(blobHash, parentHash, branch, type);
    return this._objectHash(msg, 'commit', true);
  }

  _twoWayMerge(toData, fromData, toName, fromName, callback) {
    const toMark = '<<<<<<<';
    const sepalate = '=======';
    const fromMark = '>>>>>>>';

    this.__createtwoWayMergeData(toData, fromData, result => {
      const arr = [];
      let currentItemIndex = 0;
      let currentConflict = false;
      const initialItem = { startIndex: 0, conflictLength: 0, to: [], from: [] };

      Object.keys(result).forEach((key, index) => {
        const line = result[key];
        let item = arr[currentItemIndex] || JSON.parse(JSON.stringify(initialItem));

        if (line.conflict) {
          item.startIndex = currentItemIndex;
          item.conflictLength++;
          item.to.push(line.to);
          item.from.push(line.from);
          arr[currentItemIndex] = item;
          currentConflict = true;
        } else if (currentConflict) {
          currentItemIndex++;
          item = arr[currentItemIndex] || JSON.parse(JSON.stringify(initialItem));
          item.startIndex = index;
          item.to.push(line.to);
          item.from.push(line.from);
          arr[currentItemIndex] = item;
          currentConflict = false;
        } else {
          item.startIndex = index;
          item.to.push(line.to);
          item.from.push(line.from);
          arr[currentItemIndex] = item;
          currentItemIndex++;
        }
      });

      const data = [];
      let isConflict = false;
      arr.forEach(item => {
        // conflict
        if (item.conflictLength > 0) {
          if (item.to[0] !== null) {
            isConflict = true;
            data.push(`${toMark} ${toName}`);
            data.push(...item.to.filter(n => n));
            data.push(sepalate);
            data.push(...item.from.filter(n => n));
            data.push(`${fromMark} ${fromName}`);
          } else {
            data.push(...item.from);
          }
        } else {
          data.push(...item.to);
        }
      });

      callback({ conflict: isConflict, data });
    });
  }

  /*
    Choose constructor depending on
    object type found in header.
  */
  _objectHash(data, fmt, write) {
    let obj;

    switch (fmt) {
      case 'blob':
        obj = new SitBlob(this, data);
        break;
      case 'commit':
        obj = new SitCommit(this, data);
        break;
      default:
        throw new Error(`Unknown type ${fmt}!`);
    }

    return this._objectWrite(obj, write);
  }

  /*
  * ***********************************************************************************
  * GAS scripts cannot use null-terminated strings(\0). I can't help but escape and use
  * ***********************************************************************************
  */
  _objectWrite(obj, write) {
    const data = obj.serialize();
    const header = `${obj.fmt} ${Buffer.byteLength(data)}\\0`;
    const store = header + data;
    const shasum = crypto.createHash('sha1');

    shasum.update(store);
    const sha = shasum.digest('hex');

    if (write) {
      const fullPath = this.__repoFile(write, 'objects', sha.slice(0, 2), sha.slice(2));
      writeSyncFile(fullPath, fileDeflateSync(store));
    }

    return sha;
  }

  /*
    Read object object_id from Git repository repo.
    Return a SitObject whose exact type depends.
  */
  _objectRead(sha) {
    // TODO:
    // Add SHA1 validation
    const path = this.__repoFile(false, 'objects', sha.slice(0, 2), sha.slice(2));
    let err = null;
    let obj = null;

    if (!isExistFile(path)) {
      err = new Error(`Do not exists path: ${path}`);
      return { err, obj };
    }

    const binary = fileUnzipSync(path, false);

    // Read object type
    const x = binary.indexOf(' ');
    const fmt = binary.slice(0, x);

    // Read and validate object size
    /*
    * ***********************************************************************************
    * GAS scripts cannot use null-terminated strings(\0). I can't help but escape and use
    * ***********************************************************************************
    */
    const y = binary.indexOf('\\0', x);
    const size = parseInt(binary.slice(x, y), 10);
    const data = binary.slice(y + 2);

    if (size !== (binary.length - y - 2)) {
      err = new Error(`Malformed object ${sha}: bad length.`);
      return { err, obj };
    }

    // Pick constructor
    let klass;
    switch (fmt.toString()) {
      case 'blob':
        klass = SitBlob;
        break;
      case 'commit':
        klass = SitCommit;
        break;
      default:
        err = new Error(`Unknown type ${fmt}`);
    }

    obj = new klass(this, data, size);

    return { err, obj };
  }

  _objectFind(name, follow = true) {
    return new Promise((resolve, reject) => {
      this._objectResolve(name).then(shaArr => {
        if (!shaArr) {
          reject(new Error(`No such reference ${name}.`));
        }

        if (shaArr.length > 1) {
          reject(new Error(`Ambigous reference ${name}: Cndidates are:\n${shaArr.reduce((acc, item) => {
            acc += `- ${item}\n`;
            return acc;
          }, '').trim()}`));
        }

        const sha = shaArr[0];

        if (follow) {
          resolve(sha);
        } else {
          resolve(null);
        }
      }).catch(err => {
        reject(err);
      });
    });
  }

  /*
    Resolve name to an object hxhash in repo.

    This function is aware of:

    - the HEAD literal
    - short and long hashes
    - branches
    - remote branches
  */
  _objectResolve(name) {
    const hashRE = new RegExp('^[0-9A-Fa-f]{1,40}$');
    const smallHashRE = new RegExp('^[0-9A-Fa-f]{1,7}');
    const fullHeadRefPath = this._getPath(`refs/heads/${name}`);
    const fullRemoteRefPath = this._getPath(`refs/remotes/${name}`);

    return new Promise((resolve, reject) => {
      if (!name) {
        resolve(null);
      }

      if (name === 'HEAD') {
        resolve([this._refResolve('HEAD')]);
      } else if (name === 'ORIG_HEAD') {
        resolve([this._refResolve('ORIG_HEAD')]);
      } else if (name === 'REMOTE_HEAD') {
        resolve([this._refResolve('REMOTE_HEAD')]);
      } else if (name === 'FETCH_HEAD') {
        resolve([this._refResolve('FETCH_HEAD')]);
      } else if (name === 'MERGE_HEAD') {
        resolve([this._refResolve('MERGE_HEAD')]);
      }

      if (name.match(hashRE)) {
        if (name.length === 40) {
          resolve([name.toLowerCase()]);
        } else if (name.match(smallHashRE)) {
          // This is a small hash 4 seems to be the minimal length
          // for sit to consider something a short hash.
          // THis limit is documented in man sit-rev-parse
          name = name.toLowerCase();
          const prefix = name.slice(0, 2);
          const fullPath = this.__findOrCreateDir(false, 'objects', prefix);

          if (isExistFile(fullPath)) {
            const rem = name.slice(2);

            recursive(fullPath).then(files => {
              const candidates = files.map(file => {
                const fileName = fileBasename(file);

                if (fileName.startsWith(rem)) {
                  return prefix + fileName;
                }
              }).filter(v => v);

              if (candidates.length > 0) {
                resolve(candidates);
              } else {
                reject(new Error(`error: pathspec '${name}' did not match any file(s) known to sit`));
              }
            }).catch(err => {
              reject(err);
            });
          } else {
            reject(new Error(`error: pathspec '${name}' did not match any file(s) known to sit`));
          }
        } else {
          reject(new Error(`error: pathspec '${name}' did not match any file(s) known to sit`));
        }
      } else if (isExistFile(fullHeadRefPath)) {
        resolve([this._refResolve(`refs/heads/${name}`)]);
      } else if (isExistFile(fullRemoteRefPath)) {
        resolve([this._refResolve(`refs/remotes/${name}`)]);
      } else {
        reject(new Error(`error: pathspec '${name}' did not match any file(s) known to sit`));
      }
    });
  }

  /* eslint-disable prefer-const */
  _refResolve(ref) {
    const fullRefPath = this.__repoFile(false, ref);

    if (isExistFile(fullRefPath)) {
      let { err, data } = fileSafeLoad(fullRefPath, false);
      if (err) die(err.message);
      data = data.trim();

      if (data.startsWith('ref: ')) {
        return this._refResolve(data.slice(5));
      } else if (ref === 'FETCH_HEAD') {
        return data.split('\t')[0];
      } else {
        return data;
      }
    } else {
      return this._INITIAL_HASH();
    }
  }
  /* eslint-enable prefer-const */

  _refStash(stashKey, next = false) {
    const parser = new SitLogParser(this, this.currentBranch(), 'logs/refs/stash');
    const index = parser.parseForIndex('stash');
    let stashCommitHash;

    if (next && Object.keys(index).length > 1) {
      stashCommitHash = index[this._nextKey(stashKey)].aftersha;
    } else {
      const data = index[stashKey];
      if (data) {
        stashCommitHash = index[stashKey].aftersha;
      } else {
        die(`${stashKey} is not a valid reference`);
      }
    }

    return stashCommitHash;
  }

  _nextKey(key) {
    const atIndex = key.indexOf('@');
    const type = key.slice(0, atIndex);
    const num = parseInt(key.slice(atIndex + 2, atIndex + 3), 10);
    return `${type}@{${num + 1}}`;
  }

  /* eslint-disable prefer-const */
  _branchResolve(name) {
    if (name === 'HEAD') {
      const fullRefPath = this.__repoFile(false, name);
      let { err, data } = fileSafeLoad(fullRefPath, false);
      if (err) die(err.message);
      data = data.trim();

      if (data.startsWith('ref: ')) {
        return data.slice(5).split('/').slice(-1)[0];
      } else {
        return 'master';
      }
    } else {
      const localBranchRefRE = new RegExp('^refs\/heads\/.+$');
      const remoteBranchRefRE = new RegExp('^refs\/remotes\/.+\/.+$');

      if (name.match(localBranchRefRE)) {
        return name.split('/').slice(-1)[0];
      } else if (name.match(remoteBranchRefRE)) {
        return name.split('/').slice(2).join('/');
      } else {
        return null;
      }
    }
  }
  /* eslint-enable prefer-const */

  // private
  __createtwoWayMergeData(toData, fromData, callback) {
    const result = {};
    let index = 0;
    while ((toData.length !== 0) || (fromData.length !== 0)) {
      const toLine = toData.shift() || null;
      const fromLine = fromData.shift() || null;

      if (isEqual(toLine, fromLine)) {
        result[index] = { conflict: false, to: toLine, from: fromLine };
      } else {
        result[index] = { conflict: true, to: toLine, from: fromLine };
      }

      if ((toData.length === 0) && (fromData.length === 0)) {
        callback(result);
      }

      index++;
    }
  }

  /*
    For example, __repoFile(true, "refs", "remotes", "origin", "HEAD") will create
    .sit/refs/remotes/origin.
  */
  __repoFile(mkdir = false, ...path) {
    if (this.__findOrCreateDir(mkdir, ...path.slice(0, -1))) {
      return this._getPath(...path);
    }
  }

  __findOrCreateDir(mkdir = false, ...path) {
    path = this._getPath(...path);

    if (isExistFile(path)) {
      if (isDir(path)) {
        return path;
      } else {
        throw new Error(`Not a direcotry ${path}`);
      }
    }

    if (mkdir) {
      mkdirSyncRecursive(path);
      return path;
    } else {
      return null;
    }
  }

  _getPath(...path) {
    return `${this.localRepo}/${path.join('/')}`;
  }
}

module.exports = SitBaseRepo;
