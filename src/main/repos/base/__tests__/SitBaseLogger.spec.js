'use strict';

const SitBaseLogger = require('@repos/base/SitBaseLogger');

const {
  mkdirSyncRecursive,
  appendFile,
  writeSyncFile,
} = require('@utils/file');

// https://stackoverflow.com/questions/39755439/how-to-mock-imported-named-function-in-jest-when-module-is-unmocked
jest.mock('@utils/file', () => (
  {
    ...(jest.requireActual('@utils/file')),
    mkdirSyncRecursive: jest.fn(),
    appendFile: jest.fn(),
    writeSyncFile: jest.fn(),
  }
));

describe('SitBaseLogger', () => {
  const beforesha = 'df9a34ac9610f4ae808c1d010100c2ed9447c714';
  const aftersha = '5b1cf86e97c6633e9a2dd85567e33d636dd3748a';
  const model = new SitBaseLogger();

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('#write', () => {
    describe('when filedir exist', () => {
      it('should return correctly', () => {
        model.write('logs/refs/heads/hoge', beforesha, aftersha, 'commit: test', true);
        expect(mkdirSyncRecursive).not.toHaveBeenCalled();
        expect(appendFile).toHaveBeenCalled();
      });
    });

    describe('when filedir do not exist', () => {
      it('should return correctly', () => {
        model.write('logs/hoge/fuga', beforesha, aftersha, 'commit: test', true);
        expect(mkdirSyncRecursive).toHaveBeenCalled();
        expect(appendFile).toHaveBeenCalled();
      });
    });

    describe('when mkdir is false', () => {
      it('should return correctly', () => {
        model.write('logs/hoge/fuga', beforesha, aftersha, 'commit: test', false);
        expect(mkdirSyncRecursive).not.toHaveBeenCalled();
        expect(appendFile).toHaveBeenCalled();
      });
    });
  });

  describe('#createLogData', () => {
    it('should return correctly', () => {
      const username = 'test_user';
      const email = '<test_user@example.com>';
      const unixtime = '1583993176377';
      const timezone = '+0900';
      const message = 'reset: moving to HEAD';
      expect(model.createLogData({ beforesha, aftersha, username, email, unixtime, timezone, message }, false)).toEqual('df9a34ac9610f4ae808c1d010100c2ed9447c714 5b1cf86e97c6633e9a2dd85567e33d636dd3748a test_user <test_user@example.com> 1583993176377 +0900	reset: moving to HEAD\n');
    });
  });

  describe('#bulkOverWrite', () => {
    const data = 'cb293e8eaf1394f3182a886431b4a69696953f69 b1341fdf0e8f5ec966176e97e273ea327242238c yukihirop <te108186@gmail.com> 1583993176399 +0900	WIP on fuga: 7244522 Modify master data';
    model.bulkOverWrite('logs/refs/stash', data);

    expect(writeSyncFile).toHaveBeenCalledTimes(1);
    expect(writeSyncFile.mock.calls[0]).toEqual(['test/localRepo/.sit/logs/refs/stash', data, false]);
  });

  // FIXME: mock global .sitconfig
  describe('#username', () => {
    it('should return correctly', () => {
      expect(model.username()).toEqual('yukihirop');
    });
  });

  // FIXME: mock global .sitconfig
  describe('#email', () => {
    it('should return correctly', () => {
      expect(model.email()).toEqual('te108186@gmail.com');
    });
  });
});
