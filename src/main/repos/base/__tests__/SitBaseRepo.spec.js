const SitBaseRepo = require('@repos/base/SitBaseRepo');
const SitBlob = require('@repos/objects/SitBlob');
const SitCommit = require('@repos/objects/SitCommit')
const SitLogParser = require('@repos/logs/SitLogParser');
const SitRefParser = require('@repos/refs/SitRefParser');

const mockSitLogger_write = jest.fn();
jest.mock('@repos/logs/SitLogger', () => {
  return jest.fn().mockImplementation(() => {
    return {
      write: mockSitLogger_write
    }
  })
});

// https://stackoverflow.com/questions/39755439/how-to-mock-imported-named-function-in-jest-when-module-is-unmocked
jest.mock('@utils/file', () => (
  {
    ...(jest.requireActual('@utils/file')),
    writeSyncFile: jest.fn()
  }
));

const mockMoment_format = jest.fn()
jest.mock('moment', () => {
  return jest.fn().mockImplementation(() => {
    return {
      format: mockMoment_format
    }
  })
});

// https://stackoverflow.com/questions/50421732/mocking-up-static-methods-in-jest
describe('SitBaseRepo', () => {
  const model = new SitBaseRepo();
  const oldLocalRepo = model.localRepo

  //　spyOn mock is not automatically released
  afterEach(() => {
    jest.restoreAllMocks()
    model.localRepo = oldLocalRepo
  });

  beforeEach(() => {
    model.localRepo = './test/localRepo/.sit'
  })

  describe('#repoName', () => {
    describe('when repoName exist', () => {
      it('should return correclty', () => {
        expect(model.remoteRepo('origin')).toEqual('https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=0');
      })
    })

    describe('when repoName do not exist', () => {
      it('should return correctly', () => {
        expect(model.remoteRepo('typo_origin')).toEqual(null)
      })
    })
  });

  // FIXME: mock global .sitconfig
  describe('#username', () => {
    it('should return correctly', () => {
      expect(model.username()).toEqual('yukihirop')
    })
  })

  // FIXME: mock global .sitconfig
  describe('#email', () => {
    it('should return correctly', () => {
      expect(model.email()).toEqual('te108186@gmail.com')
    })
  })

  describe('#_refBlob', () => {
    describe('when commitHash is not initial', () => {
      it('should return correctly', () => {
        const mockErr = null
        const commitData = `\
blob 5b1cf86e97c6633e9a2dd85567e33d636dd3748a
parent e537175bbdf4cfeaf5e3f3c757e29ebb443b28aa
author yukihirop <te108186@gmail.com> 1578060335 +0900
committer yukihirop <te108186@gmail.com> 1578384538 +0900

test data`
        const obj = new SitCommit(model, commitData, 238)
        const mockModel__objectRead = jest.spyOn(model, '_objectRead').mockReturnValueOnce({ mockErr, obj })
        const mockObj_blobHash = jest.spyOn(obj, 'blobHash').mockReturnValueOnce('5b1cf86e97c6633e9a2dd85567e33d636dd3748a')

        expect(model._refBlob('HEAD')).toEqual('5b1cf86e97c6633e9a2dd85567e33d636dd3748a')

        expect(mockModel__objectRead).toHaveBeenCalledTimes(1)
        expect(mockModel__objectRead.mock.calls[0]).toEqual(['03577e30b394d4cafbbec22cc1a78b91b3e7c20b'])

        expect(mockObj_blobHash).toHaveBeenCalledTimes(1)
        expect(mockObj_blobHash.mock.calls[0]).toEqual([])
      })
    })

    describe('when commitHash is ininital', () => {
      it('should return correctly', () => {
        const mockModel__refResolve = jest.spyOn(model, '_refResolve').mockReturnValueOnce(model._INITIAL_HASH())

        expect(model._refBlob('HEAD')).toEqual(model._INITIAL_HASH())

        expect(mockModel__refResolve).toHaveBeenCalledTimes(1)
        expect(mockModel__refResolve.mock.calls[0]).toEqual(['HEAD'])
      })
    })
  })

  describe('#_refBlobFromCommitHash', () => {
    describe('when commitHash is not initial', () => {
      it('should return correctly', () => {
        const mockErr = null
        const commitData = `\
blob 5b1cf86e97c6633e9a2dd85567e33d636dd3748a
parent e537175bbdf4cfeaf5e3f3c757e29ebb443b28aa
author yukihirop <te108186@gmail.com> 1578060335 +0900
committer yukihirop <te108186@gmail.com> 1578384538 +0900

test data`
        const obj = new SitCommit(model, commitData, 238)
        const mockModel__objectRead = jest.spyOn(model, '_objectRead').mockReturnValueOnce({ mockErr, obj })
        const mockObj_blobHash = jest.spyOn(obj, 'blobHash').mockReturnValueOnce('5b1cf86e97c6633e9a2dd85567e33d636dd3748a')

        expect(model._refBlobFromCommitHash('03577e30b394d4cafbbec22cc1a78b91b3e7c20b')).toEqual('5b1cf86e97c6633e9a2dd85567e33d636dd3748a')

        expect(mockModel__objectRead).toHaveBeenCalledTimes(1)
        expect(mockModel__objectRead.mock.calls[0]).toEqual([`03577e30b394d4cafbbec22cc1a78b91b3e7c20b`])

        expect(mockObj_blobHash).toHaveBeenCalledTimes(1)
        expect(mockObj_blobHash.mock.calls[0]).toEqual([])
      })
    })

    describe('when commitHash is initial', () => {
      it('should return correctly', () => {
        expect(model._refBlobFromCommitHash(model._INITIAL_HASH())).toEqual(model._INITIAL_HASH())
      })
    })
  })

  describe('#_refCSVData', () => {
    const mockSitRefParser_parseToCSV = jest.fn()

    beforeEach(() => {
      SitRefParser.prototype.parseToCSV = mockSitRefParser_parseToCSV
    })

    describe('when repoName exists', () => {
      it('should return correctly', () => {
        mockSitRefParser_parseToCSV.mockReturnValueOnce([
          ['branch', 'sha1'],
          ['master', '5b1cf86e97c6633e9a2dd85567e33d636dd3748a']
        ])

        expect(model._refCSVData('master', 'origin')).toEqual([
          ['branch', 'sha1'],
          ['master', '5b1cf86e97c6633e9a2dd85567e33d636dd3748a']
        ])
        expect(mockSitRefParser_parseToCSV).toHaveBeenCalledTimes(1)
        expect(mockSitRefParser_parseToCSV.mock.calls[0]).toEqual([])
      })
    })

    describe('when repoName do not exists', () => {
      it('should return correctly', () => {
        mockSitRefParser_parseToCSV.mockReturnValueOnce([
          ['branch', 'sha1'],
          ['master', '953b3794394d6b48d8690bc5e53aa2ffe2133035']
        ])

        expect(model._refCSVData('master')).toEqual([
          ['branch', 'sha1'],
          ['master', '953b3794394d6b48d8690bc5e53aa2ffe2133035']
        ])
        expect(mockSitRefParser_parseToCSV).toHaveBeenCalledTimes(1)
        expect(mockSitRefParser_parseToCSV.mock.calls[0]).toEqual([])
      })
    })
  });

  describe('#_refLastLogCSVData', () => {
    const mockSitLogParser_parseToCSV = jest.fn()

    beforeEach(() => {
      SitLogParser.prototype.parseToCSV = mockSitLogParser_parseToCSV
    })

    describe('when repoName exists', () => {
      it('should return correctly', () => {
        mockSitLogParser_parseToCSV.mockReturnValueOnce([
          ["branch", "beforesha", "aftersha", "username", "email", "unixtime", "timezone", "message"],
          ["master", "0000000000000000000000000000000000000000", "953b3794394d6b48d8690bc5e53aa2ffe2133035", "yukihirop", "<te108186@gmail.com>", "1580961933681", "+0900", "update by push"]
        ])

        expect(model._refLastLogCSVData('master', 'origin')).toEqual([
          ["branch", "beforesha", "aftersha", "username", "email", "unixtime", "timezone", "message"],
          ["master", "0000000000000000000000000000000000000000", "953b3794394d6b48d8690bc5e53aa2ffe2133035", "yukihirop", "<te108186@gmail.com>", "1580961933681", "+0900", "update by push"]
        ])

        expect(mockSitLogParser_parseToCSV).toHaveBeenCalledTimes(1)
        expect(mockSitLogParser_parseToCSV.mock.calls[0]).toEqual([])
      })
    })

    describe('when repoName do not exists', () => {
      it('should return correctly', () => {
        mockSitLogParser_parseToCSV.mockReturnValueOnce([
          ["branch", "beforesha", "aftersha", "username", "email", "unixtime", "timezone", "message"],
          ["master", "0000000000000000000000000000000000000000", "953b3794394d6b48d8690bc5e53aa2ffe2133035", "yukihirop", "<te108186@gmail.com>", "1580961933681", "+0900", "clone: from https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=0"]
        ])

        expect(model._refLastLogCSVData('master')).toEqual([
          ["branch", "beforesha", "aftersha", "username", "email", "unixtime", "timezone", "message"],
          ["master", "0000000000000000000000000000000000000000", "953b3794394d6b48d8690bc5e53aa2ffe2133035", "yukihirop", "<te108186@gmail.com>", "1580961933681", "+0900", "clone: from https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=0"]
        ])

        expect(mockSitLogParser_parseToCSV).toHaveBeenCalledTimes(1)
        expect(mockSitLogParser_parseToCSV.mock.calls[0]).toEqual([])
      })
    })
  });

  describe('#_HEAD', () => {
    it('should return correctly', () => {
      expect(model._HEAD()).toEqual('refs/heads/master')
    })
  })

  describe('#_isExistFile', () => {
    describe('when file do not exist', () => {
      it('should return correctly', () => {
        expect(model._isExistFile("hoge")).toEqual(false)
      })
    })

    describe('when file exist', () => {
      it('should return correctly', () => {
        expect(model._isExistFile("config")).toEqual(true)
      })
    })
  })

  describe('#_writeLog', () => {
    it('should return correctly', () => {
      expect(model._writeLog(
        'refs/heads/master',
        '953b3794394d6b48d8690bc5e53aa2ffe2133035',
        '5b1cf86e97c6633e9a2dd85567e33d636dd3748a',
        'fetch origin master: fast-forward'
      )).toEqual(model)
      expect(mockSitLogger_write).toHaveBeenCalled()
    })
  })

  describe('#_iniParse', () => {
    it('should return correctly', () => {
      expect(model._iniParse('config')).toEqual({
        "branch": {
          "master": {
            "merge": "refs/heads/master", "remote": "origin"
          }
        },
        "remote": {
          "origin": {
            "fetch": "+refs/heads/*:refs/remotes/origin/*", "type": "GoogleSpreadSheet", "url": "https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=0"
          }
        }
      })
    })
  })

  describe('#_createCommitMessage', () => {
    const blobHash = '953b3794394d6b48d8690bc5e53aa2ffe2133035';
    const parentHash = '03577e30b394d4cafbbec22cc1a78b91b3e7c20b'
    const message = 'Update test data';
    mockMoment_format.mockReturnValueOnce('1582125758897')
      .mockReturnValueOnce('+0900')

    it('should return correctly', () => {
      expect(model._createCommitMessage(blobHash, parentHash, message)).toEqual(`\
blob 953b3794394d6b48d8690bc5e53aa2ffe2133035
parent 03577e30b394d4cafbbec22cc1a78b91b3e7c20b
author yukihirop <te108186@gmail.com> 1582125758897 +0900
committer yukihirop <te108186@gmail.com> 1582125758897 +0900

Update test data`)
    })
  })

  describe('#_createCommit', () => {
    const blobHash = '953b3794394d6b48d8690bc5e53aa2ffe2133035';
    const parentHash = '03577e30b394d4cafbbec22cc1a78b91b3e7c20b'
    const message = 'Update test data';
    const mockCommitMsg = `\
blob 953b3794394d6b48d8690bc5e53aa2ffe2133035
parent 03577e30b394d4cafbbec22cc1a78b91b3e7c20b
author yukihirop <te108186@gmail.com> 1582125758897 +0900
committer yukihirop <te108186@gmail.com> 1582125758897 +0900

Update test data`

    it('should return correctly', () => {
      const mockModel__createCommitMessage = jest.spyOn(model, '_createCommitMessage').mockReturnValueOnce(mockCommitMsg)
      const mockModel__objectHash = jest.spyOn(model, '_objectHash').mockReturnValueOnce('2fbb75b48757eea03a71c3dc522249599a5642de')

      expect(model._createCommit(blobHash, parentHash, message)).toEqual(`2fbb75b48757eea03a71c3dc522249599a5642de`)

      expect(mockModel__createCommitMessage).toHaveBeenCalledTimes(1)
      expect(mockModel__createCommitMessage.mock.calls[0]).toEqual(["953b3794394d6b48d8690bc5e53aa2ffe2133035", "03577e30b394d4cafbbec22cc1a78b91b3e7c20b", "Update test data"])

      expect(mockModel__objectHash).toHaveBeenCalledTimes(1)
      expect(mockModel__objectHash.mock.calls[0][0]).toEqual(`\
blob 953b3794394d6b48d8690bc5e53aa2ffe2133035
parent 03577e30b394d4cafbbec22cc1a78b91b3e7c20b
author yukihirop <te108186@gmail.com> 1582125758897 +0900
committer yukihirop <te108186@gmail.com> 1582125758897 +0900

Update test data`)
      expect(mockModel__objectHash.mock.calls[0][1]).toEqual('commit')
      expect(mockModel__objectHash.mock.calls[0][2]).toEqual(true)
    })
  })

  describe('#_createMergeCommitMessage', () => {
    const blobHash = '953b3794394d6b48d8690bc5e53aa2ffe2133035';
    const parentHash = '03577e30b394d4cafbbec22cc1a78b91b3e7c20b'
    const branch = 'master';
    const type = 'GoogleSpreadSheet';
    mockMoment_format.mockReturnValueOnce('1582125758897')
      .mockReturnValueOnce('+0900')

    it('should return correctly', () => {
      expect(model._createMergeCommitMessage(blobHash, parentHash, branch, type)).toEqual(`\
blob 953b3794394d6b48d8690bc5e53aa2ffe2133035
parent 03577e30b394d4cafbbec22cc1a78b91b3e7c20b
author yukihirop <te108186@gmail.com> 1582125758897 +0900
committer GoogleSpreadSheet <noreply@googlespreadsheet.com> 1582125758897 +0900

Merge from GoogleSpreadSheet/master`)
    })
  })

  describe('#_createMergeCommit', () => {
    const blobHash = '953b3794394d6b48d8690bc5e53aa2ffe2133035';
    const parentHash = '03577e30b394d4cafbbec22cc1a78b91b3e7c20b'
    const branch = 'master';
    const type = 'GoogleSpreadSheet';
    const mockCommitMsg = `\
blob 953b3794394d6b48d8690bc5e53aa2ffe2133035
parent 03577e30b394d4cafbbec22cc1a78b91b3e7c20b
author yukihirop <te108186@gmail.com> 1582125758897 +0900
committer GoogleSpreadSheet <noreply@googlespreadsheet.com> 1582125758897 +0900

Merge from GoogleSpreadSheet/master`

    it('should return corrctly', () => {
      const mockModel__createMergeCommitMessage = jest.spyOn(model, '_createMergeCommitMessage').mockReturnValueOnce(mockCommitMsg)
      const mockModel__objectHash = jest.spyOn(model, '_objectHash').mockReturnValueOnce('03577e30b394d4cafbbec22cc1a78b91b3e7c20b')

      expect(model._createMergeCommit(blobHash, parentHash, branch, type)).toEqual('03577e30b394d4cafbbec22cc1a78b91b3e7c20b')

      expect(mockModel__createMergeCommitMessage).toHaveBeenCalledTimes(1)
      expect(mockModel__createMergeCommitMessage.mock.calls[0]).toEqual(["953b3794394d6b48d8690bc5e53aa2ffe2133035", "03577e30b394d4cafbbec22cc1a78b91b3e7c20b", "master", "GoogleSpreadSheet"])

      expect(mockModel__objectHash).toHaveBeenCalledTimes(1)
      expect(mockModel__objectHash.mock.calls[0][0]).toEqual(`\
blob 953b3794394d6b48d8690bc5e53aa2ffe2133035
parent 03577e30b394d4cafbbec22cc1a78b91b3e7c20b
author yukihirop <te108186@gmail.com> 1582125758897 +0900
committer GoogleSpreadSheet <noreply@googlespreadsheet.com> 1582125758897 +0900

Merge from GoogleSpreadSheet/master`)
      expect(mockModel__objectHash.mock.calls[0][1]).toEqual('commit')
      expect(mockModel__objectHash.mock.calls[0][2]).toEqual(true)
    })
  })

  describe('#_twoWayMerge', () => {
    const toData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const fromData = [1, 2, 2, 2, 3, 4, 7, 8, 9, 10]
    const toName = 'HEAD';
    const fromName = 'origin/master'
    it('should return correctly', (done) => {
      model._twoWayMerge(toData, fromData, toName, fromName, (result) => {
        const { conflict, data } = result;
        expect(conflict).toEqual(true);
        expect(data).toEqual([
          1,
          2,
          "<<<<<<< HEAD",
          3,
          4,
          5,
          6,
          "=======",
          2,
          2,
          3,
          4,
          ">>>>>>> origin/master",
          7,
          8,
          9,
          10
        ])
        done();
      })
    })
  })

  describe('#_objectHash', () => {
    describe('when blob', () => {
      it('should return correctly', () => {
        const mockSHA1 = '953b3794394d6b48d8690bc5e53aa2ffe2133035'
        const mockModel__objectwrite = jest.spyOn(model, '_objectWrite').mockReturnValueOnce(mockSHA1)
        expect(model._objectHash('1,2,3\n4,5,6', 'blob', false)).toEqual(mockSHA1)
        expect(mockModel__objectwrite).toHaveBeenCalled()
      })
    })
  })

  describe('#_objectWrite', () => {
    let obj = new SitBlob(model, "日本語,英語,キー\nこんにちは,hello,greeting.hello", 60);

    describe('when do not write file', () => {
      it('should return correctly', () => {
        expect(model._objectWrite(obj, false)).toEqual('b0122f0795b0be80d51a7ff6946f00bf0300e723')
      })
    })

    describe('when write file', () => {
      it('should return correctly', () => {
        const result = model._objectWrite(obj, true)
        expect(result).toEqual('b0122f0795b0be80d51a7ff6946f00bf0300e723')
      })
    })
  })

  describe('#_objectRead', () => {
    describe('when sha exists', () => {
      const sha1 = 'b18c9566daeb03818f64109ffcd9c8ad545b5f6e';
      it('should return correctly', () => {
        const { err, obj } = model._objectRead(sha1)
        expect(obj.serialize().toString()).toEqual(`\
日本語,英語,キー
こんにちは,hello,common.greeting.hello
さようなら,goodbye,common.greeting.good_bye
おやすみなさい,good_night,common.greeting.good_night
歓迎します,welcome,common.greeting.welcom
`)
        expect(err).toBeNull()
      })
    })

    describe('when sha do not exists', () => {
      const gocha = 'not_exists'
      it('should return correctly', () => {
        const { err, obj } = model._objectRead(gocha)
        expect(obj).toBeNull()
        expect(err.message).toEqual('Do not exists path: undefined')
      })
    })
  })

  describe('#_objectResolve', () => {
    describe('when name is HEAD', () => {
      it('should return correctly', (done) => {
        model._objectResolve('HEAD').then(shaArr => {
          expect(shaArr.length).toEqual(1)
          expect(shaArr[0]).toEqual('03577e30b394d4cafbbec22cc1a78b91b3e7c20b')
          done()
        })
      })
    })

    describe('when name is SHA1 (full)', () => {
      const sha1 = '03577e30b394d4cafbbec22cc1a78b91b3e7c20b'
      it('should return correctly', (done) => {
        model._objectResolve(sha1).then(shaArr => {
          expect(shaArr.length).toEqual(1)
          expect(shaArr[0]).toEqual('03577e30b394d4cafbbec22cc1a78b91b3e7c20b')
          done()
        })
      })
    })

    describe('when name is SHA1 (7 degits)', () => {
      const shortSHA1 = '0133e12'
      it('should return correctly', (done) => {
        model._objectResolve(shortSHA1).then(shaArr => {
          expect(shaArr.length).toEqual(1)
          expect(shaArr[0]).toEqual('0133e12ee3679cb5bd494cb50e4f5a5a896eeb14')
          done()
        })
      })
    })

    describe('when name is do not match any case', () => {
      const gocha = 'hogefuga'
      it('should return correctly', (done) => {
        model._objectResolve(gocha).catch(err => {
          expect(err.message).toEqual("error: pathspec 'hogefuga' did not match any file(s) known to sit")
          done()
        })
      })
    })

    describe('when name is do not match any case (like sha1)', () => {
      const fakeSHA1 = '690bc5e'
      it('should return correctly', (done) => {
        model._objectResolve(fakeSHA1).catch(err => {
          expect(err.message).toEqual("error: pathspec '690bc5e' did not match any file(s) known to sit")
          done()
        })
      })
    })
  })

  describe('#_refResolve', () => {
    describe('when ref is HEAD', () => {
      it('should return correctly', () => {
        expect(model._refResolve('HEAD')).toEqual('03577e30b394d4cafbbec22cc1a78b91b3e7c20b')
      })
    })

    describe('when ref is not HEAD', () => {
      it('should return correctly', () => {
        expect(model._refResolve('refs/heads/master')).toEqual('03577e30b394d4cafbbec22cc1a78b91b3e7c20b')
      })
    })
  })

  describe('#_branchResolve', () => {
    describe('when ref is not HEAD', () => {
      it('should return correctly', () => {
        expect(model._branchResolve('refs/heads/test')).toEqual('test')
      })
    })

    describe('when ref is HEAD', () => {
      it('should return correctly', () => {
        expect(model._branchResolve('HEAD')).toEqual('master')
      })
    })
  })

  describe('#_getPath', () => {
    it('should return correctly', () => {
      expect(model._getPath('hoge', 'fuga')).toEqual('./test/localRepo/.sit/hoge/fuga')
    })
  })
})
