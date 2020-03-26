/* eslint-disable  camelcase, import/no-unresolved */


const SitRepo = require('../SitRepo');
const SitConfig = require('@repos/SitConfig');
const SitBlob = require('@repos/objects/SitBlob');
const SitCommit = require('@repos/objects/SitCommit');
const editor = require('@utils/editor');
const opener = require('opener');

const {
  writeSyncFile,
  rmDirSync,
  recursive,
  mkdirSyncRecursive,
} = require('@utils/file');

const {
  colorize,
} = require('@main/utils/string');

// https://stackoverflow.com/questions/39755439/how-to-mock-imported-named-function-in-jest-when-module-is-unmocked
jest.mock('@utils/file', () => (
  {
    ...(jest.requireActual('@utils/file')),
    writeSyncFile: jest.fn(),
    rmDirSync: jest.fn(),
    recursive: jest.fn(),
    mkdirSyncRecursive: jest.fn(),
  }
));

jest.mock('@utils/editor');
jest.mock('opener');

const mockMoment_format = jest.fn();
jest.mock('moment', () => {
  return jest.fn().mockImplementation(() => {
    return {
      format: mockMoment_format,
    };
  });
});

const fs = require('fs');

describe('SitRepo', () => {
  const model = new SitRepo();
  const oldLocalRepo = model.localRepo;
  const oldDistFilePath = model.distFilePath;

  afterEach(() => {
    jest.restoreAllMocks();
    model.localRepo = oldLocalRepo;
    model.distFilePath = oldDistFilePath;
  });

  describe('#init', () => {
    describe('when localRepo exist', () => {
      it('should return correctly', () => {
        model.localRepo = 'test/localRepo/.sit';
        expect(model.init()).toEqual(false);
      });
    });

    describe('when localRepo do not exist', () => {
      it('should return correctly', () => {
        model.localRepo = 'test/sandbox/.sit';
        const mockModel__mkdirSyncRecursive = jest.spyOn(model, '_mkdirSyncRecursive').mockReturnValue(model);
        const mockModel__writeSyncFile = jest.spyOn(model, '_writeSyncFile').mockReturnValue(model);
        const mockModel__createDistFile = jest.spyOn(model, '_createDistFile').mockReturnValueOnce(true);
        const data = ['日本語', '英語', 'キー'];
        expect(model.init({ data })).toEqual(true);

        expect(mockModel__mkdirSyncRecursive).toHaveBeenCalledTimes(6);
        expect(mockModel__mkdirSyncRecursive.mock.calls[0]).toEqual([]);
        expect(mockModel__mkdirSyncRecursive.mock.calls[1]).toEqual(['refs/heads']);
        expect(mockModel__mkdirSyncRecursive.mock.calls[2]).toEqual(['refs/remotes']);
        expect(mockModel__mkdirSyncRecursive.mock.calls[3]).toEqual(['objects']);
        expect(mockModel__mkdirSyncRecursive.mock.calls[4]).toEqual(['logs/refs/heads']);
        expect(mockModel__mkdirSyncRecursive.mock.calls[5]).toEqual(['logs/refs/remotes']);

        expect(mockModel__writeSyncFile).toHaveBeenCalledTimes(2);
        expect(mockModel__writeSyncFile.mock.calls[0]).toEqual(['HEAD', 'ref: refs/heads/master', true]);
        expect(mockModel__writeSyncFile.mock.calls[1]).toEqual(['config', '', true]);

        expect(writeSyncFile).toHaveBeenCalledTimes(1);
        expect(writeSyncFile.mock.calls[0]).toEqual(['./test/homeDir/.sitconfig', '', true]);

        expect(mockModel__createDistFile).toHaveBeenCalledTimes(1);
        expect(mockModel__createDistFile.mock.calls[0]).toEqual([['日本語', '英語', 'キー']]);
      });
    });
  });

  describe('#rollback', () => {
    describe('when localRepo exist', () => {
      it('should return correctly', () => {
        model.localRepo = 'test/localRepo/.sit';
        model.rollback();
        expect(rmDirSync).toHaveBeenCalledTimes(1);
      });
    });

    // https://stackoverflow.com/questions/49096093/how-do-i-test-a-jest-console-log
    describe('when localRepo do not exist', () => {
      it('should return correctly', () => {
        model.localRepo = 'test/sandbox/.sit';
        console.log = jest.fn();
        model.rollback();

        expect(rmDirSync).not.toHaveBeenCalled();
        expect(console.log.mock.calls[0][0]).toBe('Do not exist local repo: test/sandbox/.sit');
      });
    });
  });

  describe('#clone', () => {
    describe('when distDir exist', () => {
      it('should return correctly', () => {
        model.localRepo = 'test/sandbox/.sit';
        const mockModel__writeSyncFile = jest.spyOn(model, '_writeSyncFile').mockReturnValue(model);
        const mockModel__writeLog = jest.spyOn(model, '_writeLog').mockReturnValue(model);
        const mockModel__createDistFile = jest.spyOn(model, '_createDistFile').mockReturnValueOnce(true);
        const mockModel__createMergeCommit = jest.spyOn(model, '_createMergeCommit').mockReturnValueOnce('4e2b7c47eb492ab07c5d176dccff3009c1ebc79b');
        const mockSitConfig_updateSection = jest.fn();
        SitConfig.prototype.updateSection = mockSitConfig_updateSection;

        model.clone(
          'origin',
          'https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=0',
          '4e2b7c47eb492ab07c5d176dccff3009c1ebc79b',
          [
            ['日本語', '英語', 'キー'],
            ['こんにちは', 'hello', 'greetiing.hello'],
          ],
          { type: 'GoogleSpreadSheet' },
        );
        expect(mockSitConfig_updateSection).toHaveBeenCalledTimes(2);
        expect(mockSitConfig_updateSection.mock.calls[0][0]).toBe('remote.origin');
        expect(mockSitConfig_updateSection.mock.calls[0][1]).toEqual({ fetch: '+refs/heads/*:refs/remotes/origin/*', type: 'GoogleSpreadSheet', url: 'https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=0' });
        expect(mockSitConfig_updateSection.mock.calls[1][0]).toBe('branch.master');
        expect(mockSitConfig_updateSection.mock.calls[1][1]).toEqual({ merge: 'refs/heads/master', remote: 'origin' });

        expect(mockModel__writeSyncFile).toHaveBeenCalledTimes(2);
        expect(mockModel__writeSyncFile.mock.calls[0][0]).toBe('refs/heads/master');
        expect(mockModel__writeSyncFile.mock.calls[0][1]).toBe('4e2b7c47eb492ab07c5d176dccff3009c1ebc79b');
        expect(mockModel__writeSyncFile.mock.calls[1][0]).toBe('refs/remotes/origin/HEAD');
        expect(mockModel__writeSyncFile.mock.calls[1][1]).toBe('ref: refs/remotes/origin/master');

        expect(mockModel__writeLog).toHaveBeenCalledTimes(3);
        expect(mockModel__writeLog.mock.calls[0][0]).toBe('logs/refs/heads/master');
        expect(mockModel__writeLog.mock.calls[0]).toEqual(['logs/refs/heads/master', '0000000000000000000000000000000000000000', '4e2b7c47eb492ab07c5d176dccff3009c1ebc79b', 'clone: from https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=0']);
        expect(mockModel__writeLog.mock.calls[1][0]).toBe('logs/refs/remotes/origin/HEAD');
        expect(mockModel__writeLog.mock.calls[1]).toEqual(['logs/refs/remotes/origin/HEAD', '0000000000000000000000000000000000000000', '4e2b7c47eb492ab07c5d176dccff3009c1ebc79b', 'clone: from https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=0']);
        expect(mockModel__writeLog.mock.calls[2][0]).toBe('logs/HEAD');
        expect(mockModel__writeLog.mock.calls[2]).toEqual(['logs/HEAD', '0000000000000000000000000000000000000000', '4e2b7c47eb492ab07c5d176dccff3009c1ebc79b', 'clone: from https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=0']);

        expect(mockModel__createDistFile).toHaveBeenCalledTimes(1);
        expect(mockModel__createDistFile.mock.calls[0][0]).toEqual([
          ['日本語', '英語', 'キー'],
          ['こんにちは', 'hello', 'greetiing.hello'],
        ]);
        expect(mockModel__createDistFile.mock.calls[0][1]).toEqual(true);

        expect(mockModel__createMergeCommit).toHaveBeenCalledTimes(1);
        expect(mockModel__createMergeCommit.mock.calls[0]).toEqual(['4e2b7c47eb492ab07c5d176dccff3009c1ebc79b', '0000000000000000000000000000000000000000', 'master', 'GoogleSpreadSheet']);
      });
    });

    describe('when distDir do not exist', () => {
      it('should return correctly', () => {
        model.localRepo = 'test/sandbox/.sit';
        model.distFilePath = 'do_not_exist/test_data.csv';

        jest.spyOn(model, '_writeSyncFile').mockReturnValue(model);
        jest.spyOn(model, '_writeLog').mockReturnValue(model);
        const mockSitConfig_updateSection = jest.fn();
        const mockModel__createMergeCommit = jest.spyOn(model, '_createMergeCommit').mockReturnValueOnce('4e2b7c47eb492ab07c5d176dccff3009c1ebc79b');
        SitConfig.prototype.updateSection = mockSitConfig_updateSection;

        model.clone(
          'origin',
          'https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=0',
          '4e2b7c47eb492ab07c5d176dccff3009c1ebc79b',
          '日本語,英語,キー\nこんにちは,hello,greeting.hello\nさようなら,good_bye,greeting.good_bye\n歓迎します,wellcome,greeting.welcome\nおやすみ,good night,greeting.good_night',
          { type: 'GoogleSpreadSheet' },
        );
        expect(mkdirSyncRecursive).toHaveBeenCalledTimes(1);
        expect(mkdirSyncRecursive.mock.calls[0][0]).toEqual('do_not_exist');

        expect(mockModel__createMergeCommit).toHaveBeenCalledTimes(1);
        expect(mockModel__createMergeCommit.mock.calls[0]).toEqual(['4e2b7c47eb492ab07c5d176dccff3009c1ebc79b', '0000000000000000000000000000000000000000', 'master', 'GoogleSpreadSheet']);
      });
    });
  });

  describe('#isLocalRepo', () => {
    describe('when localRepo exist', () => {
      it('should return correctly', () => {
        expect(model.isLocalRepo()).toEqual(true);
      });
    });

    describe('when localRepo do not exist', () => {
      it('should return correctly', () => {
        model.localRepo = 'test/sandbox/.sit';
        expect(model.isLocalRepo()).toEqual(false);
      });
    });
  });

  describe('#beforeHEADHash', () => {
    it('should return correctly', () => {
      expect(model.beforeHEADHash()).toEqual('4e2b7c47eb492ab07c5d176dccff3009c1ebc79b');
    });
  });

  describe('#afterHEADHash', () => {
    it('should return correctly', () => {
      const sha1 = '5b1cf86e97c6633e9a2dd85567e33d636dd3748a';
      const mockModel__add = jest.spyOn(model, '_add').mockReturnValue(sha1);

      expect(model.afterHEADHash()).toEqual(sha1);
      expect(mockModel__add).toHaveBeenCalledTimes(1);
      expect(mockModel__add.mock.calls[0][0]).toEqual('test/dist/test_data.csv');
      expect(mockModel__add.mock.calls[0][1]).toEqual({});
    });
  });

  describe('#_HEADCSVData', () => {
    describe('when HEAD exist', () => {
      it('should return correctly', (done) => {
        const blobHash = '8b58f3891ae3e4d274972a39d27fd460aaeaa6cc';
        const mockModel__refBlob = jest.spyOn(model, '_refBlob').mockReturnValue(blobHash);

        model._HEADCSVData(csvData => {
          expect(csvData).toEqual(
            [
              ['日本語', '英語', 'キー'],
              ['こんにちは', 'hello', 'common.greeting.hello'],
            ],
          );

          expect(mockModel__refBlob).toHaveBeenCalledTimes(1);
          expect(mockModel__refBlob.mock.calls[0]).toEqual(['HEAD']);
          done();
        });
      });
    });
  });

  describe('#_add', () => {
    it('should return correctly', () => {
      const sha1 = '5b1cf86e97c6633e9a2dd85567e33d636dd3748a';
      const mockModel_hashObject = jest.spyOn(model, 'hashObject').mockReturnValue(sha1);
      const path = 'test/sit.js';

      expect(model._add(path, {})).toEqual(sha1);
      expect(mockModel_hashObject).toHaveBeenCalledTimes(1);
      expect(mockModel_hashObject.mock.calls[0][0]).toEqual('test/sit.js');
      expect(mockModel_hashObject.mock.calls[0][1]).toEqual({ type: 'blob', write: true });
    });
  });

  describe('#catFile', () => {
    describe('when name is existed sha1', () => {
      it('should return correctly', (done) => {
        const name = '8b58f38';

        model.catFile(name)
          .then(obj => {
            expect(obj.serialize().toString()).toEqual('日本語,英語,キー\nこんにちは,hello,common.greeting.hello');
            done();
          });
      });
    });

    describe('when name do not exists', () => {
      it('should return correctly', (done) => {
        const name = 'hogefuga';

        model.catFile(name).catch(err => {
          expect(err.message).toEqual("error: pathspec 'hogefuga' did not match any file(s) known to sit");
          done();
        });
      });
    });
  });

  describe('#hashObject', () => {
    describe('when path exist', () => {
      it('should return correctly', () => {
        const path = 'test/dist/test_data.csv';
        const opts = { type: 'blob', write: false };

        expect(model.hashObject(path, opts)).toEqual('2938ad2ab5722adf9b48ff5bac74989eaa2d144c');
      });
    });
  });

  describe('#hashObjectFromData', () => {
    it('should return correctly', () => {
      const data = '日本語,英語,キー\nこんにちは,hello,greeting.hello\n';
      const opts = { type: 'blob', write: false };

      expect(model.hashObjectFromData(data, opts)).toEqual('b0122f0795b0be80d51a7ff6946f00bf0300e723');
    });
  });

  // (node:48137) UnhandledPromiseRejectionWarning: Error: process.exit() was called.
  describe('#branch', () => {
    describe('when do not specify nothiing', () => {
      it('should return correctly', () => {
        recursive.mockReturnValueOnce(Promise.resolve(['files']));
        model.branch();

        expect(recursive).toHaveBeenCalledTimes(1);
        expect(recursive.mock.calls[0]).toEqual(['test/localRepo/.sit/refs/heads']);
      });
    });

    describe("when specify 'all' option", () => {
      it('should return correctly', () => {
        recursive.mockReturnValueOnce(Promise.resolve(['files']));
        model.branch({ all: true });

        expect(recursive).toHaveBeenCalledTimes(1);
        expect(recursive.mock.calls[0]).toEqual(['test/localRepo/.sit/refs']);
      });
    });

    describe("when specify 'deleteBranch' option", () => {
      describe("when 'deleteBranch' is 'currentBranch'", () => {
        it('should return correctly', () => {
          console.error = jest.fn();
          jest.spyOn(process, 'exit').mockImplementation(() => {
            throw new Error('process.exit() was called.');
          });

          expect(() => model.branch({ deleteBranch: 'master' })).toThrow('process.exit() was called.');
          expect(console.error.mock.calls[0]).toEqual(["error: Cannot delete branch 'master' checked out"]);
          expect(console.error).toHaveBeenCalledTimes(1);
        });
      });

      // Why cannot spyOn _dleteSyncFile
      // https://github.com/facebook/jest/issues/6671
      describe("when 'deleteBranch' is not 'currentBranch' (success)", () => {
        it('should return correctly', () => {
          const mockModel__objectFind = jest.spyOn(model, '_objectFind').mockReturnValueOnce(Promise.resolve('success'));
          jest.spyOn(model, '_deleteSyncFile').mockReturnValue(model);
          model.branch({ deleteBranch: 'develop' });

          expect(mockModel__objectFind).toHaveBeenCalledTimes(1);
        });
      });

      // (node:48137) UnhandledPromiseRejectionWarning: Error: process.exit() was called.
      describe("wheen 'deleteBranch' is not 'currentBranch' (failure)", () => {
        it('should return correctly', () => {
          const mockModel__objectFind = jest.spyOn(model, '_objectFind').mockReturnValueOnce(Promise.resolve(null));
          jest.spyOn(model, '_deleteSyncFile').mockReturnValue(model);
          console.error = jest.fn();
          jest.spyOn(process, 'exit').mockImplementation(() => {
            throw new Error('process.exit() was called.');
          });

          model.branch({ deleteBranch: 'donotexist' });
          // https://github.com/facebook/jest/issues/6671#issuecomment-404171584
          // Mock information of processing in promise cannot be taken
          // expect(() => model.branch({ deleteBranch: 'donotexist' })).toThrow('process.exit() was called.')
          expect(mockModel__objectFind).toHaveBeenCalledTimes(1);
        });
      });

      describe("when 'deleteBranch' is 'currentBranch' (failure)", () => {
        it('should return correctly', () => {
          console.error = jest.fn();
          jest.spyOn(process, 'exit').mockImplementation(() => {
            throw new Error('process.exit() was called.');
          });

          expect(() => model.branch({ deleteBranch: 'master' })).toThrow('process.exit() was called.');
          expect(console.error).toHaveBeenCalledTimes(1);
          expect(console.error.mock.calls[0]).toEqual(["error: Cannot delete branch 'master' checked out"]);
        });
      });
    });

    describe("when specify 'moveBranch' option", () => {
      it('should return correctly', () => {
        const mockModel__fileCopySync = jest.spyOn(model, '_fileCopySync').mockReturnValue(model);
        const mockModel__writeLog = jest.spyOn(model, '_writeLog').mockReturnValue(model);
        const mockModel__writeSyncFile = jest.spyOn(model, '_writeSyncFile').mockReturnValue(model);
        const mockModel__deleteSyncFile = jest.spyOn(model, '_deleteSyncFile').mockReturnValue(model);

        model.branch({ moveBranch: 'new_branch' });
        expect(mockModel__fileCopySync).toHaveBeenCalledTimes(2);
        expect(mockModel__fileCopySync.mock.calls[0]).toEqual(['refs/heads/master', 'refs/heads/new_branch']);
        expect(mockModel__fileCopySync.mock.calls[1]).toEqual(['logs/refs/heads/master', 'logs/refs/heads/new_branch']);

        expect(mockModel__writeLog).toHaveBeenCalledTimes(1);
        expect(mockModel__writeLog.mock.calls[0]).toEqual(['logs/HEAD', '4e2b7c47eb492ab07c5d176dccff3009c1ebc79b', '4e2b7c47eb492ab07c5d176dccff3009c1ebc79b', 'Branch: renamed refs/heads/origin to refs/heads/new_branch']);

        expect(mockModel__writeSyncFile).toHaveBeenCalledTimes(1);
        expect(mockModel__writeSyncFile.mock.calls[0]).toEqual(['HEAD', 'ref: refs/heads/new_branch', false]);

        expect(mockModel__deleteSyncFile).toHaveBeenCalledTimes(2);
        expect(mockModel__deleteSyncFile.mock.calls[0]).toEqual(['refs/heads/master']);
        expect(mockModel__deleteSyncFile.mock.calls[1]).toEqual(['logs/refs/heads/master']);
      });
    });
  });

  describe('#checkout', () => {
    describe('when checkout local branch', () => {
      describe('when currentBranch is checkout branch', () => {
        it('should return correctly', () => {
          console.log = jest.fn();
          model.checkout(null, 'master', {});

          expect(console.log).toHaveBeenCalledTimes(1);
          expect(console.log.mock.calls[0]).toEqual(["Already on 'master'"]);
        });
      });

      describe('when currentBranch is not checkout branch', () => {
        it('should return correctly', () => {
          const blobHash = '8b58f3891ae3e4d274972a39d27fd460aaeaa6cc';
          const commitData = `\
blob ${blobHash}
parent 0000000000000000000000000000000000000000
author yukihirop <te108186@gmail.com> 1582125758897 +0900
committer GoogleSpreadSheet <noreply@googlespreadsheet.com> 1582125758897 +0900

Merge from GoogleSpreadSheet/develop`;
          const mockObj = new SitCommit(model, commitData, 238);
          const mockModel__objectFind = jest.spyOn(model, '_objectFind').mockReturnValueOnce(Promise.resolve('success'));
          jest.spyOn(model, '_writeSyncFile').mockReturnValue(model);
          jest.spyOn(model, '_writeLog').mockReturnValue(model);
          jest.spyOn(model, '_refBlobFromCommitHash').mockReturnValueOnce(blobHash);
          jest.spyOn(model, 'catFile').mockReturnValueOnce(Promise.resolve(mockObj));
          model.checkout(null, 'develop', {});

          expect(mockModel__objectFind).toHaveBeenCalledTimes(1);
          expect(mockModel__objectFind.mock.calls[0]).toEqual(['develop']);
        });
      });
    });

    describe('when checkout from remote branch', () => {
      describe('when remote branch exists', () => {
        it('should return correctly', () => {
          const mockSitConfig_updateSection = jest.fn();
          SitConfig.prototype.updateSection = mockSitConfig_updateSection;
          const mockModel__fileCopySync = jest.spyOn(model, '_fileCopySync').mockReturnValue(model);
          const mockModel__writeLog = jest.spyOn(model, '_writeLog').mockReturnValue(model);
          const mockModel__objectFind = jest.spyOn(model, '_objectFind').mockReturnValueOnce(Promise.resolve('1aee2e5b6b3c9b571f867b1ff6cbde3a060d6d16'));
          model.checkout('origin', 'test', {});

          expect(mockSitConfig_updateSection).toHaveBeenCalledTimes(1);
          expect(mockSitConfig_updateSection.mock.calls[0]).toEqual(['branch.test', { merge: 'refs/heads/test', remote: 'origin' }]);

          expect(mockModel__fileCopySync).toHaveBeenCalledTimes(1);
          expect(mockModel__fileCopySync.mock.calls[0]).toEqual(['refs/remotes/origin/test', 'refs/heads/test']);

          expect(mockModel__writeLog).toHaveBeenCalledTimes(1);
          expect(mockModel__writeLog.mock.calls[0]).toEqual(['logs/refs/heads/test', null, '4e2b7c47eb492ab07c5d176dccff3009c1ebc79b', 'branch: Created from refs/remotes/origin/test']);

          // checkout test (2 times)

          expect(mockModel__objectFind).toHaveBeenCalledTimes(1);
          expect(mockModel__objectFind.mock.calls[0]).toEqual(['test']);
        });
      });

      describe('when remote branch do not exists', () => {
        it('should return correctly', () => {
          jest.spyOn(model, '_isExistFile').mockReturnValueOnce(false);
          console.error = jest.fn();
          jest.spyOn(process, 'exit').mockImplementation(() => {
            throw new Error('process.exit() was called.');
          });

          expect(() => model.checkout('origin', 'do_not_exist', {})).toThrow('process.exit() was called.');
          expect(console.error).toHaveBeenCalledTimes(1);
          expect(console.error.mock.calls[0]).toEqual(["error: pathspec 'do_not_exist' did not match any file(s) known to sit"]);
        });
      });
    });

    describe('when checkout new branch', () => {
      describe('when checkout branch is already exists', () => {
        it('should return correctly', () => {
          console.error = jest.fn();
          jest.spyOn(process, 'exit').mockImplementation(() => {
            throw new Error('process.exit() was called.');
          });

          expect(() => model.checkout(null, null, { branch: 'develop' })).toThrow('process.exit() was called.');
          expect(console.error).toHaveBeenCalledTimes(1);
          expect(console.error.mock.calls[0]).toEqual(["fatal: A branch named 'develop' already exists."]);
        });
      });

      describe('when checkout branch is new branch', () => {
        describe('when branch name is valid', () => {
          it('should return correctly', () => {
            console.log = jest.fn();
            const mockModel__writeSyncFile = jest.spyOn(model, '_writeSyncFile').mockReturnValue(model);
            const mockModel__writeLog = jest.spyOn(model, '_writeLog').mockReturnValue(model);

            model.checkout(null, null, { branch: 'new_branch' });

            expect(mockModel__writeSyncFile).toHaveBeenCalledTimes(2);
            expect(mockModel__writeSyncFile.mock.calls[0]).toEqual(['HEAD', 'ref: refs/heads/new_branch', false]);
            expect(mockModel__writeSyncFile.mock.calls[1]).toEqual(['refs/heads/new_branch', '4e2b7c47eb492ab07c5d176dccff3009c1ebc79b', false]);

            expect(mockModel__writeLog).toHaveBeenCalledTimes(2);
            expect(mockModel__writeLog.mock.calls[0]).toEqual(['logs/HEAD', '4e2b7c47eb492ab07c5d176dccff3009c1ebc79b', '4e2b7c47eb492ab07c5d176dccff3009c1ebc79b', 'checkout: moving from master to new_branch']);
            expect(mockModel__writeLog.mock.calls[1]).toEqual(['logs/refs/heads/new_branch', null, '4e2b7c47eb492ab07c5d176dccff3009c1ebc79b', 'branch: Created from HEAD']);

            expect(console.log).toHaveBeenCalledTimes(1);
            expect(console.log.mock.calls[0]).toEqual(["Switched to a new branch 'new_branch'"]);
          });
        });

        describe('when branch name is invalid', () => {
          it('should return correctly', () => {
            console.error = jest.fn();
            jest.spyOn(process, 'exit').mockImplementation(() => {
              throw new Error('process.exit() was called.');
            });

            expect(() => model.checkout(null, null, { branch: '[pr] master...develop' })).toThrow('process.exit() was called.');
            expect(console.error).toHaveBeenCalledTimes(1);
            expect(console.error.mock.calls[0]).toEqual(["fatal: '[pr] master...develop' is not a valid branch name."]);
          });
        });
      });

      describe('when repoName do not exist', () => {
        it('should return correctly', () => {
          console.error = jest.fn();
          jest.spyOn(process, 'exit').mockImplementation(() => {
            throw new Error('process.exit() was called.');
          });

          expect(() => model.checkout('typo_origin', 'test')).toThrow('process.exit() was called.');
          expect(console.error).toHaveBeenCalledTimes(1);
          expect(console.error.mock.calls[0]).toEqual([`\
fatal: 'typo_origin' does not appear to be a sit repository
fatal: Could not read from remote repository.

Please make sure you have the correct access rights and the repository exists.`]);
        });
      });
    });
  });

  describe('#diff', () => {
    it('should return correctly', () => {
      const mockObj = new SitBlob(model, '1,2,3', 3);
      const blobHash = '8b58f3891ae3e4d274972a39d27fd460aaeaa6cc';
      const mockModel__refBlob = jest.spyOn(model, '_refBlob').mockReturnValue(blobHash);
      const mockModel_catFile = jest.spyOn(model, 'catFile').mockReturnValueOnce(Promise.resolve(mockObj));
      model.diff();

      expect(mockModel__refBlob).toHaveBeenCalledTimes(1);
      expect(mockModel__refBlob.mock.calls[0]).toEqual(['HEAD']);

      expect(mockModel_catFile).toHaveBeenCalledTimes(1);
      expect(mockModel_catFile.mock.calls[0]).toEqual(['8b58f3891ae3e4d274972a39d27fd460aaeaa6cc']);
    });
  });

  describe('#status', () => {
    describe('when modify dist file', () => {
      it('should return correctly', () => {
        console.log = jest.fn();
        model.status();

        expect(console.log).toHaveBeenCalledTimes(1);
        expect(console.log.mock.calls[0][0]).toEqual('\
On branch master\n\
nothing to commit');
      });
    });

    describe('when do not modify dist file', () => {
      it('should return correctly', () => {
        console.log = jest.fn();
        const mockModel__refResolve = jest.spyOn(model, '_refResolve').mockReturnValue('8b58f3891ae3e4d274972a39d27fd460aaeaa6cc');
        const mockModel_hashObject = jest.spyOn(model, 'hashObject').mockReturnValue('8b58f3891ae3e4d274972a39d27fd460aaeaa6cc');
        model.status();

        expect(mockModel__refResolve).toHaveBeenCalledTimes(1);
        expect(mockModel__refResolve.mock.calls[0]).toEqual(['HEAD']);

        expect(mockModel_hashObject).toHaveBeenCalledTimes(1);
        expect(mockModel_hashObject.mock.calls[0]).toEqual(['test/dist/test_data.csv', { type: 'blob' }]);

        expect(console.log).toHaveBeenCalledTimes(1);
        expect(console.log.mock.calls[0][0]).toEqual(`\
On branch master\n\

\t${colorize('modified: test/dist/test_data.csv', 'mark')}

no changes added to commit`);
      });
    });
  });

  describe('#commit', () => {
    describe('when can commit', () => {
      it('should return correctly', () => {
        console.log = jest.fn();
        const mockModel__writeSyncFile = jest.spyOn(model, '_writeSyncFile').mockReturnValue(model);
        const mockModel__writeLog = jest.spyOn(model, '_writeLog').mockReturnValue(model);
        const mockModel__createCommit = jest.spyOn(model, '_createCommit').mockReturnValueOnce('7463de958ff72479adf6c7d6e37c744cc9dc283a');
        model.commit({ message: 'first commit' });

        expect(mockModel__createCommit).toHaveBeenCalledTimes(1);
        expect(mockModel__createCommit.mock.calls[0]).toEqual(['2938ad2ab5722adf9b48ff5bac74989eaa2d144c', '4e2b7c47eb492ab07c5d176dccff3009c1ebc79b', 'first commit']);

        expect(mockModel__writeSyncFile).toHaveBeenCalledTimes(3);
        expect(mockModel__writeSyncFile.mock.calls[0]).toEqual(['COMMIT_EDITMSG', 'first commit']);
        expect(mockModel__writeSyncFile.mock.calls[1]).toEqual(['ORIG_HEAD', '4e2b7c47eb492ab07c5d176dccff3009c1ebc79b']);
        expect(mockModel__writeSyncFile.mock.calls[2]).toEqual(['refs/heads/master', '7463de958ff72479adf6c7d6e37c744cc9dc283a']);

        expect(mockModel__writeLog).toHaveBeenCalledTimes(2);
        expect(mockModel__writeLog.mock.calls[0]).toEqual(['logs/HEAD', '4e2b7c47eb492ab07c5d176dccff3009c1ebc79b', '7463de958ff72479adf6c7d6e37c744cc9dc283a', 'commit first commit']);
        expect(mockModel__writeLog.mock.calls[1]).toEqual(['logs/refs/heads/master', '4e2b7c47eb492ab07c5d176dccff3009c1ebc79b', '7463de958ff72479adf6c7d6e37c744cc9dc283a', 'commit first commit']);

        expect(console.log).toHaveBeenCalledTimes(1);
        expect(console.log.mock.calls[0]).toEqual(['[master 7463de9] first commit']);
      });
    });

    describe('when nothing that can commit', () => {
      it('should return correctly', () => {
        console.log = jest.fn();
        const mockModel__refResolve = jest.spyOn(model, '_refResolve').mockReturnValue('8b58f3891ae3e4d274972a39d27fd460aaeaa6cc');
        const mockModel__add = jest.spyOn(model, '_add').mockReturnValue('8b58f3891ae3e4d274972a39d27fd460aaeaa6cc');
        const mockModel__createCommit = jest.spyOn(model, '_createCommit').mockReturnValueOnce('8b58f3891ae3e4d274972a39d27fd460aaeaa6cc');
        model.commit({ message: 'first commit' });

        expect(mockModel__refResolve).toHaveBeenCalledTimes(1);
        expect(mockModel__refResolve.mock.calls[0]).toEqual(['HEAD']);

        expect(mockModel__add).toHaveBeenCalledTimes(1);
        expect(mockModel__add.mock.calls[0]).toEqual(['test/dist/test_data.csv', { message: 'first commit' }]);

        expect(mockModel__createCommit).toHaveBeenCalledTimes(1);
        expect(mockModel__createCommit.mock.calls[0]).toEqual(['8b58f3891ae3e4d274972a39d27fd460aaeaa6cc', '8b58f3891ae3e4d274972a39d27fd460aaeaa6cc', 'first commit']);

        expect(console.log).toHaveBeenCalledTimes(1);
        expect(console.log.mock.calls[0]).toEqual(['On branch master\nnothing to commit']);
      });
    });

    describe('when commit message is blank', () => {
      it('should return correctly', () => {
        console.error = jest.fn();
        jest.spyOn(process, 'exit').mockImplementation(() => {
          throw new Error('process.exit() was called.');
        });

        expect(() => model.commit()).toThrow('process.exit() was called.');
        expect(console.error).toHaveBeenCalledTimes(1);
        expect(console.error.mock.calls[0]).toEqual(['Need message to commit']);
      });
    });
  });

  describe('#push', () => {
    describe('when psuh exist branch', () => {
      it('should return correctly', (done) => {
        const mockModel__writeLog = jest.spyOn(model, '_writeLog').mockReturnValue(model);
        const mockModel__writeSyncFile = jest.spyOn(model, '_writeSyncFile').mockReturnValue(model);

        model.push('origin', 'develop', { HEADBlobHash: '8b58f3891ae3e4d274972a39d27fd460aaeaa6cc' })
          .then(result => {
            expect(result).toEqual({ afterHash: '4e2b7c47eb492ab07c5d176dccff3009c1ebc79b', beforeHash: '0000000000000000000000000000000000000000' });

            expect(mockModel__writeLog).toHaveBeenCalledTimes(1);
            expect(mockModel__writeLog.mock.calls[0]).toEqual(['logs/refs/remotes/origin/develop', '0000000000000000000000000000000000000000', '4e2b7c47eb492ab07c5d176dccff3009c1ebc79b', 'update by push']);

            expect(mockModel__writeSyncFile).toHaveBeenCalledTimes(2);
            expect(mockModel__writeSyncFile.mock.calls[0]).toEqual(['refs/remotes/origin/develop', '4e2b7c47eb492ab07c5d176dccff3009c1ebc79b']);
            expect(mockModel__writeSyncFile.mock.calls[1]).toEqual(['REMOTE_HEAD', '8b58f3891ae3e4d274972a39d27fd460aaeaa6cc']);
            done();
          });
      });
    });

    describe('when push do not exist branch', () => {
      it('should return correctly', (done) => {
        model.push('origin', 'new_branch', { HEADBlobHash: '8b58f3891ae3e4d274972a39d27fd460aaeaa6cc' })
          .catch(err => {
            expect(err.message).toEqual("error: src refspec unknown does not match any\nerror: failed to push some refs to 'origin'");
            done();
          });
      });
    });
  });

  describe('#fetch', () => {
    describe('when repoName is blank', () => {
      it('should return correctly', (done) => {
        model.fetch(null, 'develop', { remoteHash: '1aee2e5b6b3c9b571f867b1ff6cbde3a060d6d16' })
          .catch(err => {
            expect(err.message).toEqual('repository is required');
            done();
          });
      });
    });

    describe('when branch is blank', () => {
      it('should return correctly', (done) => {
        recursive.mockReturnValueOnce(Promise.resolve(
          ['test/localRepo/.sit/refs/remotes/origin/master',
            'test/localRepo/.sit/refs/remotes/origin/test',
          ],
        ));
        jest.spyOn(model, '_writeSyncFile').mockReturnValue(model);
        jest.spyOn(model, '_writeLog').mockReturnValue(model);
        jest.spyOn(model, '_createMergeCommit').mockReturnValue('03/577e30b394d4cafbbec22cc1a78b91b3e7c20b');

        model.fetch('origin', null, {
          prune: false,
          remoteRefs: { 'test-1': '1aee2e5b6b3c9b571f867b1ff6cbde3a060d6d16', 'test-2': '8b58f3891ae3e4d274972a39d27fd460aaeaa6cc' },
          remoteBranches: ['test-1', 'test-2'],
          type: 'GoogleSpreadSheet',
        }).then(() => {
          expect(recursive).toHaveBeenCalledTimes(1);
          expect(recursive.mock.calls[0]).toEqual(['test/localRepo/.sit/refs/remotes/origin']);
          done();
        });
      });
    });

    describe('when cat fetch', () => {
      it('should return correctly', (done) => {
        const mockModel__writeSyncFile = jest.spyOn(model, '_writeSyncFile').mockReturnValue(model);
        const mockModel__writeLog = jest.spyOn(model, '_writeLog').mockReturnValue(model);
        const mockModel__createMergeCommit = jest.spyOn(model, '_createMergeCommit')
          .mockReturnValueOnce('4e2b7c47eb492ab07c5d176dccff3009c1ebc79b')
          .mockReturnValueOnce('47af1af6722639322ccf17ea5f873d0e483c364f');
        model.fetch('origin', 'test', { remoteHash: '47af1af6722639322ccf17ea5f873d0e483c364f', type: 'GoogleSpreadSheet' })
          .then(result => {
            expect(result).toEqual({ beforeHash: '4e2b7c47eb492ab07c5d176dccff3009c1ebc79b', branchCount: 1, afterHash: '4e2b7c47eb492ab07c5d176dccff3009c1ebc79b' });

            expect(mockModel__writeSyncFile).toHaveBeenCalledTimes(2);
            expect(mockModel__writeSyncFile.mock.calls[0]).toEqual(['FETCH_HEAD', "4e2b7c47eb492ab07c5d176dccff3009c1ebc79b		branch 'test' of origin"]);
            expect(mockModel__writeSyncFile.mock.calls[1]).toEqual(['refs/remotes/origin/test', '4e2b7c47eb492ab07c5d176dccff3009c1ebc79b']);

            expect(mockModel__writeLog).toHaveBeenCalledTimes(1);
            expect(mockModel__writeLog.mock.calls[0]).toEqual(['logs/refs/remotes/origin/test', '4e2b7c47eb492ab07c5d176dccff3009c1ebc79b', '4e2b7c47eb492ab07c5d176dccff3009c1ebc79b', 'fetch origin test: fast-forward']);

            expect(mockModel__createMergeCommit).toHaveBeenCalledTimes(1);
            expect(mockModel__createMergeCommit.mock.calls[0]).toEqual(['47af1af6722639322ccf17ea5f873d0e483c364f', '4e2b7c47eb492ab07c5d176dccff3009c1ebc79b', 'test', 'GoogleSpreadSheet']);

            done();
          });
      });
    });

    describe('when fetch --prune', () => {
      it('should return correctly', (done) => {
        recursive.mockReturnValueOnce(Promise.resolve(
          ['test/localRepo/.sit/refs/remotes/origin/master',
            'test/localRepo/.sit/refs/remotes/origin/test',
          ],
        ));
        jest.spyOn(model, '_writeSyncFile').mockReturnValue(model);
        jest.spyOn(model, '_writeLog').mockReturnValue(model);
        jest.spyOn(model, '_deleteSyncFile').mockReturnValue(model);
        jest.spyOn(model, '_createMergeCommit').mockReturnValue('03/577e30b394d4cafbbec22cc1a78b91b3e7c20b');

        model.fetch('origin', null, {
          prune: true,
          remoteRefs: { 'test-1': '1aee2e5b6b3c9b571f867b1ff6cbde3a060d6d16', 'test-2': '8b58f3891ae3e4d274972a39d27fd460aaeaa6cc' },
          remoteBranches: ['test-1', 'test-2'],
          type: 'GoogleSpreadSheet',
        }).then(() => {
          expect(recursive).toHaveBeenCalledTimes(1);
          expect(recursive.mock.calls[0]).toEqual(['test/localRepo/.sit/refs/remotes/origin']);
          done();
        });
      });
    });
  });

  describe('#merge', () => {
    describe('when merge remote branch is not similar currentBranch', () => {
      it('should return correctly', () => {
        console.log = jest.fn();
        model.merge('origin', 'test', {});

        expect(console.log).toHaveBeenCalledTimes(1);
        expect(console.log.mock.calls[0]).toEqual(["The current branch is 'master'\nSorry... Only the same branch ('origin/master') on the remote can be merged"]);
      });
    });

    describe('when merge --continue when MERGE_HEAD is missing', () => {
      it('should return correctly', () => {
        console.error = jest.fn();
        jest.spyOn(process, 'exit').mockImplementation(() => {
          throw new Error('process.exit() was called.');
        });
        const mockModel__isExistFile = jest.spyOn(model, '_isExistFile').mockReturnValue(false);

        expect(() => model.merge(null, null, { continue: true })).toThrow('process.exit() was called.');

        expect(mockModel__isExistFile).toHaveBeenCalledTimes(1);
        expect(mockModel__isExistFile.mock.calls[0]).toEqual(['MERGE_HEAD']);

        expect(console.error).toHaveBeenCalledTimes(1);
        expect(console.error.mock.calls[0]).toEqual(['fatal: There is no merge in progress (MERGE_HEAD missing)']);
      });
    });

    describe('when merge --continue when MERGE_HEAD exist', () => {
      it('should return correctly', () => {
        console.log = jest.fn();
        const mockModel__writeSyncFile = jest.spyOn(model, '_writeSyncFile').mockReturnValueOnce(model);
        jest.spyOn(model, '_writeLog').mockReturnValueOnce(model);
        jest.spyOn(model, '_deleteSyncFile').mockReturnValueOnce(model);
        model.merge(null, null, { continue: true });

        expect(mockModel__writeSyncFile).toHaveBeenCalledTimes(1);
        expect(mockModel__writeSyncFile.mock.calls[0][0]).toEqual('COMMIT_EDITMSG');
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
`);

        expect(editor.open).toHaveBeenCalledTimes(1);
        expect(editor.open.mock.calls[0][0]).toEqual('test/localRepo/.sit/COMMIT_EDITMSG');
      });
    });

    describe('when merge origin test', () => {
      it('should return correctly', () => {
        console.error = jest.fn();
        jest.spyOn(process, 'exit').mockImplementation(() => {
          throw new Error('process.exit() was called.');
        });

        expect(() => model.merge('origin', 'master')).toThrow('process.exit() was called.');
        expect(console.error).toHaveBeenCalledTimes(1);
        expect(console.error.mock.calls[0]).toEqual([`\
error: Merging is not possible because you have unmerged files.
hint: Fix them up in the work tree, and then use 'sit merge --continue'
hint: as appropriate to mark resolution and make a commit.
fatal: Existing because of an unresolved conflict.`]);
      });
    });

    describe('when merge --abort when MERGE_HEAD exist', () => {
      it('should return correctly', () => {
        const obj = new SitBlob(model, '1,2,3', 3);
        const mockModel__writeLog = jest.spyOn(model, '_writeLog').mockReturnValue(model);
        const mockModel__deleteSyncFile = jest.spyOn(model, '_deleteSyncFile').mockReturnValue(model);
        const mockModel_catFile = jest.spyOn(model, 'catFile').mockReturnValueOnce(Promise.resolve(obj));
        model.merge(null, null, { abort: true });

        expect(mockModel__writeLog).toHaveBeenCalledTimes(1);
        expect(mockModel__writeLog.mock.calls[0]).toEqual(['logs/HEAD', '4e2b7c47eb492ab07c5d176dccff3009c1ebc79b', '4e2b7c47eb492ab07c5d176dccff3009c1ebc79b', 'reset: moving to HEAD']);

        expect(mockModel__deleteSyncFile).toHaveBeenCalledTimes(3);
        expect(mockModel__deleteSyncFile.mock.calls[0]).toEqual(['MERGE_MODE']);
        expect(mockModel__deleteSyncFile.mock.calls[1]).toEqual(['MERGE_MSG']);
        expect(mockModel__deleteSyncFile.mock.calls[2]).toEqual(['MERGE_HEAD']);

        expect(mockModel_catFile).toHaveBeenCalledTimes(1);
        expect(mockModel_catFile.mock.calls[0]).toEqual(['4e2b7c47eb492ab07c5d176dccff3009c1ebc79b']);
      });
    });

    describe('when merge --stat when MERGE_HEAD exist', () => {
      it('should return correctly', () => {
        console.error = jest.fn();
        jest.spyOn(process, 'exit').mockImplementation(() => {
          throw new Error('process.exit() was called.');
        });

        expect(() => model.merge(null, null, { stat: true })).toThrow('process.exit() was called.');
        expect(console.error).toHaveBeenCalledTimes(1);
        expect(console.error.mock.calls[0]).toEqual([`\
fatal: You have not concluded your merge (MERGE_HEAD exists)
Please, commit your changes before you merge.`]);
      });
    });

    describe('when merge --stat when MERGE_HEAD do not exist', () => {
      it('should return correctly', () => {
        console.log = jest.fn();
        const mockModel__isExistFile = jest.spyOn(model, '_isExistFile').mockReturnValue(false);
        model.merge(null, null, { stat: true });

        expect(mockModel__isExistFile).toHaveBeenCalledTimes(2);
        expect(mockModel__isExistFile.mock.calls[0]).toEqual(['MERGE_HEAD']);
        expect(mockModel__isExistFile.mock.calls[1]).toEqual(['MERGE_HEAD']);

        expect(console.log).toHaveBeenCalledTimes(1);
        expect(console.log.mock.calls[0]).toEqual(['Already up to date.']);
      });
    });

    describe('when merge origin master (conflict)', () => {
      it('should return correctly', () => {
        const obj = new SitBlob(model, '1,2,3', 3);
        jest.spyOn(model, '_writeSyncFile').mockReturnValue(model);
        jest.spyOn(model, '_writeLog').mockReturnValue(model);
        jest.spyOn(model, 'hashObjectFromData').mockReturnValue(true);
        const mockModel__isExistFile = jest.spyOn(model, '_isExistFile').mockReturnValue(false);
        const mockModel_catFile = jest.spyOn(model, 'catFile').mockReturnValueOnce(Promise.resolve(obj));
        model.merge('origin', 'master');

        expect(mockModel__isExistFile).toHaveBeenCalledTimes(1);
        expect(mockModel__isExistFile.mock.calls[0]).toEqual(['MERGE_HEAD']);

        expect(mockModel_catFile).toHaveBeenCalledTimes(1);
        expect(mockModel_catFile.mock.calls[0]).toEqual(['4e2b7c47eb492ab07c5d176dccff3009c1ebc79b']);
      });
    });
  });

  describe('#browseRemote', () => {
    describe('when repoName do not exist', () => {
      it('should return correctly', () => {
        model.browseRemote();

        expect(opener).toHaveBeenCalledTimes(1);
        expect(opener.mock.calls[0]).toEqual(['https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=0']);
      });
    });

    describe('when repoName exist', () => {
      it('should return correctly', () => {
        model.browseRemote('origin');

        expect(opener).toHaveBeenCalledTimes(1);
        expect(opener.mock.calls[0]).toEqual(['https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=0']);
      });
    });
  });

  describe('#remote', () => {
    const url = 'https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=0';

    describe('when subcommand is add', () => {
      it('should return correctly', () => {
        SitConfig.prototype.updateSection = jest.fn();
        model.remote('add', 'origin', url, { type: 'GoogleSpreadSheet' });

        expect(SitConfig.prototype.updateSection).toHaveBeenCalledTimes(1);
        expect(SitConfig.prototype.updateSection.mock.calls[0]).toEqual(['remote.origin', { fetch: '+refs/heads/*:refs/remotes/origin/*', type: 'GoogleSpreadSheet', url: 'https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=0' }]);
      });
    });

    describe('when subcommand is rm', () => {
      it('should return correctly', () => {
        SitConfig.prototype.updateSection = jest.fn();
        model.remote('rm', 'origin', url, { type: 'GoogleSpreadSheet' });

        expect(SitConfig.prototype.updateSection).toHaveBeenCalledTimes(1);
        expect(SitConfig.prototype.updateSection.mock.calls[0]).toEqual(['remote.origin', null]);
      });
    });

    describe('when subcommand is get-url', () => {
      it('should return correctly', () => {
        console.log = jest.fn();
        model.remote('get-url', 'origin', url, { type: 'GoogleSpreadSheet' });

        expect(console.log).toHaveBeenCalledTimes(1);
        expect(console.log.mock.calls[0]).toEqual(['https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=0']);
      });
    });

    describe('when subcommand is not-support', () => {
      it('should return correctly', () => {
        console.log = jest.fn();
        model.remote('not-support', 'origin', url, { type: 'GoogleSpreadSheet' });

        expect(console.log).toHaveBeenCalledTimes(1);
        expect(console.log.mock.calls[0]).toEqual(["Do not support subcommand: 'not-support'"]);
      });
    });
  });

  describe('#stash', () => {
    describe('when basic use (stash・stash save)', () => {
      describe('when no local change to save', () => {
        it('should return correctly', () => {
          console.log = jest.fn();
          const blobHEADHash = '2938ad2ab5722adf9b48ff5bac74989eaa2d144c';
          const mockModel__refBlob = jest.spyOn(model, '_refBlob').mockReturnValueOnce(blobHEADHash);
          const mockModel_hashObject = jest.spyOn(model, 'hashObject').mockReturnValueOnce(blobHEADHash);

          model.stash('save');

          expect(mockModel__refBlob).toHaveBeenCalledTimes(1);
          expect(mockModel__refBlob.mock.calls[0]).toEqual(['HEAD']);

          expect(mockModel_hashObject).toHaveBeenCalledTimes(1);
          expect(mockModel_hashObject.mock.calls[0]).toEqual(['test/dist/test_data.csv', { type: 'blob' }]);

          expect(console.log).toHaveBeenCalledTimes(1);
          expect(console.log.mock.calls[0]).toEqual(['No local changes to save']);
        });
      });

      describe('when local change to save', () => {
        it('should return correctly', () => {
          console.log = jest.fn();
          const blobHEADHash = '2938ad2ab5722adf9b48ff5bac74989eaa2d144c';
          const calculateBlobHash = 'bb1ae37be908abfcefd9bdd41626fe1b959098fb';
          const commitHEADHash = '47af1af6722639322ccf17ea5f873d0e483c364f';
          const commitData = `\
blob ${calculateBlobHash}
parent ${commitHEADHash}
author yukihirop <te108186@gmail.com> 1582125758897 +0900
committer yukihirop <te108186@gmail.com> 1583663621186 +0900

WIP on master: 47af1af Add good_bye`;

          const mockObj = new SitCommit(model, commitData, 238);

          const mockModel__refBlob = jest.spyOn(model, '_refBlob').mockReturnValueOnce(blobHEADHash);
          const mockModel_hashObject = jest.spyOn(model, 'hashObject').mockReturnValueOnce(calculateBlobHash);
          const mockModel__refResolve = jest.spyOn(model, '_refResolve').mockReturnValueOnce(commitHEADHash);

          const mockModel__writeSyncFile = jest.spyOn(model, '_writeSyncFile').mockReturnValue(model);
          const mockModel__writeLog = jest.spyOn(model, '_writeLog').mockReturnValue(model);
          const mockModel_catFile = jest.spyOn(model, 'catFile').mockReturnValueOnce(Promise.resolve(mockObj));

          const mockModel__createCommit = jest.spyOn(model, '_createCommit').mockReturnValueOnce('3df8acdb918794c2bda15ae45fec2c5929ca4929');

          model.stash('save');

          expect(mockModel__refBlob).toHaveBeenCalledTimes(1);
          expect(mockModel__refBlob.mock.calls[0]).toEqual(['HEAD']);

          expect(mockModel_hashObject).toHaveBeenCalledTimes(2);
          expect(mockModel_hashObject.mock.calls[0]).toEqual(['test/dist/test_data.csv', { type: 'blob' }]);
          expect(mockModel_hashObject.mock.calls[1]).toEqual(['test/dist/test_data.csv', { type: 'blob', write: true }]);

          expect(mockModel__refResolve).toHaveBeenCalledTimes(3);
          expect(mockModel__refResolve.mock.calls[0]).toEqual(['refs/stash']);
          expect(mockModel__refResolve.mock.calls[1]).toEqual(['HEAD']);
          expect(mockModel__refResolve.mock.calls[2]).toEqual(['refs/heads/master']);

          expect(mockModel__writeSyncFile).toHaveBeenCalledTimes(2);
          expect(mockModel__writeSyncFile.mock.calls[0]).toEqual(['ORIG_HEAD', '4e2b7c47eb492ab07c5d176dccff3009c1ebc79b']);
          expect(mockModel__writeSyncFile.mock.calls[1]).toEqual(['refs/stash', '3df8acdb918794c2bda15ae45fec2c5929ca4929', false]);

          expect(mockModel__writeLog).toHaveBeenCalledTimes(2);
          expect(mockModel__writeLog.mock.calls[0]).toEqual(['logs/HEAD', '4e2b7c47eb492ab07c5d176dccff3009c1ebc79b', '4e2b7c47eb492ab07c5d176dccff3009c1ebc79b', 'reset: moving to HEAD', false]);
          expect(mockModel__writeLog.mock.calls[1]).toEqual(['logs/refs/stash', '47af1af6722639322ccf17ea5f873d0e483c364f', '3df8acdb918794c2bda15ae45fec2c5929ca4929', 'WIP on master: 4e2b7c4 Add good_bye', false]);

          expect(mockModel_catFile).toHaveBeenCalledTimes(1);
          expect(mockModel_catFile.mock.calls[0]).toEqual(['2938ad2ab5722adf9b48ff5bac74989eaa2d144c']);

          expect(mockModel__createCommit).toHaveBeenCalledTimes(1);
          expect(mockModel__createCommit.mock.calls[0]).toEqual(['2938ad2ab5722adf9b48ff5bac74989eaa2d144c', '4e2b7c47eb492ab07c5d176dccff3009c1ebc79b', 'WIP on master: 4e2b7c4 Add good_bye']);
        });
      });
    });

    describe('stash apply', () => {
      describe('when conflict', () => {
        it('should return correctly', () => {
          console.log = jest.fn();
          const blobApplyHash = 'b1eaa1fa16ee7af570f33cf971c0d70ac3110d73';
          jest.spyOn(model, 'hashObjectFromData').mockReturnValueOnce(blobApplyHash);
          const mockModel_catFile = jest.spyOn(model, 'catFile');

          model.stash('apply');

          expect(mockModel_catFile).toHaveBeenCalledTimes(1);
          expect(mockModel_catFile.mock.calls[0]).toEqual(['b6f2667d13461fb6c521c1975018124db2e2d1e3']);

          //
          // Can't test because it's in a promise
          //
          // expect(mockModel_hashObjectFromData).toHaveBeenCalledTimes(1)
          // expect(mockModel_hashObjectFromData.mock.calls[0]).toEqual('')

          // expect(writeSyncFile).toHaveBeenCalledTimes(1)
          // expect(writeSyncFile.mock.calls[0]).toEqual('')

          // expect(console.log).toHaveBeenCalledTimes(1)
          // expect(console.log.mock.calls[0]).toEqual('Two-way-merging ../dist/test_data.csv\nCONFLICT (content): Merge conflict in ../dist/test_data.csv')
        });
      });
    });

    /**
     *
     *   ● SitRepo › #stash › stash list › should return correctly

        expect(received).toEqual(expected) // deep equality

        - Expected  - 1
        + Received  + 1

        - 3df8acd stash@{0}: WIP on master: 4e2b7c4 Add good_bye
        + 3df8acd stash@{0}: WIP on master: 4e2b7c4 Add good_bye
          00fa2d2 stash@{1}: On master: stash message

          1131 |         model.stash('list')
          1132 |         expect(console.log).toHaveBeenCalledTimes(1)
        > 1133 |         expect(console.log.mock.calls[0][0]).toEqual(`${colorize('3df8acd', 'info')} stash@{0}: WIP on master: 4e2b7c4 Add good_bye\n${colorize('00fa2d2', 'info')} stash@{1}: On master: stash message`)
              |                                              ^
          1134 |       })
          1135 |     })
          1136 |   })

          at Object.<anonymous> (src/main/__tests__/SitRepo.spec.js:1133:46)
     */
    describe('stash list', () => {
      xit('should return correctly', () => {
        console.log = jest.fn();

        model.stash('list');
        expect(console.log).toHaveBeenCalledTimes(1);
        expect(console.log.mock.calls[0][0]).toEqual(`${colorize('3df8acd', 'info')} stash@{0}: WIP on master: 4e2b7c4 Add good_bye\n${colorize('00fa2d2', 'info')} stash@{1}: On master: stash message`);
      });
    });

    describe('stash pop', () => {
      describe('when do not specify key', () => {
        // Can't test because mock of function inside promise
        xit('should return correctly', () => {
          console.log = jest.fn();
          const stashResult = `
日本語,英語,キー
こんにちは,hello,common.greeting.hello
さようなら,goodbye,common.greeting.good_bye
歓迎します,wellcome,common.greeting.welcome
おやすみ,good night,common.greeting.good_night`;
          const mockModel_hashObjectFromData = jest.spyOn(model, 'hashObjectFromData').mockReturnValueOnce('blob hash');
          const mockModel__writeSyncFile = jest.spyOn(model, '_writeSyncFile').mockReturnValueOnce(model);
          const mockModel__deleteLineLog = jest.spyOn(model, '_deleteLineLog').mockReturnValueOnce(model);

          model.stash('pop');

          expect(mockModel_hashObjectFromData).toHaveBeenCalledTimes(1);
          expect(mockModel_hashObjectFromData.mock.calls[0][0]).toEqual(stashResult);
          expect(mockModel_hashObjectFromData.mock.calls[0][1]).toEqual({ type: 'blob', write: true });

          expect(writeSyncFile).toHaveBeenCalledTimes(1);
          expect(writeSyncFile.mock.calls[0][0]).toEqual('./dist/test_data.csv');
          expect(writeSyncFile.mock.calls[0][1]).toEqual(stashResult);

          expect(mockModel__writeSyncFile).toHaveBeenCalledTimes(1);
          expect(mockModel__writeSyncFile.mock.calls[0][0]).toEqual('refs/stash');
          expect(mockModel__writeSyncFile.mock.calls[0][0]).toEqual('3df8acdb918794c2bda15ae45fec2c5929ca4929');

          expect(mockModel__deleteLineLog).toHaveBeenCalledTimes(1);
          expect(mockModel__deleteLineLog.mock.calls[0]).toEqual('logs/refs/stash', 'stash@{0}');

          expect(console.log).toHaveBeenCalledTimes(1);
          expect(console.log.mock.calls[0]).toEqual(`\
On branch master
Changes not staged for commit:

  modified:	../dist/test_data.csv

Dropped stash@{0} (00fa2d2f5b497b41e288f8c9bce3bf61515d3101)`);
        });
      });

      describe('when specify key', () => {
        xit('should return correctly', () => {
          console.log = jest.fn();
          const stashResult = `
日本語,英語,キー
こんにちは,hello,common.greeting.hello
さようなら,goodbye,common.greeting.good_bye
おやすみ,good night,common.greeting.good_night`;
          const mockModel_hashObjectFromData = jest.spyOn(model, 'hashObjectFromData').mockReturnValueOnce('blob hash');
          const mockModel__deleteLineLog = jest.spyOn(model, '_deleteLineLog').mockReturnValueOnce(model);

          model.stash('pop', 'stash@{1}');

          expect(mockModel_hashObjectFromData).toHaveBeenCalledTimes(1);
          expect(mockModel_hashObjectFromData.mock.calls[0][0]).toEqual(stashResult);
          expect(mockModel_hashObjectFromData.mock.calls[0][1]).toEqual({ type: 'blob', write: true });

          expect(writeSyncFile).toHaveBeenCalledTimes(1);
          expect(writeSyncFile.mock.calls[0][0]).toEqual('./dist/test_data.csv');
          expect(writeSyncFile.mock.calls[0][1]).toEqual(stashResult);

          expect(mockModel__deleteLineLog).toHaveBeenCalledTimes(1);
          expect(mockModel__deleteLineLog.mock.calls[0]).toEqual('logs/refs/stash', 'stash@{1}');

          expect(console.log).toHaveBeenCalledTimes(1);
          expect(console.log.mock.calls[0]).toEqual(`\
On branch master
Changes not staged for commit:

  modified:	../dist/test_data.csv

Dropped stash@{1} (3df8acdb918794c2bda15ae45fec2c5929ca4929)`);
        });
      });
    });

    describe('stash show', () => {
      describe('when specify -p(--print)', () => {
        it('should return correctly', () => {
          const mockModel_diff = jest.spyOn(model, 'diff').mockReturnValueOnce('diff');

          model.stash('show', { print: true });

          expect(mockModel_diff).toHaveBeenCalledTimes(1);
          expect(mockModel_diff.mock.calls[0]).toEqual([{ compareBlobHash: 'b6f2667d13461fb6c521c1975018124db2e2d1e3' }]);
        });
      });
    });

    describe('stash drop', () => {
      describe('when do not specify stash key', () => {
        it('should return correctly', () => {
          console.log = jest.fn();
          const mockModel__writeSyncFile = jest.spyOn(model, '_writeSyncFile').mockReturnValueOnce(model);
          const mockModel__deleteLineLog = jest.spyOn(model, '_deleteLineLog').mockReturnValueOnce(model);

          model.stash('drop');

          expect(mockModel__writeSyncFile).toHaveBeenCalledTimes(1);
          expect(mockModel__writeSyncFile.mock.calls[0]).toEqual(['refs/stash', '3df8acdb918794c2bda15ae45fec2c5929ca4929']);

          expect(mockModel__deleteLineLog).toHaveBeenCalledTimes(1);
          expect(mockModel__deleteLineLog.mock.calls[0]).toEqual(['logs/refs/stash', 'stash@{0}']);

          expect(console.log).toHaveBeenCalledTimes(1);
          expect(console.log.mock.calls[0]).toEqual(['Dropped refs/stash@{0} (00fa2d2f5b497b41e288f8c9bce3bf61515d3101)']);
        });
      });

      describe('when specify stash@{1}', () => {
        it('should return correctly', () => {
          console.log = jest.fn();
          const mockModel__deleteLineLog = jest.spyOn(model, '_deleteLineLog').mockReturnValueOnce(model);

          model.stash('drop', { stashKey: 'stash@{1}' });

          expect(mockModel__deleteLineLog).toHaveBeenCalledTimes(1);
          expect(mockModel__deleteLineLog.mock.calls[0]).toEqual(['logs/refs/stash', 'stash@{1}']);

          expect(console.log).toHaveBeenCalledTimes(1);
          expect(console.log.mock.calls[0]).toEqual(['Dropped stash@{1} (3df8acdb918794c2bda15ae45fec2c5929ca4929)']);
        });
      });
    });
  });

  describe('#reflog', () => {
    xit('should return correctly', () => {
      console.log = jest.fn();

      model.reflog();
      expect(console.log).toHaveBeenCalledTimes(1);
      expect(console.log.mock.calls[0][0]).toEqual(`\
${colorize('4e2b7c4', 'info')} HEAD@{0}: reset: moving to HEAD\n\
${colorize('4e2b7c4', 'info')} HEAD@{1}: reset: moving to HEAD\n\
${colorize('4e2b7c4', 'info')} HEAD@{2}: commit Add good_bye\n\
${colorize('4e2b7c4', 'info')} HEAD@{3}: clone: from https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=0\n`);
    });
  });

  describe('#showRef', () => {
    xit('should return correctly', () => {
      console.log = jest.fn();

      recursive.mockReturnValueOnce(Promise.resolve(
        [
          'test/localRepo/.sit/refs/heads/develop',
          'test/localRepo/.sit/refs/heads/master',
          'test/localRepo/.sit/refs/remotes/origin/HEAD',
          'test/localRepo/.sit/refs/remotes/origin/master',
          'test/localRepo/.sit/refs/remotes/origin/test',
          'test/localRepo/.sit/refs/stash',
        ],
      ));

      model.showRef();
      expect(console.log).toHaveBeenCalledTimes(1);
      expect(console.log.mock.calls[0][0]).toEqual(`\
00fa2d2f5b497b41e288f8c9bce3bf61515d3101 refs/stash
cc8aa255b845ffbac3ef18b0fce15f7e8bac7e46 refs/heads/develop
4e2b7c47eb492ab07c5d176dccff3009c1ebc79b refs/heads/master
4e2b7c47eb492ab07c5d176dccff3009c1ebc79b refs/remotes/origin/HEAD
4e2b7c47eb492ab07c5d176dccff3009c1ebc79b refs/remotes/origin/test
4e2b7c47eb492ab07c5d176dccff3009c1ebc79b refs/remotes/origin/master`);
    });
  });

  describe('#revParse', () => {
    describe('when do not specify', () => {
      xit('should return correctly', () => {
        console.log = jest.fn();

        model.revParse('origin/test');
        expect(console.log).toHaveBeenCalledTimes(1);
        expect(console.log.mock.calls[0][0]).toEqual('4e2b7c47eb492ab07c5d176dccff3009c1ebc79b');
      });
    });

    describe('when specify --short', () => {
      xit('should return correctly', () => {
        console.log = jest.fn();

        model.revParse('origin/test');
        expect(console.log).toHaveBeenCalledTimes(1);
        expect(console.log.mock.calls[0][0]).toEqual('4e2b7c4');
      });
    });

    describe('when specify --show-toplevel', () => {
      it('should return correctly', () => {
        console.log = jest.fn();
        const currentPath = fs.realpathSync('./');

        model.revParse(undefined, { showToplevel: true });
        expect(console.log).toHaveBeenCalledTimes(1);
        expect(console.log.mock.calls[0][0]).toEqual(`${currentPath}/test/localRepo/.sit`);
      });
    });
  });

  describe('#createPullRequestData', () => {
    describe('When some elements exist only in Hoge', () => {
      it('should return correctly', () => {
        const header = ['日本語', '英語', 'キー'];
        const toData = [
          header,
          ['こんにちは', 'hello', 'common.greeting.hello'],
          ['さようなら', 'goodbye', 'common.greeting.good_bye'],
          ['おはよう', 'good morning', 'common.greeting.good_morning'],
        ];
        const fromData = [
          header,
          ['こんにちは', 'hello', 'common.greeting.hello'],
        ];
        const mockCreatedAt = '2020-03-25T23:53:57+09:00';
        mockMoment_format.mockReturnValueOnce(mockCreatedAt);

        model.createPullRequestData(toData, fromData, (result) => {
          const mockCreatedAt = '2020-03-25T23:53:57+09:00';
          expect(result).toEqual(
            [
              ['日本語', '英語', 'キー', 'Index', 'Status'],
              ['こんにちは', 'hello', 'common.greeting.hello', 0, ''],
              ['さようなら', 'goodbye', 'common.greeting.good_bye', 1, '±'],
              ['おはよう', 'good morning', 'common.greeting.good_morning', 2, '±'],
              [''],
              ['created at', mockCreatedAt],
              ['reviewers', ''],
              ['assignees', 'yukihirop'],
              ['message', ''],
              ['labels', ''],
              ['projects', ''],
              ['milestone', ''],
            ],
          );
        });
      });
    });

    describe('If there are corrections and additions', () => {
      it('should return correctly', () => {
        const header = ['日本語', '英語', 'キー'];
        const toData = [
          header,
          ['こんにちは', 'hello', 'common.greeting.hello'],
          ['さようなら', 'goodbye', 'common.greeting.good_bye'],
          ['おはよう', 'good morning', 'common.greeting.good_morning'],
        ];
        const fromData = [
          header,
          ['こんにちは', 'hello', 'common.greeting.hello'],
          ['さようなら', 'goodbye', 'common.greeting.good_bye'],
          ['バイバイ', 'bye bye', 'common.greeting.bye_bye'],
          ['おやすみなさい', 'good night', 'common.greeting.good_night'],
        ];
        const mockCreatedAt = '2020-03-25T23:53:57+09:00';
        mockMoment_format.mockReturnValueOnce(mockCreatedAt);

        model.createPullRequestData(toData, fromData, (result) => {
          const mockCreatedAt = '2020-03-25T23:53:57+09:00';
          expect(result).toEqual(
            [
              ['日本語', '英語', 'キー', 'Index', 'Status'],
              ['こんにちは', 'hello', 'common.greeting.hello', 0, ''],
              ['さようなら', 'goodbye', 'common.greeting.good_bye', 1, ''],
              ['おはよう', 'good morning', 'common.greeting.good_morning', 2, '-'],
              ['バイバイ', 'bye bye', 'common.greeting.bye_bye', 2, '+'],
              ['おやすみなさい', 'good night', 'common.greeting.good_night', 3, '+'],
              [''],
              ['created at', mockCreatedAt],
              ['reviewers', ''],
              ['assignees', 'yukihirop'],
              ['message', ''],
              ['labels', ''],
              ['projects', ''],
              ['milestone', ''],
            ],
          );
        });
      });
    });
  });
});
