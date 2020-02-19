'use strict'

const SitCommit = require('../SitCommit')

describe('SitCommit', () => {
  const data = Buffer.from(`\
blob aaa1770a0f8d8ddad8c81e009c6190baf7ed3926
parent e537175bbdf4cfeaf5e3f3c757e29ebb443b28aa
author yukihirop <te108186@gmail.com> 1578060335 +0900
committer yukihirop <te108186@gmail.com> 1578384538 +0900

Create local repository: .trs`, 'utf8')
  const model = new SitCommit(null, data, 238)

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
})
