/* eslint-disable  camelcase */

'use strict';

const sit = require('@main/index');
const SitRepo = require('@main/SitRepo');
const SitBlob = require('@repos/objects/SitBlob');
const SitConfig = require('@repos/SitConfig');
const Clasp = require('@main/Clasp');

const mockSitRepo_remoteRepo = jest.fn();
const mockSitRepo_init = jest.fn();
const mockSitRepo_rollback = jest.fn();

const mockGSS_getRows = jest.fn();
const mockGSS_pushRows = jest.fn();
const mockGSS_getSheetNames = jest.fn();
const mockGSS_header = jest.fn();
jest.mock('@main/sheets/GSS', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getRows: mockGSS_getRows,
      pushRows: mockGSS_pushRows,
      getSheetNames: mockGSS_getSheetNames,
      header: mockGSS_header,
    };
  });
});

describe('sit', () => {

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Repo.fetch', () => {
    // https://stackoverflow.com/questions/50379916/how-to-mock-test-a-node-js-cli-with-jest
    describe('when remoteRepo do not exist', () => {
      it('should return correctly', () => {
        console.error = jest.fn();
        jest.spyOn(process, 'exit').mockImplementation(() => {
          throw new Error('process.exit() was called.');
        });

        expect(() => sit().Repo.fetch('typo_origin', 'master')).toThrow('process.exit() was called.');
        expect(console.error).toHaveBeenCalledTimes(1);
        // must be calls[0] but bug
        expect(console.error.mock.calls[0]).toEqual([`\
fatal: 'typo_origin' does not appear to be a sit repository
fatal: Could not read from remote repository.

Please make sure you have the correct access rights and the repository exists.`]);
      });

      describe('when fetch --prune origin', () => {
        const old_isExistFile = SitRepo.prototype._isExistFile;

        afterEach(() => {
          SitRepo.prototype._isExistFile = old_isExistFile;
        });

        it('should return correctly', () => {
          const mockSitRepoBase__isExistFile = jest.fn();
          SitRepo.prototype._isExistFile = mockSitRepoBase__isExistFile;
          mockSitRepoBase__isExistFile.mockReturnValueOnce(false);

          const result = sit().Repo.fetch('origin', null, { prune: true });
          expect(result).toEqual(undefined);
        });
      });
    });

    describe('when remoteRepo exist', () => {
      describe('when branch exist', () => {
        it('should return correctly', () => {
          const mockSitRepo_hashObjectFromData = jest.fn();
          const mockSitRepo_fetch = jest.fn();
          SitRepo.prototype.remoteRepo = mockSitRepo_remoteRepo;
          SitRepo.prototype.hashObjectFromData = mockSitRepo_hashObjectFromData;
          SitRepo.prototype.fetch = mockSitRepo_fetch;

          mockSitRepo_remoteRepo.mockReturnValueOnce('./test/localRepo/.sit');
          mockGSS_getRows.mockReturnValueOnce(Promise.resolve([[], []]));
          mockSitRepo_hashObjectFromData.mockReturnValueOnce('');
          mockSitRepo_fetch.mockReturnValueOnce(Promise.resolve({}));
          sit().Repo.fetch('origin', 'master');

          expect(mockGSS_getRows).toHaveBeenCalledTimes(1);
          expect(mockGSS_getRows.mock.calls[0]).toEqual(['origin', 'master']);
        });
      });

      describe('when branch do not exist', () => {
        it('should return correctly', () => {
          SitRepo.prototype.remoteRepo = mockSitRepo_remoteRepo;
          mockSitRepo_remoteRepo.mockReturnValueOnce('./test/localRepo/.sit');
          mockGSS_getRows.mockReturnValueOnce(Promise.resolve([[], []]));
          mockGSS_getSheetNames.mockReturnValueOnce(Promise.resolve['master', 'develop']);
          sit().Repo.fetch('origin', null);

          expect(mockGSS_getRows).toHaveBeenCalledTimes(1);
          expect(mockGSS_getRows.mock.calls[0]).toEqual(['origin', 'refs/remotes', ['branch', 'sha1']]);
        });
      });
    });
  });

  describe('Repo.push', () => {
    describe('when remoteRepo do not exist', () => {
      it('should return correctly', () => {
        console.error = jest.fn();
        SitRepo.prototype.remoteRepo = mockSitRepo_remoteRepo;
        mockSitRepo_remoteRepo.mockReturnValueOnce(undefined);
        jest.spyOn(process, 'exit').mockImplementation(() => {
          throw new Error('process.exit() was called.');
        });

        expect(() => sit().Repo.push('origin', 'master')).toThrow('process.exit() was called.');
        expect(console.error).toHaveBeenCalledTimes(1);
        expect(console.error.mock.calls[0]).toEqual([`\
fatal: 'origin' does not appear to be a sit repository
fatal: Could not read from remote repository.

Please make sure you have the correct access rights and the repository exists.`]);
      });
    });

    describe('when remoteRepo exist', () => {
      // (node:19144) UnhandledPromiseRejectionWarning: TypeError: sheet.rows2CSV is not a function
      describe('when branch exist', () => {
        it('should return correctly', () => {
          const mockSitRepo_push = jest.fn();
          SitRepo.prototype.remoteRepo = mockSitRepo_remoteRepo;
          SitRepo.prototype.push = mockSitRepo_push;

          mockGSS_getRows.mockReturnValueOnce(Promise.resolve([[], []]));
          mockGSS_pushRows.mockReturnValue(Promise.resolve());

          mockSitRepo_remoteRepo.mockReturnValueOnce('./test/localRepo/.sit');
          mockSitRepo_push.mockReturnValueOnce(Promise.resolve({ beforeHash: '47af1af6722639322ccf17ea5f873d0e483c364f', afterHash: '4e2b7c47eb492ab07c5d176dccff3009c1ebc79b' }));
          sit().Repo.push('origin', 'master');

          expect(mockGSS_getRows).toHaveBeenCalledTimes(1);
          expect(mockGSS_getRows.mock.calls[0]).toEqual(['origin', 'refs/remotes', ['branch', 'sha1']]);
        });
      });

      describe('when branch do not exist', () => {
        it('should return correctly', () => {
          SitRepo.prototype.remoteRepo = mockSitRepo_remoteRepo;
          mockSitRepo_remoteRepo.mockReturnValueOnce('./test/localRepo/.sit');
          console.error = jest.fn();
          jest.spyOn(process, 'exit').mockImplementation(() => {
            throw new Error('process.exit() was called.');
          });

          expect(() => sit().Repo.push('origin', null)).toThrow('process.exit() was called.');
          expect(console.error).toHaveBeenCalledTimes(1);
          expect(console.error.mock.calls[0]).toEqual(['branch is required']);
        });
      });
    });
  });

  // (node:38334) UnhandledPromiseRejectionWarning: Error: process.exit() was called.a
  describe('Repo.clone', () => {
    describe('when repoName exist', () => {
      describe('when url exist', () => {
        beforeEach(() => {
          mockGSS_getRows.mockReturnValueOnce(Promise.resolve([['branch', 'sha1'], ['master', '4e2b7c47eb492ab07c5d176dccff3009c1ebc79b']]));
          mockGSS_getRows.mockReturnValueOnce(Promise.resolve([['日本語', '英語', 'キー'], ['こんにちは', 'hello', 'greeting.hello']]));
          SitRepo.prototype.init = mockSitRepo_init;
        });

        describe('when already exist localRepo', () => {
          it('should return correctly', () => {
            SitRepo.prototype.rollback = mockSitRepo_rollback;
            mockSitRepo_rollback.mockReturnValue(true);
            mockSitRepo_init.mockReturnValue(false);
            console.error = jest.fn();
            jest.spyOn(process, 'exit').mockImplementation(() => {
              throw new Error('process.exit() was called.');
            });

            sit().Repo.clone('origin', 'https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=0');
            expect(mockGSS_getRows).toHaveBeenCalledTimes(1);
            expect(mockGSS_getRows.mock.calls[0]).toEqual(['origin', 'refs/remotes', ['branch', 'sha1']]);

            // do not called by bug.
            // expect(console.error).toHaveBeenCalledTimes(1)
            // expect(console.error.mock.calls[0]).toEqual("fatal: destination path 'test/dist/test_data.csv' already exists and is not an empty directory")
          });
        });

        describe('when do not exist localRepo', () => {
          it('should return correctly', () => {
            const mockSitRepo_clone = jest.fn();
            const mockSitRepo_hashObjectFromData = jest.fn();
            const mockClasp_update = jest.fn();

            SitRepo.prototype.clone = mockSitRepo_clone;
            Clasp.prototype.update = mockClasp_update;
            mockSitRepo_init.mockReturnValue(true);
            mockSitRepo_clone.mockReturnValue(true);
            mockSitRepo_hashObjectFromData.mockReturnValue('4e2b7c47eb492ab07c5d176dccff3009c1ebc79b');
            mockClasp_update.mockReturnValue(true);
            console.log = jest.fn();

            sit().Repo.clone('origin', 'https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=0');

            expect(mockGSS_getRows).toHaveBeenCalledTimes(1);
            expect(mockGSS_getRows.mock.calls[0]).toEqual(['origin', 'refs/remotes', ['branch', 'sha1']]);

            // https://github.com/facebook/jest/issues/6671#issuecomment-404171584
            // Mock information of processing in promise cannot be taken
            // 
            // expect(mockSitRepo_init).toHaveBeenCalledTimes(1)
            // expect(mockSitRepo_clone).toHaveBeenCalledTimes(1)
            // expect(mockSitRepo_hashObjectFromData).toHaveBeenCalledTimes(1)
            // expect(console.log).toHaveBeenCalledTimes(1)
          });
        });
      });

      describe('when url do not exist', () => {
        it('should return correctly', () => {
          console.error = jest.fn();
          jest.spyOn(process, 'exit').mockImplementation(() => {
            throw new Error('process.exit() was called.');
          });

          expect(() => sit().Repo.clone('origin', null)).toThrow('process.exit() was called.');
          expect(console.error).toHaveBeenCalledTimes(1);
          expect(console.error.mock.calls[0]).toEqual(['url is required']);
        });
      });
    });

    describe('when repoName do not exist', () => {
      it('should return correctly', () => {
        console.error = jest.fn();
        jest.spyOn(process, 'exit').mockImplementation(() => {
          throw new Error('process.exit() was called.');
        });
        expect(() => sit().Repo.clone(null, 'https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=0')).toThrow('process.exit() was called.');

        expect(console.error).toHaveBeenCalledTimes(1);
        expect(console.error.mock.calls[0]).toEqual(['repository is required']);
      });
    });
  });

  describe('Repo.init', () => {
    describe('when localRepo already exist', () => {
      it('should return correctly', () => {
        SitRepo.prototype.init = mockSitRepo_init;
        mockSitRepo_init.mockReturnValueOnce(false);
        mockGSS_header.mockReturnValueOnce(['日本語', '英語', 'キー']);
        console.log = jest.fn();
        sit().Repo.init();

        expect(console.log).toHaveBeenCalledTimes(1);
        expect(console.log.mock.calls[0]).toEqual(['already exist local repo: test/localRepo/.sit']);
      });
    });

    describe('when localRepo do not exist', () => {
      SitRepo.prototype.init = mockSitRepo_init;
      mockSitRepo_init.mockReturnValueOnce(true);
      mockGSS_header.mockReturnValueOnce(['日本語', '英語', 'キー']);
      console.log = jest.fn();
      sit().Repo.init();

      expect(console.log).toHaveBeenCalledTimes(2);
      expect(console.log.mock.calls[0]).toEqual(['created local repo: test/localRepo/.sit']);
      expect(console.log.mock.calls[1]).toEqual(['created dist file: test/dist/test_data.csv']);
    });
  });

  describe('Repo.checkLocalRepo', () => {
    describe('when localRepo do not exist', () => {
      it('should return correctly', () => {
        const mockSitRepo_isLocalRepo = jest.fn();
        SitRepo.prototype.isLocalRepo = mockSitRepo_isLocalRepo;
        mockSitRepo_isLocalRepo.mockReturnValueOnce(false);
        console.error = jest.fn();
        jest.spyOn(process, 'exit').mockImplementation(() => {
          throw new Error('process.exit() was called.');
        });

        expect(() => sit().Repo.checkLocalRepo()).toThrow('process.exit() was called.');
        expect(console.error).toHaveBeenCalledTimes(1);
        expect(console.error.mock.calls[0]).toEqual(['fatal: not a sit repository (or any of the parent directories): test/localRepo/.sit']);
      });
    });
  });

  describe('Repo.catFile', () => {
    describe('when specify type', () => {
      it('should return correctly', () => {
        const mockBlob = new SitBlob(null, '1,2,3\n4,5,6', 7);
        const mockSitRepo_catFile = jest.fn();
        SitRepo.prototype.catFile = mockSitRepo_catFile;
        mockSitRepo_catFile.mockReturnValueOnce(Promise.resolve(mockBlob));
        sit().Repo.catFile('4e2b7c47eb492ab07c5d176dccff3009c1ebc79b', { type: true });

        expect(mockSitRepo_catFile).toHaveBeenCalledTimes(1);
        expect(mockSitRepo_catFile.mock.calls[0]).toEqual(['4e2b7c47eb492ab07c5d176dccff3009c1ebc79b']);
      });
    });
  });

  describe('Repo.hashObject', () => {
    it('should return correclty', () => {
      const mockSitRepo_hashObject = jest.fn();
      SitRepo.prototype.hashObject = mockSitRepo_hashObject;
      sit().Repo.hashObject('test/dist/test_data.csv');

      expect(mockSitRepo_hashObject).toHaveBeenCalledTimes(1);
      expect(mockSitRepo_hashObject.mock.calls[0]).toEqual(['test/dist/test_data.csv', {}]);
    });
  });

  describe('Repo.branch', () => {
    it('should return correctly', () => {
      const mockSitRepo_branch = jest.fn();
      SitRepo.prototype.branch = mockSitRepo_branch;
      sit().Repo.branch();

      expect(mockSitRepo_branch).toHaveBeenCalledTimes(1);
      expect(mockSitRepo_branch.mock.calls[0]).toEqual([{}]);
    });
  });

  describe('Repo.checkout', () => {
    it('should return correctly', () => {
      const mockSitRepo_checkout = jest.fn();
      SitRepo.prototype.checkout = mockSitRepo_checkout;
      sit().Repo.checkout('origin', 'master');

      expect(mockSitRepo_checkout).toHaveBeenCalledTimes(1);
      expect(mockSitRepo_checkout.mock.calls[0]).toEqual(['origin', 'master', {}]);
    });
  });

  describe('Repo.status', () => {
    it('should return correctly', () => {
      const mockSitRepo_status = jest.fn();
      SitRepo.prototype.status = mockSitRepo_status;
      sit().Repo.status();

      expect(mockSitRepo_status).toHaveBeenCalledTimes(1);
      expect(mockSitRepo_status.mock.calls[0]).toEqual([{}]);
    });
  });

  describe('Repo.diff', () => {
    it('should return correctly', () => {
      const mockSitRepo_diff = jest.fn();
      SitRepo.prototype.diff = mockSitRepo_diff;
      sit().Repo.diff();

      expect(mockSitRepo_diff).toHaveBeenCalledTimes(1);
      expect(mockSitRepo_diff.mock.calls[0]).toEqual([{}]);
    });
  });

  describe('Repo.commit', () => {
    it('should return correctly', () => {
      const mockSitRepo_commit = jest.fn();
      SitRepo.prototype.commit = mockSitRepo_commit;
      sit().Repo.commit();

      expect(mockSitRepo_commit).toHaveBeenCalledTimes(1);
      expect(mockSitRepo_commit.mock.calls[0]).toEqual([{}]);
    });
  });

  describe('Repo.merge', () => {
    it('should return correctly', () => {
      const mockSitRepo_merge = jest.fn();
      SitRepo.prototype.merge = mockSitRepo_merge;
      sit().Repo.merge('origin', 'master');

      expect(mockSitRepo_merge).toHaveBeenCalledTimes(1);
      expect(mockSitRepo_merge.mock.calls[0]).toEqual(['origin', 'master', {}]);
    });
  });

  describe('Repo.browseRemote', () => {
    it('should return correctly', () => {
      const mockSitRepo_browseRemote = jest.fn();
      SitRepo.prototype.browseRemote = mockSitRepo_browseRemote;
      sit().Repo.browseRemote('origin');

      expect(mockSitRepo_browseRemote).toHaveBeenCalledTimes(1);
      expect(mockSitRepo_browseRemote.mock.calls[0]).toEqual(['origin']);
    });
  });

  describe('Repo.config', () => {
    describe('when global sitconfig', () => {
      it('should return correctly', () => {
        const mockSitConfig_update = jest.fn();
        SitConfig.prototype.update = mockSitConfig_update;
        mockSitConfig_update.mockReturnValue(true);
        sit().Repo.config('user.name', 'yukihirop', { global: true });

        expect(mockSitConfig_update).toHaveBeenCalledTimes(1);
        expect(mockSitConfig_update.mock.calls[0]).toEqual(['user.name', 'yukihirop']);
      });
    });

    describe('when local sitconfig', () => {
      it('should return correctly', () => {
        const mockSitConfig_update = jest.fn();
        SitConfig.prototype.update = mockSitConfig_update;
        mockSitConfig_update.mockReturnValue(true);
        sit().Repo.config('user.email', 'test@example.com', { local: true });

        expect(mockSitConfig_update).toHaveBeenCalledTimes(1);
        expect(mockSitConfig_update.mock.calls[0]).toEqual(['user.email', 'test@example.com']);
      });
    });
  });

  describe('Repo.remote', () => {
    it('should return correctly', () => {
      const mockSitRepo_remote = jest.fn();
      SitRepo.prototype.remote = mockSitRepo_remote;
      sit().Repo.remote('add', 'origin', 'https://test.co.jp');

      expect(mockSitRepo_remote).toHaveBeenCalledTimes(1);
      expect(mockSitRepo_remote.mock.calls[0]).toEqual(['add', 'origin', 'https://test.co.jp', {}]);
    });
  });

  describe('Repo.pullRequest', () => {
    describe('when bad syntax', () => {
      it('should return correctly', () => {
        console.error = jest.fn();
        jest.spyOn(process, 'exit').mockImplementation(() => {
          throw new Error('process.exit() was called.');
        });

        expect(() => sit().Repo.pullRequest('origin', 'master_test')).toThrow('process.exit() was called.');
        expect(console.error).toHaveBeenCalledTimes(1);
        expect(console.error.mock.calls[0]).toEqual(["fatal: ambiguous argument 'master_test': unknown revision or path not in the working tree."]);
      });
    });

    describe('when remote branch (from branch) do not exist', () => {
      it('should return correctly', () => {
        console.error = jest.fn();
        jest.spyOn(process, 'exit').mockImplementation(() => {
          throw new Error('process.exit() was called.');
        });

        expect(() => sit().Repo.pullRequest('origin', 'master...do_not_exist')).toThrow('process.exit() was called.');
        expect(console.error).toHaveBeenCalledTimes(1);
        expect(console.error.mock.calls[0]).toEqual(["error: pathspec 'origin/do_not_exist' did not match any file(s) known to sit"]);
      });
    });

    describe('when remote branch (to branch) do not exist', () => {
      it('should return correctly', () => {
        console.error = jest.fn();
        jest.spyOn(process, 'exit').mockImplementation(() => {
          throw new Error('process.exit() was called.');
        });

        expect(() => sit().Repo.pullRequest('origin', 'do_not_exist...test')).toThrow('process.exit() was called.');
        expect(console.error).toHaveBeenCalledTimes(1);
        expect(console.error.mock.calls[0]).toEqual(["error: pathspec 'origin/do_not_exist' did not match any file(s) known to sit"]);
      });
    });

    describe('when pull request is success', () => {
      it('should return correctly', () => {
        mockGSS_getRows.mockReturnValueOnce(Promise.resolve([[], []]));
        sit().Repo.pullRequest('origin', 'master...test');

        expect(mockGSS_getRows).toHaveBeenCalledTimes(1);
        expect(mockGSS_getRows.mock.calls[0]).toEqual(['origin', 'master']);
      });
    });
  });

  describe('Clasp.update', () => {
    it('should return correctly', () => {
      const mockClasp_update = jest.fn();
      Clasp.prototype.update = mockClasp_update;
      sit().Clasp.update();

      expect(mockClasp_update).toHaveBeenCalledTimes(1);
      expect(mockClasp_update.mock.calls[0]).toEqual([]);
    });
  });
});
