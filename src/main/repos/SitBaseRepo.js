'use strict';

const {
  isExistFile,
  isDir,
  yamlSafeLoad,
  mkdirSyncRecursive,
  fileSafeLoad,
  fileUnzip,
  fileBasename
} = require('../utils/file');

const recursive = require('recursive-readdir');

const SitBlob = require('./SitBlob');
const SitTree = require('./SitTree');

class SitBaseRepo {
  constructor(opts) {
    this.settingPath = opts.settingPath
    this.localRepo = this._createLocalRepo(this.settingPath)
  }

  /*
    Read object object_id from Git repository repo.
    Return a SitObject whose exact type depends.
  */
  _objectRead(sha) {
    let path = this._readFile(false, "objects", sha.slice(0, 2), sha.slice(2));

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

    return new Promise((resolve, reject) => {
      if (!name) {
        resolve(null)
      }

      if (name == "HEAD") {
        resolve([_refResolve("HEAD")])
      }

      if (name.match(hashRE)) {
        if (name.length == 40) {
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

              resolve(candidates);
            });
          }
        }
      }
    });
  }

  _createLocalRepo(path) {
    const yamlData = yamlSafeLoad(path);
    return yamlData["repo"]["local"];
  }

  _refResolve(ref) {
    let data = fileSafeLoad(this._readFile(false, ref));
    data = data.trim();

    if (data.startsWith("ref: ")) {
      return this._refResolve(data.slice(5))
    } else {
      return data
    }
  }

  /*
    For example, _readFile(true, "refs", "remotes", "origin", "HEAD") will create
    .sit/refs/remotes/origin.
  */
  _readFile(mkdir = false, ...path) {
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
