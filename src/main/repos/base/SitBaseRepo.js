'use strict';

const {
  isExistFile,
  isDir,
  writeSyncFile,
  mkdirSyncRecursive,
  fileSafeLoad,
  fileUnzip,
  fileDeflate,
  fileBasename,
  appendFile,
  deleteSyncFile,
  iniParse
} = require('../../utils/file');

const SitSetting = require('../../SitSetting')
  , SitConfig = require('../SitConfig');

const recursive = require('recursive-readdir')
  , moment = require('moment')
  , crypto = require('crypto');

const SitBlob = require('../objects/SitBlob');
const SitTree = require('../objects/SitTree');

const INITIAL_HASH = '0000000000000000000000000000000000000000';

class SitBaseRepo {
  constructor(opts) {
    this.distFilePath = `${SitSetting.dist.path}/${SitSetting.dist.sheetName}`;
    this.localRepo = SitSetting.repo.local;
  }

  _initialHash() {
    return INITIAL_HASH;
  }

  _HEAD() {
    let data = fileSafeLoad(this._repoFile(false, 'HEAD'));
    data = data.trim();

    if (data.startsWith("ref: ")) {
      return data.slice(5)
    } else {
      throw new Error(`Invalid format HEAD`)
    }
  }

  _isExistFile(path) {
    return isExistFile(`${this.localRepo}/${path}`);
  }

  _writeLog(path, beforeHash, afterHash, message, mkdir = true) {
    const space = ' ';
    const data = `${beforeHash || INITIAL_HASH}${space}${afterHash}${space}${moment().format('x')}${space}${moment().format('ZZ')}\t${message}\r\n`;

    if (mkdir) {
      const fullDirPath = this.localRepo + '/' + path.split('/').slice(0, -1).join('/');

      if (!isExistFile(fullDirPath)) {
        mkdirSyncRecursive(fullDirPath);
      }
    }

    appendFile(`${this.localRepo}/${path}`, data);
  }

  _writeSyncFile(path, data, mkdir = true) {
    if (mkdir) {
      const fullDirPath = this.localRepo + '/' + path.split('/').slice(0, -1).join('/');

      if (!isExistFile(fullDirPath)) {
        mkdirSyncRecursive(fullDirPath);
      }
    }

    writeSyncFile(`${this.localRepo}/${path}`, data);
  }

  _iniParse(path) {
    return iniParse(`${this.localRepo}/${path}`);
  }

  _deleteSyncFile(path) {
    return deleteSyncFile(`${this.localRepo}/${path}`);
  }

  _twoWayMerge(toData, fromData, toName, fromName, callback) {
    const toMark = '<<<<<<<';
    const sepalate = '=======';
    const fromMark = '>>>>>>>';

    this._createtwoWayMergeData(toData, fromData, result => {
      let arr = [];
      let currentItemIndex = 0;
      let currentConflict = false;
      const initialItem = { startIndex: 0, length: 0, to: [], from: [] };

      Object.keys(result).forEach((key, index) => {
        let line = result[key];
        let item = arr[currentItemIndex] || JSON.parse(JSON.stringify(initialItem));

        if (line.conflict) {
          item.startIndex = currentItemIndex;
          item.length++;
          item.to.push(line.to);
          item.from.push(line.from);
          arr[currentItemIndex] = item;
          currentConflict = true
        } else {
          if (currentConflict) {
            currentItemIndex++;
            item = arr[currentItemIndex] || JSON.parse(JSON.stringify(initialItem))
            item.startIndex = index;
            item.to.push(line.to);
            item.from.push(line.from);
            arr[currentItemIndex] = item;
            currentConflict = false
          } else {
            item.startIndex = index;
            item.to.push(line.to);
            item.from.push(line.from);
            arr[currentItemIndex] = item;
            currentItemIndex++;
          }
        }
      });

      let data = [];
      let isConflict = false;
      arr.forEach(item => {
        // conflict
        if (item.length > 0) {
          isConflict = true;
          data.push(`${toMark} ${toName}`);
          data.push(...item.to.filter(n => n));
          data.push(sepalate);
          data.push(...item.from.filter(n => n));
          data.push(`${fromMark} ${fromName}`);
        } else {
          data.push(...item.to);
        }
      });

      callback({ conflict: isConflict, data: data });
    });
  }

  _createtwoWayMergeData(toData, fromData, callback) {
    let result = {};
    let index = 0;
    while ((toData.length !== 0) || (fromData.length !== 0)) {
      let toLine = toData.shift() || null;
      let fromLine = fromData.shift() || null;


      if (toLine === fromLine) {
        result[index] = { conflict: false, to: toLine, from: fromLine };
      } else {
        result[index] = { conflict: true, to: toLine, from: fromLine };
      }

      if ((toData.length === 0) && (fromData.length === 0)) {
        callback(result);
      }

      index++
    }
  }

  /*
    Choose constructor depending on
    object type found in header.
  */
  _objectHash(data, fmt, write) {
    let obj;

    switch (fmt) {
      case 'tree':
        obj = new SitTree(this, data);
        break;
      case 'blob':
        obj = new SitBlob(this, data);
        break;
      default:
        throw new Error(`Unknown type ${fmt}!`)
    }

    return this._objectWrite(obj, write);
  }

  _objectWrite(obj, write) {
    const data = obj.serialize();
    const header = `${obj.fmt} ${Buffer.byteLength(data)}\0`;
    const store = header + data;
    const shasum = crypto.createHash('sha1');

    shasum.update(store);
    const sha = shasum.digest('hex');

    if (write) {
      const fullPath = this._repoFile(write, "objects", sha.slice(0, 2), sha.slice(2));
      fileDeflate(store, (err, buffer) => {
        if (err) throw err;
        writeSyncFile(fullPath, buffer);
      });
    }

    return sha;
  }

  /*
    Read object object_id from Git repository repo.
    Return a SitObject whose exact type depends.
  */
  _objectRead(sha) {
    let path = this._repoFile(false, "objects", sha.slice(0, 2), sha.slice(2));

    return new Promise((resolve, reject) => {
      fileUnzip(path, false, (err, binary) => {
        if (err) reject(err);

        // Read object type
        const x = binary.indexOf(' ');
        const fmt = binary.slice(0, x);

        // Read and validate object size
        const y = binary.indexOf('\0', x);
        const size = parseInt(binary.slice(x, y));
        const data = binary.slice(y + 1);

        if (size != (binary.length - y - 1)) {
          const err = new Error(`Malformed object ${sha}: bad length.`)
          reject(err);
        }

        // Pick constructor
        let klass;
        switch (fmt.toString()) {
          case 'tree':
            klass = SitTree;
            break;
          case 'blob':
            klass = SitBlob;
            break;
          default:
            const err = new Error(`Unknown type ${fmt}`);
            reject(err);
        }

        resolve(new klass(this, data, size))
      });
    })
  }

  _objectFind(name, follow = true) {
    return new Promise((resolve, reject) => {
      this._objectResolve(name).then(shaArr => {
        if (!shaArr) {
          reject(new Error(`No such reference ${name}.`));
        }

        if (shaArr.length > 1) {
          reject(new Error(`Ambigous reference ${name}: Cndidates are:\n - ${"\n-1".join(shaArr)}`));
        }

        let sha = shaArr[0];

        if (follow) {
          resolve(sha);
        } else {
          resolve(null);
        }
      }).catch(err => {
        console.error(err);
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
    const hashRE = new RegExp('^[0-9A-Fa-f]{1,40}$')
    const smallHashRE = new RegExp('^[0-9A-Fa-f]{1,7}');
    let isFound = false;

    return new Promise((resolve, reject) => {
      if (!name) {
        resolve(null)
      }

      if (name == "HEAD") {
        resolve([this._refResolve("HEAD")])
      }

      if (name.match(hashRE)) {
        if (name.length == 40) {
          isFound = true
          resolve([name.toLowerCase()])
        } else if (name.match(smallHashRE)) {
          // This is a small hash 4 seems to be the minimal length
          // for sit to consider something a short hash.
          // THis limit is documented in man sit-rev-parse
          name = name.toLowerCase();
          const prefix = name.slice(0, 2);
          const fullPath = this._findOrCreateDir(false, "objects", prefix);

          if (fullPath) {
            let rem = name.slice(2);

            recursive(fullPath, (err, files) => {
              if (err) reject(err);
              let candidates = files.map(file => {
                let fileName = fileBasename(file);

                if (fileName.startsWith(rem)) {
                  return prefix + fileName
                }
              });

              isFound = true;
              resolve(candidates);
            });
          }
        }
      }

      if (!isFound) {
        const fullRefPath = this._getPath(`refs/heads/${name}`);
        if (isExistFile(fullRefPath)) {
          resolve([this._refResolve(`refs/heads/${name}`)])
        } else {
          reject(`error: pathspec '${name}' did not match any file(s) known to sit`);
        }
      }
    });
  }

  _createRemoteRepo(repoName) {
    return SitConfig.remote[repoName].url;
  }

  _refResolveAtLocal(branch) {
    return this._refResolve(`refs/heads/${branch}`);
  }

  _refResolveAtRemote(repoName, branch) {
    return this._refResolve(`refs/remotes/${repoName}/${branch}`);
  }

  _refResolve(ref) {
    const fullRefPath = this._repoFile(false, ref);

    if (isExistFile(fullRefPath)) {
      let data = fileSafeLoad(fullRefPath, false);
      data = data.trim();

      if (data.startsWith("ref: ")) {
        return this._refResolve(data.slice(5));
      } else {
        return data;
      }
    } else {
      return INITIAL_HASH;
    }
  }

  _branchResolve(name) {
    const fullRefPath = this._repoFile(false, name);

    if (name === 'HEAD') {
      let data = fileSafeLoad(fullRefPath, false);
      data = data.trim();

      if (data.startsWith("ref: ")) {
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
        return null
      }
    }
  }

  /*
    For example, _repoFile(true, "refs", "remotes", "origin", "HEAD") will create
    .sit/refs/remotes/origin.
  */
  _repoFile(mkdir = false, ...path) {
    if (this._findOrCreateDir(mkdir, ...path.slice(0, -1))) {
      return this._getPath(...path)
    }
  }

  _findOrCreateDir(mkdir = false, ...path) {
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
      return null
    }
  }

  _getPath(...path) {
    return `${this.localRepo}/${path.join('/')}`;
  }
}

module.exports = SitBaseRepo;