/* eslint-disable  camelcase, import/no-unresolved */

'use strict';

const SitRepo = require('@main/SitRepo');
const SitCommit = require('../SitCommit');

const {
  colorize,
} = require('@utils/string');

describe('SitCommit', () => {
  const data = Buffer.from(`\
blob aaa1770a0f8d8ddad8c81e009c6190baf7ed3926
parent e537175bbdf4cfeaf5e3f3c757e29ebb443b28aa
author yukihirop <te108186@gmail.com> 1578060335 +0900
committer yukihirop <te108186@gmail.com> 1578384538 +0900

Create local repository: .trs`, 'utf8');
  const repo = new SitRepo();
  const model = new SitCommit(repo, data, 238);

  describe('serialize', () => {
    it('shoult return correctly', () => {
      expect(model.serialize()).toEqual(`\
blob aaa1770a0f8d8ddad8c81e009c6190baf7ed3926
parent e537175bbdf4cfeaf5e3f3c757e29ebb443b28aa
author yukihirop <te108186@gmail.com> 1578060335 +0900
committer yukihirop <te108186@gmail.com> 1578384538 +0900

Create local repository: .trs`);
    });
  });

  describe('#desirialize', () => {
    it('should return correctly', () => {
      model.deserialize(data);
      expect(model.kvlm).not.toBeNull();
    });
  });

  describe('#blobHash', () => {
    it('should return correctly', () => {
      expect(model.blobHash()).toEqual('aaa1770a0f8d8ddad8c81e009c6190baf7ed3926');
    });
  });

  describe('#createCommitLog', () => {
    describe('when do not specify oneline option', () => {
      it('should return correctly', () => {
        expect(model.createCommitLog('4e2b7c47eb492ab07c5d176dccff3009c1ebc79b', {
          blob: '4e2b7c47eb492ab07c5d176dccff3009c1ebc79b',
          parent: '8b58f3891ae3e4d274972a39d27fd460aaeaa6cc',
          author: 'yukihirop <te108186@gmail.com> 1582125758897 +0900',
          committer: 'GoogleSpreadSheet <noreply@googlespreadsheet.com> 1582125758897 +0900',
          '': 'Merge from GoogleSpreadSheet/master',
        })).toEqual(`\
${colorize('commit 4e2b7c47eb492ab07c5d176dccff3009c1ebc79b', 'info')} (HEAD -> master)\n\
Author: yukihirop <te108186@gmail.com>\n\
Date: Thu Feb 4 00:22:38 2020 +0900 +0900\n\

\tMerge from GoogleSpreadSheet/master
`);
      });
    });

    describe('when specify oneline option', () => {
      it('should return correctly', () => {
        expect(model.createCommitLog('4e2b7c47eb492ab07c5d176dccff3009c1ebc79b', {
          blob: '4e2b7c47eb492ab07c5d176dccff3009c1ebc79b',
          parent: '8b58f3891ae3e4d274972a39d27fd460aaeaa6cc',
          author: 'yukihirop <te108186@gmail.com> 1582125758897 +0900',
          committer: 'GoogleSpreadSheet <noreply@googlespreadsheet.com> 1582125758897 +0900',
          '': 'Merge from GoogleSpreadSheet/master',
        }, { oneline: true })).toEqual(`\
${colorize('4e2b7c4', 'info')} (HEAD -> master) Merge from GoogleSpreadSheet/master`);
      });
      });
  });
});
