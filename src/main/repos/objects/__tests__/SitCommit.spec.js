'use strict'

const SitRepo = require('@main/SitRepo')
const SitCommit = require('../SitCommit')

const {
  colorize
} = require('@utils/string');

describe('SitCommit', () => {
  const data = Buffer.from(`\
blob aaa1770a0f8d8ddad8c81e009c6190baf7ed3926
parent e537175bbdf4cfeaf5e3f3c757e29ebb443b28aa
author yukihirop <te108186@gmail.com> 1578060335 +0900
committer yukihirop <te108186@gmail.com> 1578384538 +0900

Create local repository: .trs`, 'utf8')
  const repo = new SitRepo()
  const model = new SitCommit(repo, data, 238)

  describe('serialize', () => {
    it('shoult return correctly', () => {
      expect(model.serialize()).toEqual(`\
blob aaa1770a0f8d8ddad8c81e009c6190baf7ed3926
parent e537175bbdf4cfeaf5e3f3c757e29ebb443b28aa
author yukihirop <te108186@gmail.com> 1578060335 +0900
committer yukihirop <te108186@gmail.com> 1578384538 +0900

Create local repository: .trs`)
    })
  })

  describe('#desirialize', () => {
    it('should return correctly', () => {
      model.deserialize(data)
      expect(model.kvlm).not.toBeNull()
    })
  })

  describe('#blobHash', () => {
    it('should return correctly', () => {
      expect(model.blobHash()).toEqual('aaa1770a0f8d8ddad8c81e009c6190baf7ed3926')
    })
  })

  describe('#createCommitLog', () => {
    describe('when do not specify oneline option', () => {
      it('should return correctly', () => {
        expect(model.createCommitLog('03577e30b394d4cafbbec22cc1a78b91b3e7c20b', {
          'blob': '953b3794394d6b48d8690bc5e53aa2ffe2133035',
          'parent': '0133e12ee3679cb5bd494cb50e4f5a5a896eeb14',
          'author': 'yukihirop <te108186@gmail.com> 1582125758897 +0900',
          'committer': 'GoogleSpreadSheet <noreply@googlespreadsheet.com> 1582125758897 +0900',
          '': 'Merge from GoogleSpreadSheet/master'
        })).toEqual(`\
${colorize('commit 03577e30b394d4cafbbec22cc1a78b91b3e7c20b', 'info')} (HEAD -> master)\n\
Author: yukihirop <te108186@gmail.com>\n\
Date: Thu Feb 4 00:22:38 2020 +0900 +0900\n\

\tMerge from GoogleSpreadSheet/master
`)
      })
    })

    describe('when specify oneline option', () => {
      it('should return correctly', () => {
        expect(model.createCommitLog('03577e30b394d4cafbbec22cc1a78b91b3e7c20b', {
          'blob': '953b3794394d6b48d8690bc5e53aa2ffe2133035',
          'parent': '0133e12ee3679cb5bd494cb50e4f5a5a896eeb14',
          'author': 'yukihirop <te108186@gmail.com> 1582125758897 +0900',
          'committer': 'GoogleSpreadSheet <noreply@googlespreadsheet.com> 1582125758897 +0900',
          '': 'Merge from GoogleSpreadSheet/master'
        }, { oneline: true })).toEqual(`\
${colorize('03577e3', 'info')} (HEAD -> master) Merge from GoogleSpreadSheet/master`)
      })
      })
  })
})
