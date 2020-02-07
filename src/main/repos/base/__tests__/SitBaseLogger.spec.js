'use strict';

const SitBaseLogger = require('@repos/base/SitBaseLogger');

const {
  mkdirSyncRecursive,
  appendFile
} = require('@utils/file');

// https://stackoverflow.com/questions/39755439/how-to-mock-imported-named-function-in-jest-when-module-is-unmocked
jest.mock('@utils/file', () => (
  {
    ...(jest.requireActual('@utils/file')),
    mkdirSyncRecursive: jest.fn(),
    appendFile: jest.fn(),
  }
));

describe('SitBaseLogger', () => {
  const model = new SitBaseLogger('df9a34ac9610f4ae808c1d010100c2ed9447c714', '5b1cf86e97c6633e9a2dd85567e33d636dd3748a')

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('#write', () => {
    describe('when filedir exist', () => {
      it('should return correctly', () => {
        model.write('logs/refs/heads/hoge', 'commit: test', true)
        expect(mkdirSyncRecursive).not.toHaveBeenCalled()
        expect(appendFile).toHaveBeenCalled()
      })
    })

    describe('when filedir do not exist', () => {
      it('should return correctly', () => {
        model.write('logs/hoge/fuga', 'commit: test', true)
        expect(mkdirSyncRecursive).toHaveBeenCalled()
        expect(appendFile).toHaveBeenCalled()
      })
    })

    describe('when mkdir is false', () => {
      it('should return correctly', () => {
        model.write('logs/hoge/fuga', 'commit: test', false)
        expect(mkdirSyncRecursive).not.toHaveBeenCalled()
        expect(appendFile).toHaveBeenCalled()
      })
    })
  })

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
})
