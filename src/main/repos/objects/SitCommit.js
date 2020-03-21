'use strict';

const {
  bufferReplace,
} = require('../../utils/file');

const {
  colorize,
} = require('../../utils/string');


const moment = require('moment');

const SitObject = require('./SitObject');

class SitCommit extends SitObject {
  constructor(repo, data, size) {
    super(repo, data, size);

    this.fmt = 'commit';
  }

  serialize() {
    return this._kvlmSerialize(this.kvlm);
  }

  deserialize(data) {
    this.kvlm = this._kvlmParse(data);
  }

  blobHash() {
    const bufData = JSON.parse(JSON.stringify(this.kvlm['blob']))['data'];
    return Buffer.from(bufData, 'utf8').toString();
  }

  createCommitLog(commitHash, commitData, opts = {}) {
    let result = '';
    let logBaseTitle;
    const { oneline } = opts;
    const [author, email, unixtime, timezone] = commitData['author'].split(' ');
    const commitMsg = commitData[''];
    const currentBranch = this.repo._branchResolve('HEAD');
    const isHEAD = this.repo._refResolve('HEAD') === commitHash;

    if (oneline) {
      logBaseTitle = colorize(commitHash.slice(0,7), 'info');
    } else {
      logBaseTitle = colorize(`commit ${commitHash}`, 'info');
    }

    if (isHEAD) {
      result += logBaseTitle + ' ' + `(HEAD -> ${currentBranch})`;
    } else {
      result += logBaseTitle;
    }

    if (oneline) {
      result += ' ' + commitMsg;
    } else {
      result += '\n';
      result += `Author: ${author} ${email}\n`;
      result += `Date: ${moment(parseInt(unixtime)).format('ddd MMM d HH:mm:ss GGGG ZZ')} ${timezone}\n`;
      result += '\n';
      result += `\t${commitMsg}\n`;
    }

    return result;
  }

  humanizeKVLM() {
    return Object.keys(this.kvlm).reduce((acc, key) => {
      acc[key] = this.kvlm[key].toString();
      return acc;
    }, {});
  }

  // private

  // kvlm means key value line messaage
  _kvlmSerialize(kvlm) {
    let val;
    let result = '';
    const space = ' ';

    Object.keys(kvlm).forEach(k => {
      // Skip the message itself
      if (k === '') return;

      // Normalize to a list
      val = kvlm[k];
      if (typeof (val) !== 'Array') val = [val];

      result += val.reduce((acc, v) => {
        return acc + k + space + (bufferReplace(v, '\n', '\n ')) + '\n';
      }, '');
    });

    // Append message
    result += '\n' + kvlm[''];
    return result.trim();
  }

  _kvlmParse(binary, start = 0, dct = null) {
    if (!dct) dct = {};

    // We search for the next space and the next newline.
    const spc = binary.indexOf(' ', start);
    const nl = binary.indexOf('\n', start);

    // In space appears before newline. we have a keyword

    // Base case
    // =========
    // If newline appears first (or there's no space at all. in which)
    // case find returns -1). we assume a blank line. A blank line
    // means the remainder of the data is the message.
    if (spc < 0 || nl < spc) {
      if (nl === start) {
        // throw new Error('newline index must be equal start index')
        dct[''] = binary.slice(start + 1);
        return dct;
      }
    }

    // Recursive case
    // ==============
    // we read a key-value pair and recurse for the next.
    const key = binary.slice(start, spc);

    // Find the end of the value. Continuation lines begin with a
    // space, so we loop until we find a "\n" not followed by a space.
    let end = start;
    while (true) {
      end = binary.indexOf('\n', end + 1);
      if (binary[end + 1] !== ' '.charCodeAt(0)) break;
    }

    // Grab the value
    // Also, drop the leading space on continuation lines
    const value = bufferReplace(binary.slice(spc + 1, end), '\n ', '\n');

    // Don't overwrite existing data contenets
    if (Object.keys(dct).indexOf(key) !== -1) {
      if (typeof (dct[key]) === 'Array') {
        dct[key].push(value);
      } else {
        dct[key] = [dct[key], value];
      }
    } else {
      dct[key] = value;
    }

    return this._kvlmParse(binary, end + 1, dct);
  }
}

module.exports = SitCommit;

