'use strict';

const SitRepo = require('../SitRepo')
const SitConfig = require('@repos/SitConfig')
const SitBlob = require('@repos/objects/SitBlob');

const {
  writeSyncFile,
  rmDirSync,
  recursive
} = require('@utils/file');

// https://stackoverflow.com/questions/39755439/how-to-mock-imported-named-function-in-jest-when-module-is-unmocked
jest.mock('@utils/file', () => (
  {
    ...(jest.requireActual('@utils/file')),
    writeSyncFile: jest.fn(),
    rmDirSync: jest.fn(),
    recursive: jest.fn()
  }
));

describe('SitRepo', () => {
  const model = new SitRepo()
  const oldLocalRepo = model.localRepo

  afterEach(() => {
    jest.restoreAllMocks()
    model.localRepo = oldLocalRepo
  })

  describe('#init', () => {
    describe('when localRepo exist', () => {
      it('should return correctly', () => {
        model.localRepo = './test/localRepo/.sit'
        expect(model.init()).toEqual(false)
      })
    })

    describe('when localRepo do not exist', () => {
      it('should return correctly', () => {
        model.localRepo = './test/sandbox/.sit'
        const mockModel__mkdirSyncRecursive = jest.spyOn(model, '_mkdirSyncRecursive').mockReturnValue(model)
        const mockModel__writeSyncFile = jest.spyOn(model, '_writeSyncFile').mockReturnValue(model)
        expect(model.init()).toEqual(true)
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
      })
    })
  })

  describe('#rollback', () => {
    describe('when localRepo exist', () => {
      it('should return correctly', () => {
        model.localRepo = './test/localRepo/.sit'
        model.rollback()
        expect(rmDirSync).toHaveBeenCalledTimes(1)
      })
    })

    // https://stackoverflow.com/questions/49096093/how-do-i-test-a-jest-console-log
    describe('when localRepo do not exist', () => {
      it('should return correctly', () => {
        model.localRepo = './test/sandbox/.sit'
        console.log = jest.fn();
        model.rollback()

        expect(rmDirSync).not.toHaveBeenCalled()
        expect(console.log.mock.calls[0][0]).toBe('Do not exist local repo: ./test/sandbox/.sit')
      })
    })
  })

  describe('#clone', () => {
    it('should return correctly', () => {
      model.localRepo = './test/sandbox/.sit'
      const mockModel__writeSyncFile = jest.spyOn(model, '_writeSyncFile').mockReturnValue(model)
      const mockModel__writeLog = jest.spyOn(model, '_writeLog').mockReturnValue(model)
      const mockSitConfig_updateSection = jest.fn()
      SitConfig.prototype.updateSection = mockSitConfig_updateSection

      model.clone(
        'origin',
        'https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=0',
        '953b3794394d6b48d8690bc5e53aa2ffe2133035',
        '日本語,英語,キー\nこんにちは,hello,greeting.hello\nさようなら,good_bye,greeting.good_bye\n歓迎します,wellcome,greeting.welcome\nおやすみ,good night,greeting.good_night',
        { type: 'GoogleSpreadSheet' }
      )
      expect(mockSitConfig_updateSection).toHaveBeenCalledTimes(2)
      expect(mockSitConfig_updateSection.mock.calls[0][0]).toBe('remote.origin')
      expect(mockSitConfig_updateSection.mock.calls[0][1]).toEqual({ "fetch": "+refs/heads/*:refs/remotes/origin/*", "type": "GoogleSpreadSheet", "url": "https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=0" })
      expect(mockSitConfig_updateSection.mock.calls[1][0]).toBe('branch.master')
      expect(mockSitConfig_updateSection.mock.calls[1][1]).toEqual({ "merge": "refs/heads/master", "remote": "origin" })

      expect(mockModel__writeSyncFile).toHaveBeenCalledTimes(2)
      expect(mockModel__writeSyncFile.mock.calls[0][0]).toBe('refs/heads/master')
      expect(mockModel__writeSyncFile.mock.calls[0][1]).toBe('953b3794394d6b48d8690bc5e53aa2ffe2133035')
      expect(mockModel__writeSyncFile.mock.calls[1][0]).toBe('refs/remotes/origin/HEAD')
      expect(mockModel__writeSyncFile.mock.calls[1][1]).toBe('ref: refs/remotes/origin/master')

      expect(mockModel__writeLog).toHaveBeenCalledTimes(3)
      expect(mockModel__writeLog.mock.calls[0][0]).toBe('logs/refs/heads/master')
      expect(mockModel__writeLog.mock.calls[0]).toEqual(["logs/refs/heads/master", "0000000000000000000000000000000000000000", "953b3794394d6b48d8690bc5e53aa2ffe2133035", "clone: from https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=0"])
      expect(mockModel__writeLog.mock.calls[1][0]).toBe('logs/refs/remotes/origin/HEAD')
      expect(mockModel__writeLog.mock.calls[1]).toEqual(["logs/refs/remotes/origin/HEAD", "0000000000000000000000000000000000000000", "953b3794394d6b48d8690bc5e53aa2ffe2133035", "clone: from https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=0"])
      expect(mockModel__writeLog.mock.calls[2][0]).toBe('logs/HEAD')
      expect(mockModel__writeLog.mock.calls[2]).toEqual(["logs/HEAD", "0000000000000000000000000000000000000000", "953b3794394d6b48d8690bc5e53aa2ffe2133035", "clone: from https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=0"])

      expect(writeSyncFile).toHaveBeenCalledTimes(1)
      expect(writeSyncFile.mock.calls[0][0]).toBe('./test/dist/test_data.csv')
      expect(writeSyncFile.mock.calls[0][1]).toBe('日本語,英語,キー\nこんにちは,hello,greeting.hello\nさようなら,good_bye,greeting.good_bye\n歓迎します,wellcome,greeting.welcome\nおやすみ,good night,greeting.good_night')
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
        model.localRepo = './test/sandbox/.sit'
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
      expect(model.beforeHEADHash()).toEqual('953b3794394d6b48d8690bc5e53aa2ffe2133035')
    })
  })

  describe('#afterHEADHash', () => {
    it('should return correctly', () => {
      const sha1 = '5b1cf86e97c6633e9a2dd85567e33d636dd3748a'
      const mockModel__add = jest.spyOn(model, '_add').mockReturnValue(sha1)

      expect(model.afterHEADHash()).toEqual(sha1)
      expect(mockModel__add).toHaveBeenCalledTimes(1)
      expect(mockModel__add.mock.calls[0][0]).toEqual('./test/dist/test_data.csv')
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
              ["さようなら", "good_bye", "greeting.good_bye"],
              ["歓迎します", "wellcome", "greeting.welcome"],
              ["おやすみ", "good night", "greeting.good_night"],
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
      const path = './test/sit.js'

      expect(model._add(path, {})).toEqual(sha1)
      expect(mockModel_hashObject).toHaveBeenCalledTimes(1)
      expect(mockModel_hashObject.mock.calls[0][0]).toEqual("./test/sit.js")
      expect(mockModel_hashObject.mock.calls[0][1]).toEqual({ "type": "blob", "write": true })
    })
  })

  describe('#catFile', () => {
    describe('when name is existed sha1', () => {
      it('should return correctly', (done) => {
        const name = '953b379'

        model.catFile(name)
          .then(obj => {
            expect(obj.serialize().toString()).toEqual('日本語,英語,キー\nこんにちは,hello,greeting.hello\nさようなら,good_bye,greeting.good_bye\n歓迎します,wellcome,greeting.welcome\nおやすみ,good night,greeting.good_night\n')
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
        const path = './test/dist/test_data.csv'
        const opts = { type: 'blob', write: false }

        expect(model.hashObject(path, opts)).toEqual('a7092c2cd3447d0f953e46b8cf81dd59e6745222')
      })
    })
  })

  describe('#hashObjectFromData', () => {
    it('should return correctly', () => {
      const data = '日本語,英語,キー\nこんにちは,hello,greeting.hello\n'
      const opts = { type: 'blob', write: false }

      expect(model.hashObjectFromData(data, opts)).toEqual('468ca150e0ff42e228189bd2f50e4a5d1439e900')
    })
  })

  describe('#branch', () => {
    // fail... why?
    describe("when do not specify nothiing", () => {
      it('should return correctly', () => {
        recursive.mockReturnValue(Promise.resolve(['files']))
        model.branch()

        expect(recursive).toHaveBeenCalledTimes(1)
        expect(recursive.mock.calls[0]).toEqual(["./test/localRepo/.sit/refs/heads"])
      })
    })

    describe("when specify 'all' option", () => {
      it('should return correctly', () => {
        recursive.mockReturnValue(Promise.resolve(['files']))
        model.branch({ all: true })

        expect(recursive).toHaveBeenCalledTimes(1)
        expect(recursive.mock.calls[0]).toEqual(["./test/localRepo/.sit/refs"])
      })
    })

    describe("when specify 'deleteBranch' option", () => {
      describe("when 'deleteBranch' is 'currentBranch'", () => {
        it('should return correctly', () => {
          console.error = jest.fn()

          model.branch({ deleteBranch: 'master' })
          expect(console.error.mock.calls[0]).toEqual(["error: Cannot delete branch 'master' checked out"])
          expect(console.error).toHaveBeenCalledTimes(1)
        })
      })

      // Why cannot spyOn _dleteSyncFile
      // https://github.com/facebook/jest/issues/6671
      describe("when 'deleteBranch' is not 'currentBranch' (success)", () => {
        it('should return correctly', () => {
          const mockModel__objectFind = jest.spyOn(model, '_objectFind').mockReturnValue(Promise.resolve('success'))
          jest.spyOn(model, '_deleteSyncFile').mockReturnValue(model)
          model.branch({ deleteBranch: 'develop' })

          expect(mockModel__objectFind).toHaveBeenCalledTimes(1)
        })
      })

      describe("wheen 'deleteBranch' is not 'currentBranch' (failure)", () => {
        it('should return correctly', () => {
          const mockModel__objectFind = jest.spyOn(model, '_objectFind').mockReturnValue(Promise.resolve())
          jest.spyOn(model, '_deleteSyncFile').mockReturnValue(model)
          model.branch({ deleteBranch: 'donotexist' })

          expect(mockModel__objectFind).toHaveBeenCalledTimes(1)
        })
      })

      describe("when 'deleteBranch' is 'currentBranch' (failure)", () => {
        it('should return correctly', () => {
          console.error = jest.fn()
          model.branch({ deleteBranch: 'master' })

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
        const mockModel__objectFind = jest.spyOn(model, '_objectFind').mockReturnValue(Promise.resolve('a7092c2cd3447d0f953e46b8cf81dd59e6745222'))
        model.checkout('origin', 'test', {})

        expect(mockSitConfig_updateSection).toHaveBeenCalledTimes(1)
        expect(mockSitConfig_updateSection.mock.calls[0]).toEqual(["branch.test", { "merge": "refs/heads/test", "remote": "origin" }])

        expect(mockModel__fileCopySync).toHaveBeenCalledTimes(1)
        expect(mockModel__fileCopySync.mock.calls[0]).toEqual(["refs/remotes/origin/test", "refs/heads/test"])

        expect(mockModel__writeLog).toHaveBeenCalledTimes(1)
        expect(mockModel__writeLog.mock.calls[0]).toEqual(["logs/refs/heads/test", null, "a7092c2cd3447d0f953e46b8cf81dd59e6745222", "branch: Created from refs/remotes/origin/test"])

        // checkout test

        expect(mockModel__objectFind).toHaveBeenCalledTimes(1)
        expect(mockModel__objectFind.mock.calls[0]).toEqual(["test"])
      })
    })

    describe('when checkout new branch', () => {
      describe('when checkout branch is already exists', () => {
        it('should return correctly', () => {
          console.error = jest.fn()
          model.checkout(null, null, { branch: 'develop' })

          expect(console.error).toHaveBeenCalledTimes(1)
          expect(console.error.mock.calls[0]).toEqual(["fatal: A branch named 'develop' already exists."])
        })
      })

      describe('hwn checkout branch is new branch', () => {
        console.log = jest.fn()
        const mockModel__writeSyncFile = jest.spyOn(model, '_writeSyncFile').mockReturnValue(model)
        const mockModel__writeLog = jest.spyOn(model, '_writeLog').mockReturnValue(model)
        model.checkout(null, null, { branch: 'new_branch' })

        expect(mockModel__writeSyncFile).toHaveBeenCalledTimes(2)
        expect(mockModel__writeSyncFile.mock.calls[0]).toEqual(["HEAD", "ref: refs/heads/new_branch", false])
        expect(mockModel__writeSyncFile.mock.calls[1]).toEqual(["refs/heads/new_branch", "953b3794394d6b48d8690bc5e53aa2ffe2133035", false])

        expect(mockModel__writeLog).toHaveBeenCalledTimes(2)
        expect(mockModel__writeLog.mock.calls[0]).toEqual(["logs/HEAD", "953b3794394d6b48d8690bc5e53aa2ffe2133035", "953b3794394d6b48d8690bc5e53aa2ffe2133035", "checkout: moving from master to new_branch"])
        expect(mockModel__writeLog.mock.calls[1]).toEqual(["logs/refs/heads/new_branch", null, "953b3794394d6b48d8690bc5e53aa2ffe2133035", "branch: Created from HEAD"])

        expect(console.log).toHaveBeenCalledTimes(1)
        expect(console.log.mock.calls[0]).toEqual(["Switched to a new branch 'new_branch'"])
      })
    })
  })

  describe('#diff', () => {
    it('should return correctly', () => {
      const mockObj = new SitBlob(model, '1,2,3', 3)
      const mockModel_catFile = jest.spyOn(model, 'catFile').mockReturnValue(Promise.resolve(mockObj))
      model.diff()

      expect(mockModel_catFile).toHaveBeenCalledTimes(1)
      expect(mockModel_catFile.mock.calls[0]).toEqual(["953b3794394d6b48d8690bc5e53aa2ffe2133035"])
    })
  })

  describe('#status', () => {
    describe('when modify dist file', () => {
      it('should return correctly', () => {
        console.log = jest.fn()
        model.status()

        expect(console.log).toHaveBeenCalledTimes(1)
        expect(console.log.mock.calls[0]).toEqual(["modified: ./test/dist/test_data.csv"])
      })
    })

    describe('when do not modify dist file', () => {
      it('should return correctly', () => {
        console.log = jest.fn()
        const mockModel__refResolve = jest.spyOn(model, '_refResolve').mockReturnValue('953b3794394d6b48d8690bc5e53aa2ffe2133035')
        const mockModel_hashObject = jest.spyOn(model, 'hashObject').mockReturnValue('953b3794394d6b48d8690bc5e53aa2ffe2133035')
        model.status()

        expect(mockModel__refResolve).toHaveBeenCalledTimes(1)
        expect(mockModel__refResolve.mock.calls[0]).toEqual(["HEAD"])

        expect(mockModel_hashObject).toHaveBeenCalledTimes(1)
        expect(mockModel_hashObject.mock.calls[0]).toEqual(["./test/dist/test_data.csv", { "type": "blob" }])

        expect(console.log).toHaveBeenCalledTimes(1)
        expect(console.log.mock.calls[0]).toEqual(['On branch master\nnothing to commit'])
      })
    })
  })

  describe('#commit', () => {
    describe('when can commit', () => {
      it('should return correctly', () => {
        console.log = jest.fn()
        const mockModel__writeSyncFile = jest.spyOn(model, '_writeSyncFile').mockReturnValue(model)
        const mockModel__writeLog = jest.spyOn(model, '_writeLog').mockReturnValue(model)
        model.commit({ message: 'first commit' })

        expect(mockModel__writeSyncFile).toHaveBeenCalledTimes(3)
        expect(mockModel__writeSyncFile.mock.calls[0]).toEqual(["COMMIT_EDITMSG", "first commit"])
        expect(mockModel__writeSyncFile.mock.calls[1]).toEqual(["ORIG_HEAD", "953b3794394d6b48d8690bc5e53aa2ffe2133035"])
        expect(mockModel__writeSyncFile.mock.calls[2]).toEqual(["refs/heads/master", "a7092c2cd3447d0f953e46b8cf81dd59e6745222"])

        expect(mockModel__writeLog).toHaveBeenCalledTimes(2)
        expect(mockModel__writeLog.mock.calls[0]).toEqual(["logs/HEAD", "953b3794394d6b48d8690bc5e53aa2ffe2133035", "a7092c2cd3447d0f953e46b8cf81dd59e6745222", "commit first commit"])
        expect(mockModel__writeLog.mock.calls[1]).toEqual(["logs/refs/heads/master", "953b3794394d6b48d8690bc5e53aa2ffe2133035", "a7092c2cd3447d0f953e46b8cf81dd59e6745222", "commit first commit"])

        expect(console.log).toHaveBeenCalledTimes(1)
        expect(console.log.mock.calls[0]).toEqual(["[master a7092c2] first commit"])
      })
    })

    describe('when nothing that can commit', () => {
      it('should return correctly', () => {
        console.log = jest.fn()
        const mockModel__refResolve = jest.spyOn(model, '_refResolve').mockReturnValue('953b3794394d6b48d8690bc5e53aa2ffe2133035')
        const mockModel__add = jest.spyOn(model, '_add').mockReturnValue('953b3794394d6b48d8690bc5e53aa2ffe2133035')
        model.commit({ message: 'first commit' })

        expect(mockModel__refResolve).toHaveBeenCalledTimes(1)
        expect(mockModel__refResolve.mock.calls[0]).toEqual(["HEAD"])

        expect(mockModel__add).toHaveBeenCalledTimes(1)
        expect(mockModel__add.mock.calls[0]).toEqual(["./test/dist/test_data.csv", { "message": "first commit" }])

        expect(console.log).toHaveBeenCalledTimes(1)
        expect(console.log.mock.calls[0]).toEqual(['On branch master\nnothing to commit'])
      })
    })

    describe('when commit message is blank', () => {
      it('should return correctly', () => {
        console.error = jest.fn()
        model.commit()

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

        model.push('origin', 'develop', { HEADHash: '953b3794394d6b48d8690bc5e53aa2ffe2133035' })
          .then(result => {
            expect(result).toEqual({ "afterHash": "953b3794394d6b48d8690bc5e53aa2ffe2133035", "beforeHash": "0000000000000000000000000000000000000000" })

            expect(mockModel__writeLog).toHaveBeenCalledTimes(1)
            expect(mockModel__writeLog.mock.calls[0]).toEqual(["logs/refs/remotes/origin/develop", "0000000000000000000000000000000000000000", "953b3794394d6b48d8690bc5e53aa2ffe2133035", "update by push"])

            expect(mockModel__writeSyncFile).toHaveBeenCalledTimes(2)
            expect(mockModel__writeSyncFile.mock.calls[0]).toEqual(["refs/remotes/origin/develop", "953b3794394d6b48d8690bc5e53aa2ffe2133035"])
            expect(mockModel__writeSyncFile.mock.calls[1]).toEqual(["REMOTE_HEAD", "953b3794394d6b48d8690bc5e53aa2ffe2133035"])
            done()
          })
      })
    })

    describe('when push do not exist branch', () => {
      it('should return correctly', (done) => {
        model.push('origin', 'new_branch', { HEADHash: '953b3794394d6b48d8690bc5e53aa2ffe2133035' })
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
        model.fetch('a7092c2cd3447d0f953e46b8cf81dd59e6745222', null, 'develop')
          .catch(err => {
            expect(err.message).toEqual("repository is required")
            done()
          })
      })
    })

    describe('when branch is blank', () => {
      it('should return correctly', (done) => {
        model.fetch('a7092c2cd3447d0f953e46b8cf81dd59e6745222', 'origin', null)
          .catch(err => {
            expect(err.message).toEqual("branch is required")
            done()
          })
      })
    })

    describe('when cat fetch', () => {
      it('should return correctly', (done) => {
        const mockModel__writeSyncFile = jest.spyOn(model, '_writeSyncFile').mockReturnValue(model)
        const mockModel__writeLog = jest.spyOn(model, '_writeLog').mockReturnValue(model)
        model.fetch('a7092c2cd3447d0f953e46b8cf81dd59e6745222', 'origin', 'test')
          .then(result => {
            expect(result).toEqual({ "beforeHash": "a7092c2cd3447d0f953e46b8cf81dd59e6745222", "branchCount": 1, "remoteHash": "a7092c2cd3447d0f953e46b8cf81dd59e6745222" })

            expect(mockModel__writeSyncFile).toHaveBeenCalledTimes(2)
            expect(mockModel__writeSyncFile.mock.calls[0]).toEqual(["FETCH_HEAD", "a7092c2cd3447d0f953e46b8cf81dd59e6745222		branch 'test' of origin"])
            expect(mockModel__writeSyncFile.mock.calls[1]).toEqual(["refs/remotes/origin/test", "a7092c2cd3447d0f953e46b8cf81dd59e6745222"])

            expect(mockModel__writeLog).toHaveBeenCalledTimes(1)
            expect(mockModel__writeLog.mock.calls[0]).toEqual(["logs/refs/remotes/origin/test", "a7092c2cd3447d0f953e46b8cf81dd59e6745222", "a7092c2cd3447d0f953e46b8cf81dd59e6745222", "fetch origin test: fast-forward"])
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
        const mockModel__isExistFile = jest.spyOn(model, '_isExistFile').mockReturnValue(false)
        model.merge(null, null, { continue: true })

        expect(mockModel__isExistFile).toHaveBeenCalledTimes(1)
        expect(mockModel__isExistFile.mock.calls[0]).toEqual(["MERGE_HEAD"])

        expect(console.error).toHaveBeenCalledTimes(1)
        expect(console.error.mock.calls[0]).toEqual(["fatal: There is no merge in progress (MERGE_HEAD missing)"])
      })
    })
  })
})
