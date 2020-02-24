'use strict';

const SitRepo = require('../SitRepo')
const SitConfig = require('@repos/SitConfig')
const SitBlob = require('@repos/objects/SitBlob');
const editor = require('@utils/editor');
const opener = require('opener');

const {
  writeSyncFile,
  rmDirSync,
  recursive,
  mkdirSyncRecursive
} = require('@utils/file');

// https://stackoverflow.com/questions/39755439/how-to-mock-imported-named-function-in-jest-when-module-is-unmocked
jest.mock('@utils/file', () => (
  {
    ...(jest.requireActual('@utils/file')),
    writeSyncFile: jest.fn(),
    rmDirSync: jest.fn(),
    recursive: jest.fn(),
    mkdirSyncRecursive: jest.fn()
  }
));

jest.mock('@utils/editor');
jest.mock('opener');

const mockMoment_format = jest.fn()
jest.mock('moment', () => {
  return jest.fn().mockImplementation(() => {
    return {
      format: mockMoment_format
    }
  })
});

describe('SitRepo', () => {
  const model = new SitRepo()
  const oldLocalRepo = model.localRepo
  const oldDistFilePath = model.distFilePath

  afterEach(() => {
    jest.restoreAllMocks()
    model.localRepo = oldLocalRepo
    model.distFilePath = oldDistFilePath
  })

  describe('#init', () => {
    describe('when localRepo exist', () => {
      it('should return correctly', () => {
        model.localRepo = 'test/localRepo/.sit'
        expect(model.init()).toEqual(false)
      })
    })

    describe('when localRepo do not exist', () => {
      it('should return correctly', () => {
        model.localRepo = 'test/sandbox/.sit'
        const mockModel__mkdirSyncRecursive = jest.spyOn(model, '_mkdirSyncRecursive').mockReturnValue(model)
        const mockModel__writeSyncFile = jest.spyOn(model, '_writeSyncFile').mockReturnValue(model)
        const mockModel__createDistFile = jest.spyOn(model, '_createDistFile').mockReturnValueOnce(true)
        const data = ['日本語', '英語', 'キー']
        expect(model.init({ data })).toEqual(true)

        expect(mockModel__mkdirSyncRecursive).toHaveBeenCalledTimes(6)
        expect(mockModel__mkdirSyncRecursive.mock.calls[0]).toEqual([])
        expect(mockModel__mkdirSyncRecursive.mock.calls[1]).toEqual(['refs/heads'])
        expect(mockModel__mkdirSyncRecursive.mock.calls[2]).toEqual(['refs/remotes'])
        expect(mockModel__mkdirSyncRecursive.mock.calls[3]).toEqual(['objects'])
        expect(mockModel__mkdirSyncRecursive.mock.calls[4]).toEqual(['logs/refs/heads'])
        expect(mockModel__mkdirSyncRecursive.mock.calls[5]).toEqual(['logs/refs/remotes'])

        expect(mockModel__writeSyncFile).toHaveBeenCalledTimes(2)
        expect(mockModel__writeSyncFile.mock.calls[0]).toEqual(["HEAD", "ref: refs/heads/master", true])
        expect(mockModel__writeSyncFile.mock.calls[1]).toEqual(["config", "", true])

        expect(writeSyncFile).toHaveBeenCalledTimes(1)
        expect(writeSyncFile.mock.calls[0]).toEqual(["./test/homeDir/.sitconfig", "", true])

        expect(mockModel__createDistFile).toHaveBeenCalledTimes(1)
        expect(mockModel__createDistFile.mock.calls[0]).toEqual([["日本語", "英語", "キー"]])
      })
    })
  })

  describe('#rollback', () => {
    describe('when localRepo exist', () => {
      it('should return correctly', () => {
        model.localRepo = 'test/localRepo/.sit'
        model.rollback()
        expect(rmDirSync).toHaveBeenCalledTimes(1)
      })
    })

    // https://stackoverflow.com/questions/49096093/how-do-i-test-a-jest-console-log
    describe('when localRepo do not exist', () => {
      it('should return correctly', () => {
        model.localRepo = 'test/sandbox/.sit'
        console.log = jest.fn();
        model.rollback()

        expect(rmDirSync).not.toHaveBeenCalled()
        expect(console.log.mock.calls[0][0]).toBe('Do not exist local repo: test/sandbox/.sit')
      })
    })
  })

  describe('#clone', () => {
    describe('when distDir exist', () => {
      it('should return correctly', () => {
        model.localRepo = 'test/sandbox/.sit'
        const mockModel__writeSyncFile = jest.spyOn(model, '_writeSyncFile').mockReturnValue(model)
        const mockModel__writeLog = jest.spyOn(model, '_writeLog').mockReturnValue(model)
        const mockModel__createDistFile = jest.spyOn(model, '_createDistFile').mockReturnValueOnce(true)
        const mockModel__createMergeCommit = jest.spyOn(model, '_createMergeCommit').mockReturnValueOnce('03577e30b394d4cafbbec22cc1a78b91b3e7c20b')
        const mockSitConfig_updateSection = jest.fn()
        SitConfig.prototype.updateSection = mockSitConfig_updateSection

        model.clone(
          'origin',
          'https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=0',
          '953b3794394d6b48d8690bc5e53aa2ffe2133035',
          [
            ['日本語', '英語', 'キー'],
            ['こんにちは', 'hello', 'greetiing.hello']
          ],
          { type: 'GoogleSpreadSheet' }
        )
        expect(mockSitConfig_updateSection).toHaveBeenCalledTimes(2)
        expect(mockSitConfig_updateSection.mock.calls[0][0]).toBe('remote.origin')
        expect(mockSitConfig_updateSection.mock.calls[0][1]).toEqual({ "fetch": "+refs/heads/*:refs/remotes/origin/*", "type": "GoogleSpreadSheet", "url": "https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=0" })
        expect(mockSitConfig_updateSection.mock.calls[1][0]).toBe('branch.master')
        expect(mockSitConfig_updateSection.mock.calls[1][1]).toEqual({ "merge": "refs/heads/master", "remote": "origin" })

        expect(mockModel__writeSyncFile).toHaveBeenCalledTimes(2)
        expect(mockModel__writeSyncFile.mock.calls[0][0]).toBe('refs/heads/master')
        expect(mockModel__writeSyncFile.mock.calls[0][1]).toBe('03577e30b394d4cafbbec22cc1a78b91b3e7c20b')
        expect(mockModel__writeSyncFile.mock.calls[1][0]).toBe('refs/remotes/origin/HEAD')
        expect(mockModel__writeSyncFile.mock.calls[1][1]).toBe('ref: refs/remotes/origin/master')

        expect(mockModel__writeLog).toHaveBeenCalledTimes(3)
        expect(mockModel__writeLog.mock.calls[0][0]).toBe('logs/refs/heads/master')
        expect(mockModel__writeLog.mock.calls[0]).toEqual(["logs/refs/heads/master", "0000000000000000000000000000000000000000", "03577e30b394d4cafbbec22cc1a78b91b3e7c20b", "clone: from https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=0"])
        expect(mockModel__writeLog.mock.calls[1][0]).toBe('logs/refs/remotes/origin/HEAD')
        expect(mockModel__writeLog.mock.calls[1]).toEqual(["logs/refs/remotes/origin/HEAD", "0000000000000000000000000000000000000000", "03577e30b394d4cafbbec22cc1a78b91b3e7c20b", "clone: from https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=0"])
        expect(mockModel__writeLog.mock.calls[2][0]).toBe('logs/HEAD')
        expect(mockModel__writeLog.mock.calls[2]).toEqual(["logs/HEAD", "0000000000000000000000000000000000000000", "03577e30b394d4cafbbec22cc1a78b91b3e7c20b", "clone: from https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=0"])

        expect(mockModel__createDistFile).toHaveBeenCalledTimes(1)
        expect(mockModel__createDistFile.mock.calls[0][0]).toEqual([
          ['日本語', '英語', 'キー'],
          ['こんにちは', 'hello', 'greetiing.hello']
        ])
        expect(mockModel__createDistFile.mock.calls[0][1]).toEqual(true)

        expect(mockModel__createMergeCommit).toHaveBeenCalledTimes(1)
        expect(mockModel__createMergeCommit.mock.calls[0]).toEqual(["953b3794394d6b48d8690bc5e53aa2ffe2133035", "0000000000000000000000000000000000000000", "master", "GoogleSpreadSheet"])
      })
    })

    describe('when distDir do not exist', () => {
      it('should return correctly', () => {
        model.localRepo = 'test/sandbox/.sit'
        model.distFilePath = 'do_not_exist/test_data.csv'

        jest.spyOn(model, '_writeSyncFile').mockReturnValue(model)
        jest.spyOn(model, '_writeLog').mockReturnValue(model)
        const mockSitConfig_updateSection = jest.fn()
        const mockModel__createMergeCommit = jest.spyOn(model, '_createMergeCommit').mockReturnValueOnce('03577e30b394d4cafbbec22cc1a78b91b3e7c20b')
        SitConfig.prototype.updateSection = mockSitConfig_updateSection

        model.clone(
          'origin',
          'https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=0',
          '953b3794394d6b48d8690bc5e53aa2ffe2133035',
          '日本語,英語,キー\nこんにちは,hello,greeting.hello\nさようなら,good_bye,greeting.good_bye\n歓迎します,wellcome,greeting.welcome\nおやすみ,good night,greeting.good_night',
          { type: 'GoogleSpreadSheet' }
        )
        expect(mkdirSyncRecursive).toHaveBeenCalledTimes(1)
        expect(mkdirSyncRecursive.mock.calls[0][0]).toEqual('do_not_exist')

        expect(mockModel__createMergeCommit).toHaveBeenCalledTimes(1)
        expect(mockModel__createMergeCommit.mock.calls[0]).toEqual(["953b3794394d6b48d8690bc5e53aa2ffe2133035", "0000000000000000000000000000000000000000", "master", "GoogleSpreadSheet"])
      })
    })
  })

  describe('#isLocalRepo', () => {
    describe('when localRepo exist', () => {
      it('should return correctly', () => {
        expect(model.isLocalRepo()).toEqual(true)
      })
    })

    describe('when localRepo do not exist', () => {
      it('should return correctly', () => {
        model.localRepo = 'test/sandbox/.sit'
        expect(model.isLocalRepo()).toEqual(false)
      })
    })
  })

  describe('#currentBranch', () => {
    it('should return correctly', () => {
      expect(model.currentBranch()).toEqual('master')
    })
  })

  describe('#beforeHEADHash', () => {
    it('should return correctly', () => {
      expect(model.beforeHEADHash()).toEqual('0133e12ee3679cb5bd494cb50e4f5a5a896eeb14')
    })
  })

  describe('#afterHEADHash', () => {
    it('should return correctly', () => {
      const sha1 = '5b1cf86e97c6633e9a2dd85567e33d636dd3748a'
      const mockModel__add = jest.spyOn(model, '_add').mockReturnValue(sha1)

      expect(model.afterHEADHash()).toEqual(sha1)
      expect(mockModel__add).toHaveBeenCalledTimes(1)
      expect(mockModel__add.mock.calls[0][0]).toEqual('test/dist/test_data.csv')
      expect(mockModel__add.mock.calls[0][1]).toEqual({})
    })
  })

  describe('#_HEADCSVData', () => {
    describe('when HEAD exist', () => {
      it('should return correctly', () => {
        model._HEADCSVData(csvData => {
          expect(csvData).toEqual(
            [
              ["日本語", "英語", "キー"],
              ["こんにちは", "hello", "greeting.hello"],
              [""]
            ]
          )
        })
      })
    })
  })

  describe('#_add', () => {
    it('should return correctly', () => {
      const sha1 = '5b1cf86e97c6633e9a2dd85567e33d636dd3748a'
      const mockModel_hashObject = jest.spyOn(model, 'hashObject').mockReturnValue(sha1)
      const path = 'test/sit.js'

      expect(model._add(path, {})).toEqual(sha1)
      expect(mockModel_hashObject).toHaveBeenCalledTimes(1)
      expect(mockModel_hashObject.mock.calls[0][0]).toEqual("test/sit.js")
      expect(mockModel_hashObject.mock.calls[0][1]).toEqual({ "type": "blob", "write": true })
    })
  })

  describe('#catFile', () => {
    describe('when name is existed sha1', () => {
      it('should return correctly', (done) => {
        const name = '0133e12'

        model.catFile(name)
          .then(obj => {
            expect(obj.serialize().toString()).toEqual('日本語,英語,キー\nこんにちは,hello,greeting.hello\n')
            done()
          })
      })
    })

    describe('when name do not exists', () => {
      it('should return correctly', (done) => {
        const name = 'hogefuga'

        model.catFile(name).catch(err => {
          expect(err.message).toEqual("error: pathspec 'hogefuga' did not match any file(s) known to sit")
          done()
        })
      })
    })
  })

  describe('#hashObject', () => {
    describe('when path exist', () => {
      it('should return correctly', () => {
        const path = 'test/dist/test_data.csv'
        const opts = { type: 'blob', write: false }

        expect(model.hashObject(path, opts)).toEqual('b18c9566daeb03818f64109ffcd9c8ad545b5f6e')
      })
    })
  })

  describe('#hashObjectFromData', () => {
    it('should return correctly', () => {
      const data = '日本語,英語,キー\nこんにちは,hello,greeting.hello\n'
      const opts = { type: 'blob', write: false }

      expect(model.hashObjectFromData(data, opts)).toEqual('0133e12ee3679cb5bd494cb50e4f5a5a896eeb14')
    })
  })

  // (node:48137) UnhandledPromiseRejectionWarning: Error: process.exit() was called.
  describe('#branch', () => {
    describe("when do not specify nothiing", () => {
      it('should return correctly', () => {
        recursive.mockReturnValueOnce(Promise.resolve(['files']))
        model.branch()

        expect(recursive).toHaveBeenCalledTimes(1)
        expect(recursive.mock.calls[0]).toEqual(["test/localRepo/.sit/refs/heads"])
      })
    })

    describe("when specify 'all' option", () => {
      it('should return correctly', () => {
        recursive.mockReturnValueOnce(Promise.resolve(['files']))
        model.branch({ all: true })

        expect(recursive).toHaveBeenCalledTimes(1)
        expect(recursive.mock.calls[0]).toEqual(["test/localRepo/.sit/refs"])
      })
    })

    describe("when specify 'deleteBranch' option", () => {
      describe("when 'deleteBranch' is 'currentBranch'", () => {
        it('should return correctly', () => {
          console.error = jest.fn()
          jest.spyOn(process, 'exit').mockImplementation(() => {
            throw new Error('process.exit() was called.')
          });

          expect(() => model.branch({ deleteBranch: 'master' })).toThrow('process.exit() was called.')
          expect(console.error.mock.calls[0]).toEqual(["error: Cannot delete branch 'master' checked out"])
          expect(console.error).toHaveBeenCalledTimes(1)
        })
      })

      // Why cannot spyOn _dleteSyncFile
      // https://github.com/facebook/jest/issues/6671
      describe("when 'deleteBranch' is not 'currentBranch' (success)", () => {
        it('should return correctly', () => {
          const mockModel__objectFind = jest.spyOn(model, '_objectFind').mockReturnValueOnce(Promise.resolve('success'))
          jest.spyOn(model, '_deleteSyncFile').mockReturnValue(model)
          model.branch({ deleteBranch: 'develop' })

          expect(mockModel__objectFind).toHaveBeenCalledTimes(1)
        })
      })

      // (node:48137) UnhandledPromiseRejectionWarning: Error: process.exit() was called.
      describe("wheen 'deleteBranch' is not 'currentBranch' (failure)", () => {
        it('should return correctly', () => {
          const mockModel__objectFind = jest.spyOn(model, '_objectFind').mockReturnValueOnce(Promise.resolve(null))
          jest.spyOn(model, '_deleteSyncFile').mockReturnValue(model)
          console.error = jest.fn()
          jest.spyOn(process, 'exit').mockImplementation(() => {
            throw new Error('process.exit() was called.')
          });

          model.branch({ deleteBranch: 'donotexist' })
          // https://github.com/facebook/jest/issues/6671#issuecomment-404171584
          // Mock information of processing in promise cannot be taken
          // expect(() => model.branch({ deleteBranch: 'donotexist' })).toThrow('process.exit() was called.')
          expect(mockModel__objectFind).toHaveBeenCalledTimes(1)
        })
      })

      describe("when 'deleteBranch' is 'currentBranch' (failure)", () => {
        it('should return correctly', () => {
          console.error = jest.fn()
          jest.spyOn(process, 'exit').mockImplementation(() => {
            throw new Error('process.exit() was called.')
          });

          expect(() => model.branch({ deleteBranch: 'master' })).toThrow('process.exit() was called.')
          expect(console.error).toHaveBeenCalledTimes(1)
          expect(console.error.mock.calls[0]).toEqual(["error: Cannot delete branch 'master' checked out"])
        })
      })
    })
  })

  describe('#checkout', () => {
    describe('when checkout local branch', () => {
      describe('when currentBranch is checkout branch', () => {
        it('should return correctly', () => {
          console.log = jest.fn()
          model.checkout(null, 'master', {})

          expect(console.log).toHaveBeenCalledTimes(1)
          expect(console.log.mock.calls[0]).toEqual(["Already on 'master'"])
        })
      })

      //
      describe('when currentBranch is not checkout branch', () => {
        it('should return correctly', () => {
          const mockObj = new SitBlob(model, '1,2,3', 3)
          const mockModel__objectFind = jest.spyOn(model, '_objectFind').mockReturnValue(Promise.resolve('success'))
          jest.spyOn(model, '_writeSyncFile').mockReturnValue(model)
          jest.spyOn(model, '_writeLog').mockReturnValue(model)
          jest.spyOn(model, 'catFile').mockReturnValue(Promise.resolve(mockObj))
          model.checkout(null, 'develop', {})

          expect(mockModel__objectFind).toHaveBeenCalledTimes(1)
          expect(mockModel__objectFind.mock.calls[0]).toEqual(['develop'])
        })
      })
    })

    describe('when checkout from remote branch', () => {
      it('should return correctly', () => {
        const mockSitConfig_updateSection = jest.fn()
        SitConfig.prototype.updateSection = mockSitConfig_updateSection
        const mockModel__fileCopySync = jest.spyOn(model, '_fileCopySync').mockReturnValue(model)
        const mockModel__writeLog = jest.spyOn(model, '_writeLog').mockReturnValue(model)
        const mockModel__objectFind = jest.spyOn(model, '_objectFind').mockReturnValue(Promise.resolve('b18c9566daeb03818f64109ffcd9c8ad545b5f6e'))
        model.checkout('origin', 'test', {})

        expect(mockSitConfig_updateSection).toHaveBeenCalledTimes(1)
        expect(mockSitConfig_updateSection.mock.calls[0]).toEqual(["branch.test", { "merge": "refs/heads/test", "remote": "origin" }])

        expect(mockModel__fileCopySync).toHaveBeenCalledTimes(1)
        expect(mockModel__fileCopySync.mock.calls[0]).toEqual(["refs/remotes/origin/test", "refs/heads/test"])

        expect(mockModel__writeLog).toHaveBeenCalledTimes(1)
        expect(mockModel__writeLog.mock.calls[0]).toEqual(["logs/refs/heads/test", null, "b18c9566daeb03818f64109ffcd9c8ad545b5f6e", "branch: Created from refs/remotes/origin/test"])

        // checkout test (2 times)

        expect(mockModel__objectFind).toHaveBeenCalledTimes(1)
        expect(mockModel__objectFind.mock.calls[0]).toEqual(["test"])
      })
    })

    describe('when checkout new branch', () => {
      describe('when checkout branch is already exists', () => {
        it('should return correctly', () => {
          console.error = jest.fn()
          jest.spyOn(process, 'exit').mockImplementation(() => {
            throw new Error('process.exit() was called.')
          });

          expect(() => model.checkout(null, null, { branch: 'develop' })).toThrow('process.exit() was called.')
          expect(console.error).toHaveBeenCalledTimes(1)
          expect(console.error.mock.calls[0]).toEqual(["fatal: A branch named 'develop' already exists."])
        })
      })

      describe('when checkout branch is new branch', () => {
        describe('when branch name is valid', () => {
          it('should return correctly', () => {
            console.log = jest.fn()
            const mockModel__writeSyncFile = jest.spyOn(model, '_writeSyncFile').mockReturnValue(model)
            const mockModel__writeLog = jest.spyOn(model, '_writeLog').mockReturnValue(model)

            model.checkout(null, null, { branch: 'new_branch' })

            expect(mockModel__writeSyncFile).toHaveBeenCalledTimes(2)
            expect(mockModel__writeSyncFile.mock.calls[0]).toEqual(["HEAD", "ref: refs/heads/new_branch", false])
            expect(mockModel__writeSyncFile.mock.calls[1]).toEqual(["refs/heads/new_branch", "0133e12ee3679cb5bd494cb50e4f5a5a896eeb14", false])

            expect(mockModel__writeLog).toHaveBeenCalledTimes(2)
            expect(mockModel__writeLog.mock.calls[0]).toEqual(["logs/HEAD", "0133e12ee3679cb5bd494cb50e4f5a5a896eeb14", "0133e12ee3679cb5bd494cb50e4f5a5a896eeb14", "checkout: moving from master to new_branch"])
            expect(mockModel__writeLog.mock.calls[1]).toEqual(["logs/refs/heads/new_branch", null, "0133e12ee3679cb5bd494cb50e4f5a5a896eeb14", "branch: Created from HEAD"])

            expect(console.log).toHaveBeenCalledTimes(1)
            expect(console.log.mock.calls[0]).toEqual(["Switched to a new branch 'new_branch'"])
          })
        })

        describe('when branch name is invalid', () => {
          it('should return correctly', () => {
            console.error = jest.fn()
            jest.spyOn(process, 'exit').mockImplementation(() => {
              throw new Error('process.exit() was called.')
            });

            expect(() => model.checkout(null, null, { branch: '[pr] master...develop' })).toThrow('process.exit() was called.')
            expect(console.error).toHaveBeenCalledTimes(1)
            expect(console.error.mock.calls[0]).toEqual(["fatal: '[pr] master...develop' is not a valid branch name."])
          })
        })
      })

      describe('when repoName do not exist', () => {
        it('should return correctly', () => {
          console.error = jest.fn()
          jest.spyOn(process, 'exit').mockImplementation(() => {
            throw new Error('process.exit() was called.')
          });

          expect(() => model.checkout('typo_origin', 'test')).toThrow('process.exit() was called.')
          expect(console.error).toHaveBeenCalledTimes(1)
          expect(console.error.mock.calls[0]).toEqual([`\
fatal: 'typo_origin' does not appear to be a sit repository
fatal: Could not read from remote repository.

Please make sure you have the correct access rights and the repository exists.`])
        })
      })
    })
  })

  describe('#diff', () => {
    it('should return correctly', () => {
      const mockObj = new SitBlob(model, '1,2,3', 3)
      const mockModel_catFile = jest.spyOn(model, 'catFile').mockReturnValue(Promise.resolve(mockObj))
      model.diff()

      expect(mockModel_catFile).toHaveBeenCalledTimes(1)
      expect(mockModel_catFile.mock.calls[0]).toEqual(["0133e12ee3679cb5bd494cb50e4f5a5a896eeb14"])
    })
  })

  describe('#status', () => {
    describe('when modify dist file', () => {
      it('should return correctly', () => {
        console.log = jest.fn()
        model.status()

        expect(console.log).toHaveBeenCalledTimes(1)
        expect(console.log.mock.calls[0]).toEqual(["modified: test/dist/test_data.csv"])
      })
    })

    describe('when do not modify dist file', () => {
      it('should return correctly', () => {
        console.log = jest.fn()
        const mockModel__refResolve = jest.spyOn(model, '_refResolve').mockReturnValue('0133e12ee3679cb5bd494cb50e4f5a5a896eeb14')
        const mockModel_hashObject = jest.spyOn(model, 'hashObject').mockReturnValue('0133e12ee3679cb5bd494cb50e4f5a5a896eeb14')
        model.status()

        expect(mockModel__refResolve).toHaveBeenCalledTimes(1)
        expect(mockModel__refResolve.mock.calls[0]).toEqual(["HEAD"])

        expect(mockModel_hashObject).toHaveBeenCalledTimes(1)
        expect(mockModel_hashObject.mock.calls[0]).toEqual(["test/dist/test_data.csv", { "type": "blob" }])

        expect(console.log).toHaveBeenCalledTimes(1)
        expect(console.log.mock.calls[0]).toEqual(['On branch master\nnothing to commit'])
      })
    })
  })

  describe('#commit', () => {
    const commitData = `\
tree b18c9566daeb03818f64109ffcd9c8ad545b5f6e
parent 0133e12ee3679cb5bd494cb50e4f5a5a896eeb14
author yukihirop <te108186@gmail.com> 1582127655803 +0900
committer yukihirop <te108186@gmail.com> 1582127655803 +0900

first commit`

    describe('when can commit', () => {
      it('should return correctly', () => {
        console.log = jest.fn()
        const mockModel__writeSyncFile = jest.spyOn(model, '_writeSyncFile').mockReturnValue(model)
        const mockModel__writeLog = jest.spyOn(model, '_writeLog').mockReturnValue(model)
        const mockModel__createCommit = jest.spyOn(model, '_createCommit').mockReturnValueOnce('b18c9566daeb03818f64109ffcd9c8ad545b5f6e')
        model.commit({ message: 'first commit' })

        expect(mockModel__createCommit).toHaveBeenCalledTimes(1)
        expect(mockModel__createCommit.mock.calls[0]).toEqual(["b18c9566daeb03818f64109ffcd9c8ad545b5f6e", "0133e12ee3679cb5bd494cb50e4f5a5a896eeb14", "first commit"])

        expect(mockModel__writeSyncFile).toHaveBeenCalledTimes(3)
        expect(mockModel__writeSyncFile.mock.calls[0]).toEqual(["COMMIT_EDITMSG", "first commit"])
        expect(mockModel__writeSyncFile.mock.calls[1]).toEqual(["ORIG_HEAD", "0133e12ee3679cb5bd494cb50e4f5a5a896eeb14"])
        expect(mockModel__writeSyncFile.mock.calls[2]).toEqual(["refs/heads/master", "b18c9566daeb03818f64109ffcd9c8ad545b5f6e"])

        expect(mockModel__writeLog).toHaveBeenCalledTimes(2)
        expect(mockModel__writeLog.mock.calls[0]).toEqual(["logs/HEAD", "0133e12ee3679cb5bd494cb50e4f5a5a896eeb14", "b18c9566daeb03818f64109ffcd9c8ad545b5f6e", "commit first commit"])
        expect(mockModel__writeLog.mock.calls[1]).toEqual(["logs/refs/heads/master", "0133e12ee3679cb5bd494cb50e4f5a5a896eeb14", "b18c9566daeb03818f64109ffcd9c8ad545b5f6e", "commit first commit"])

        expect(console.log).toHaveBeenCalledTimes(1)
        expect(console.log.mock.calls[0]).toEqual(["[master b18c956] first commit"])
      })
    })

    describe('when nothing that can commit', () => {
      it('should return correctly', () => {
        console.log = jest.fn()
        const mockModel__refResolve = jest.spyOn(model, '_refResolve').mockReturnValue('0133e12ee3679cb5bd494cb50e4f5a5a896eeb14')
        const mockModel__add = jest.spyOn(model, '_add').mockReturnValue('0133e12ee3679cb5bd494cb50e4f5a5a896eeb14')
        const mockModel__createCommit = jest.spyOn(model, '_createCommit').mockReturnValueOnce('0133e12ee3679cb5bd494cb50e4f5a5a896eeb14')
        model.commit({ message: 'first commit' })

        expect(mockModel__refResolve).toHaveBeenCalledTimes(1)
        expect(mockModel__refResolve.mock.calls[0]).toEqual(["HEAD"])

        expect(mockModel__add).toHaveBeenCalledTimes(1)
        expect(mockModel__add.mock.calls[0]).toEqual(["test/dist/test_data.csv", { "message": "first commit" }])

        expect(mockModel__createCommit).toHaveBeenCalledTimes(1)
        expect(mockModel__createCommit.mock.calls[0]).toEqual(["0133e12ee3679cb5bd494cb50e4f5a5a896eeb14", "0133e12ee3679cb5bd494cb50e4f5a5a896eeb14", "first commit"])

        expect(console.log).toHaveBeenCalledTimes(1)
        expect(console.log.mock.calls[0]).toEqual(['On branch master\nnothing to commit'])
      })
    })

    describe('when commit message is blank', () => {
      it('should return correctly', () => {
        console.error = jest.fn()
        jest.spyOn(process, 'exit').mockImplementation(() => {
          throw new Error('process.exit() was called.')
        });

        expect(() => model.commit()).toThrow('process.exit() was called.')
        expect(console.error).toHaveBeenCalledTimes(1)
        expect(console.error.mock.calls[0]).toEqual(["Need message to commit"])
      })
    })
  })

  describe('#push', () => {
    describe('when psuh exist branch', () => {
      it('should return correctly', (done) => {
        const mockModel__writeLog = jest.spyOn(model, '_writeLog').mockReturnValue(model)
        const mockModel__writeSyncFile = jest.spyOn(model, '_writeSyncFile').mockReturnValue(model)

        model.push('origin', 'develop', { HEADHash: '0133e12ee3679cb5bd494cb50e4f5a5a896eeb14' })
          .then(result => {
            expect(result).toEqual({ "afterHash": "0133e12ee3679cb5bd494cb50e4f5a5a896eeb14", "beforeHash": "0000000000000000000000000000000000000000" })

            expect(mockModel__writeLog).toHaveBeenCalledTimes(1)
            expect(mockModel__writeLog.mock.calls[0]).toEqual(["logs/refs/remotes/origin/develop", "0000000000000000000000000000000000000000", "0133e12ee3679cb5bd494cb50e4f5a5a896eeb14", "update by push"])

            expect(mockModel__writeSyncFile).toHaveBeenCalledTimes(2)
            expect(mockModel__writeSyncFile.mock.calls[0]).toEqual(["refs/remotes/origin/develop", "0133e12ee3679cb5bd494cb50e4f5a5a896eeb14"])
            expect(mockModel__writeSyncFile.mock.calls[1]).toEqual(["REMOTE_HEAD", "0133e12ee3679cb5bd494cb50e4f5a5a896eeb14"])
            done()
          })
      })
    })

    describe('when push do not exist branch', () => {
      it('should return correctly', (done) => {
        model.push('origin', 'new_branch', { HEADHash: '0133e12ee3679cb5bd494cb50e4f5a5a896eeb14' })
          .catch(err => {
            expect(err.message).toEqual("error: src refspec unknown does not match any\nerror: failed to push some refs to 'origin'")
            done()
          })
      })
    })
  })

  describe('#fetch', () => {
    describe('when repoName is blank', () => {
      it('should return correctly', (done) => {
        model.fetch(null, 'develop', { remoteHash: 'b18c9566daeb03818f64109ffcd9c8ad545b5f6e' })
          .catch(err => {
            expect(err.message).toEqual("repository is required")
            done()
          })
      })
    })

    describe('when branch is blank', () => {
      it('should return correctly', (done) => {
        recursive.mockReturnValueOnce(Promise.resolve(
          ["test/localRepo/.sit/refs/remotes/origin/master",
            "test/localRepo/.sit/refs/remotes/origin/test"
          ])
        )
        jest.spyOn(model, '_writeSyncFile').mockReturnValue(model)
        jest.spyOn(model, '_writeLog').mockReturnValue(model)
        jest.spyOn(model, '_createMergeCommit').mockReturnValue('03/577e30b394d4cafbbec22cc1a78b91b3e7c20b')

        model.fetch('origin', null, {
          prune: false,
          remoteRefs: { 'test-1': 'b18c9566daeb03818f64109ffcd9c8ad545b5f6e', 'test-2': '0133e12ee3679cb5bd494cb50e4f5a5a896eeb14' },
          remoteBranches: ['test-1', 'test-2'],
          type: 'GoogleSpreadSheet'
        }).then(() => {
          expect(recursive).toHaveBeenCalledTimes(1)
          expect(recursive.mock.calls[0]).toEqual(["test/localRepo/.sit/refs/remotes/origin"])
          done()
        })
      })
    })

    describe('when cat fetch', () => {
      it('should return correctly', (done) => {
        const mockModel__writeSyncFile = jest.spyOn(model, '_writeSyncFile').mockReturnValue(model)
        const mockModel__writeLog = jest.spyOn(model, '_writeLog').mockReturnValue(model)
        const mockModel__createMergeCommit = jest.spyOn(model, '_createMergeCommit').mockReturnValue('03577e30b394d4cafbbec22cc1a78b91b3e7c20b')
        model.fetch('origin', 'test', { remoteHash: 'b18c9566daeb03818f64109ffcd9c8ad545b5f6e', type: 'GoogleSpreadSheet' })
          .then(result => {
            expect(result).toEqual({ "beforeHash": "b18c9566daeb03818f64109ffcd9c8ad545b5f6e", "branchCount": 1, "afterHash": "03577e30b394d4cafbbec22cc1a78b91b3e7c20b" })

            expect(mockModel__writeSyncFile).toHaveBeenCalledTimes(2)
            expect(mockModel__writeSyncFile.mock.calls[0]).toEqual(["FETCH_HEAD", "03577e30b394d4cafbbec22cc1a78b91b3e7c20b		branch 'test' of origin"])
            expect(mockModel__writeSyncFile.mock.calls[1]).toEqual(["refs/remotes/origin/test", "03577e30b394d4cafbbec22cc1a78b91b3e7c20b"])

            expect(mockModel__writeLog).toHaveBeenCalledTimes(1)
            expect(mockModel__writeLog.mock.calls[0]).toEqual(["logs/refs/remotes/origin/test", "b18c9566daeb03818f64109ffcd9c8ad545b5f6e", "03577e30b394d4cafbbec22cc1a78b91b3e7c20b", "fetch origin test: fast-forward"])

            expect(mockModel__createMergeCommit).toHaveBeenCalledTimes(1)
            expect(mockModel__createMergeCommit.mock.calls[0]).toEqual(["b18c9566daeb03818f64109ffcd9c8ad545b5f6e", "b18c9566daeb03818f64109ffcd9c8ad545b5f6e", "test", "GoogleSpreadSheet"])

            done()
          })
      })
    })

    describe('when fetch --prune', () => {
      it('should return correctly', (done) => {
        recursive.mockReturnValueOnce(Promise.resolve(
          ["test/localRepo/.sit/refs/remotes/origin/master",
            "test/localRepo/.sit/refs/remotes/origin/test"
          ])
        )
        jest.spyOn(model, '_writeSyncFile').mockReturnValue(model)
        jest.spyOn(model, '_writeLog').mockReturnValue(model)
        jest.spyOn(model, '_deleteSyncFile').mockReturnValue(model)
        jest.spyOn(model, '_createMergeCommit').mockReturnValue('03/577e30b394d4cafbbec22cc1a78b91b3e7c20b')

        model.fetch('origin', null, {
          prune: true,
          remoteRefs: { 'test-1': 'b18c9566daeb03818f64109ffcd9c8ad545b5f6e', 'test-2': '0133e12ee3679cb5bd494cb50e4f5a5a896eeb14' },
          remoteBranches: ['test-1', 'test-2'],
          type: 'GoogleSpreadSheet'
        }).then(() => {

          expect(recursive).toHaveBeenCalledTimes(1)
          expect(recursive.mock.calls[0]).toEqual(["test/localRepo/.sit/refs/remotes/origin"])
          done()
        })
      })
    })
  })

  describe('#merge', () => {
    describe('when merge remote branch is not similar currentBranch', () => {
      it('should return correctly', () => {
        console.log = jest.fn()
        model.merge('origin', 'test', {})

        expect(console.log).toHaveBeenCalledTimes(1)
        expect(console.log.mock.calls[0]).toEqual(["The current branch is 'master'\nSorry... Only the same branch ('origin/master') on the remote can be merged"])
      })
    })

    describe('when merge --continue when MERGE_HEAD is missing', () => {
      it('should return correctly', () => {
        console.error = jest.fn()
        jest.spyOn(process, 'exit').mockImplementation(() => {
          throw new Error('process.exit() was called.')
        });
        const mockModel__isExistFile = jest.spyOn(model, '_isExistFile').mockReturnValue(false)

        expect(() => model.merge(null, null, { continue: true })).toThrow('process.exit() was called.')

        expect(mockModel__isExistFile).toHaveBeenCalledTimes(1)
        expect(mockModel__isExistFile.mock.calls[0]).toEqual(["MERGE_HEAD"])

        expect(console.error).toHaveBeenCalledTimes(1)
        expect(console.error.mock.calls[0]).toEqual(["fatal: There is no merge in progress (MERGE_HEAD missing)"])
      })
    })

    describe('when merge --continue when MERGE_HEAD exist', () => {
      it('should return correctly', () => {
        console.log = jest.fn()
        const mockModel__writeSyncFile = jest.spyOn(model, '_writeSyncFile').mockReturnValueOnce(model)
        jest.spyOn(model, '_writeLog').mockReturnValueOnce(model)
        jest.spyOn(model, '_deleteSyncFile').mockReturnValueOnce(model)
        model.merge(null, null, { continue: true })

        expect(mockModel__writeSyncFile).toHaveBeenCalledTimes(1)
        expect(mockModel__writeSyncFile.mock.calls[0][0]).toEqual('COMMIT_EDITMSG')
        expect(mockModel__writeSyncFile.mock.calls[0][1]).toEqual(`\
Merge remote-tracking branch 'origin/test'

# Conflict
#       ./test/dist/test_data.csv

#
# It looks like you may be committing a merge.
# If this is not correct, please remove the file
# 	test/localRepo/.sit/MERGE_HEAD
# and try again.


# Please enter the commit message for your changes. Lines starting
# with '#' will be ignored, and an empty message aborts the commit.
#
# On branch develop
# All conflicts fixed but you are still merging.
#
# Changes for commit:
#	modified:	test/dist/test_data.csv
#
`)

        expect(editor.open).toHaveBeenCalledTimes(1)
        expect(editor.open.mock.calls[0][0]).toEqual("test/localRepo/.sit/COMMIT_EDITMSG")
      })
    })

    describe('when merge origin test', () => {
      it('should return correctly', () => {
        console.error = jest.fn()
        jest.spyOn(process, 'exit').mockImplementation(() => {
          throw new Error('process.exit() was called.')
        });

        expect(() => model.merge('origin', 'master')).toThrow('process.exit() was called.')
        expect(console.error).toHaveBeenCalledTimes(1)
        expect(console.error.mock.calls[0]).toEqual([`\
error: Merging is not possible because you have unmerged files.
hint: Fix them up in the work tree, and then use 'sit merge --continue'
hint: as appropriate to mark resolution and make a commit.
fatal: Existing because of an unresolved conflict.`])
      })
    })

    describe('when merge --abort when MERGE_HEAD exist', () => {
      it('should return correctly', () => {
        const obj = new SitBlob(model, '1,2,3', 3)
        const mockModel__writeLog = jest.spyOn(model, '_writeLog').mockReturnValue(model)
        const mockModel__deleteSyncFile = jest.spyOn(model, '_deleteSyncFile').mockReturnValue(model)
        const mockModel_catFile = jest.spyOn(model, 'catFile').mockReturnValue(Promise.resolve(obj))
        model.merge(null, null, { abort: true })

        expect(mockModel__writeLog).toHaveBeenCalledTimes(1)
        expect(mockModel__writeLog.mock.calls[0]).toEqual(["logs/HEAD", "0000000000000000000000000000000000000000", "0000000000000000000000000000000000000000", "reset: moving to HEAD"])

        expect(mockModel__deleteSyncFile).toHaveBeenCalledTimes(3)
        expect(mockModel__deleteSyncFile.mock.calls[0]).toEqual(["MERGE_MODE"])
        expect(mockModel__deleteSyncFile.mock.calls[1]).toEqual(["MERGE_MSG"])
        expect(mockModel__deleteSyncFile.mock.calls[2]).toEqual(["MERGE_HEAD"])

        expect(mockModel_catFile).toHaveBeenCalledTimes(1)
        expect(mockModel_catFile.mock.calls[0]).toEqual(["0000000000000000000000000000000000000000"])
      })
    })

    describe('when merge --stat when MERGE_HEAD exist', () => {
      it('should return correctly', () => {
        console.error = jest.fn()
        jest.spyOn(process, 'exit').mockImplementation(() => {
          throw new Error('process.exit() was called.')
        });

        expect(() => model.merge(null, null, { stat: true })).toThrow('process.exit() was called.')
        expect(console.error).toHaveBeenCalledTimes(1)
        expect(console.error.mock.calls[0]).toEqual([`\
fatal: You have not concluded your merge (MERGE_HEAD exists)
Please, commit your changes before you merge.`])
      })
    })

    describe('when merge --stat when MERGE_HEAD do not exist', () => {
      it('should return correctly', () => {
        console.log = jest.fn()
        const mockModel__isExistFile = jest.spyOn(model, '_isExistFile').mockReturnValue(false)
        model.merge(null, null, { stat: true })

        expect(mockModel__isExistFile).toHaveBeenCalledTimes(2)
        expect(mockModel__isExistFile.mock.calls[0]).toEqual(["MERGE_HEAD"])
        expect(mockModel__isExistFile.mock.calls[1]).toEqual(["MERGE_HEAD"])

        expect(console.log).toHaveBeenCalledTimes(1)
        expect(console.log.mock.calls[0]).toEqual(["Already up to date."])
      })
    })

    describe('when merge origin master (conflict)', () => {
      it('should return correctly', () => {
        const obj = new SitBlob(model, '1,2,3', 3)
        jest.spyOn(model, '_writeSyncFile').mockReturnValue(model)
        jest.spyOn(model, '_writeLog').mockReturnValue(model)
        jest.spyOn(model, 'hashObjectFromData').mockReturnValue(true)
        const mockModel__isExistFile = jest.spyOn(model, '_isExistFile').mockReturnValue(false)
        const mockModel_catFile = jest.spyOn(model, 'catFile').mockReturnValue(Promise.resolve(obj))
        model.merge('origin', 'master')

        expect(mockModel__isExistFile).toHaveBeenCalledTimes(1)
        expect(mockModel__isExistFile.mock.calls[0]).toEqual(["MERGE_HEAD"])

        expect(mockModel_catFile).toHaveBeenCalledTimes(1)
        expect(mockModel_catFile.mock.calls[0]).toEqual(["5b1cf86e97c6633e9a2dd85567e33d636dd3748a"])
      })
    })
  })

  describe('#browseRemote', () => {
    describe('when repoName do not exist', () => {
      it('should return correctly', () => {
        model.browseRemote()

        expect(opener).toHaveBeenCalledTimes(1)
        expect(opener.mock.calls[0]).toEqual(["https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=0"])
      })
    })

    describe('when repoName exist', () => {
      it('should return correctly', () => {
        model.browseRemote('origin')

        expect(opener).toHaveBeenCalledTimes(1)
        expect(opener.mock.calls[0]).toEqual(["https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=0"])
      })
    })
  })

  describe('#remote', () => {
    const url = "https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=0"

    describe('when subcommand is add', () => {
      it('should return correctly', () => {
        SitConfig.prototype.updateSection = jest.fn()
        model.remote('add', 'origin', url, { type: 'GoogleSpreadSheet' })

        expect(SitConfig.prototype.updateSection).toHaveBeenCalledTimes(1)
        expect(SitConfig.prototype.updateSection.mock.calls[0]).toEqual(["remote.origin", { "fetch": "+refs/heads/*:refs/remotes/origin/*", "type": "GoogleSpreadSheet", "url": "https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=0" }])
      })
    })

    describe('when subcommand is rm', () => {
      it('should return correctly', () => {
        SitConfig.prototype.updateSection = jest.fn()
        model.remote('rm', 'origin', url, { type: 'GoogleSpreadSheet' })

        expect(SitConfig.prototype.updateSection).toHaveBeenCalledTimes(1)
        expect(SitConfig.prototype.updateSection.mock.calls[0]).toEqual(["remote.origin", null])
      })
    })

    describe('when subcommand is get-url', () => {
      it('should return correctly', () => {
        console.log = jest.fn()
        model.remote('get-url', 'origin', url, { type: 'GoogleSpreadSheet' })

        expect(console.log).toHaveBeenCalledTimes(1)
        expect(console.log.mock.calls[0]).toEqual(["https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=0"])
      })
    })

    describe('when subcommand is not-support', () => {
      it('should return correctly', () => {
        console.log = jest.fn()
        model.remote('not-support', 'origin', url, { type: 'GoogleSpreadSheet' })

        expect(console.log).toHaveBeenCalledTimes(1)
        expect(console.log.mock.calls[0]).toEqual(["Do not support subcommand: 'not-support'"])
      })
    })
  })
})
