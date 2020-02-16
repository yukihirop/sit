const SitBaseRepo = require('@repos/base/SitBaseRepo');
const SitBlob = require('@repos/objects/SitBlob');
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
      const sha1 = '0133e12ee3679cb5bd494cb50e4f5a5a896eeb14';
      it('should return correctly', (done) => {
        model._objectRead(sha1).then(obj => {
          expect(obj.serialize().toString()).toEqual(`\
日本語,英語,キー
こんにちは,hello,greeting.hello
`)
          done()
        })
      })
    })

    describe('when sha do not exists', () => {
      const gocha = 'not_exists'
      it('should return correctly', (done) => {
        model._objectRead(gocha).catch(err => {
          expect(err.message).toEqual('Do not exists path: undefined')
          done()
        })
      })
    })
  })

  describe('#_objectResolve', () => {
    describe('when name is HEAD', () => {
      it('should return correctly', (done) => {
        model._objectResolve('HEAD').then(shaArr => {
          expect(shaArr.length).toEqual(1)
          expect(shaArr[0]).toEqual('0133e12ee3679cb5bd494cb50e4f5a5a896eeb14')
          done()
        })
      })
    })

    describe('when name is SHA1 (full)', () => {
      const sha1 = '0133e12ee3679cb5bd494cb50e4f5a5a896eeb14'
      it('should return correctly', (done) => {
        model._objectResolve(sha1).then(shaArr => {
          expect(shaArr.length).toEqual(1)
          expect(shaArr[0]).toEqual('0133e12ee3679cb5bd494cb50e4f5a5a896eeb14')
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
        expect(model._refResolve('HEAD')).toEqual('0133e12ee3679cb5bd494cb50e4f5a5a896eeb14')
      })
    })

    describe('when ref is not HEAD', () => {
      it('should return correctly', () => {
        expect(model._refResolve('refs/heads/master')).toEqual('0133e12ee3679cb5bd494cb50e4f5a5a896eeb14')
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
