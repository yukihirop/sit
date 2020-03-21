'use strict';

const Clasp = require('@main/Clasp');

const {
  fileCopySync,
  appendFile,
  isExistFile,
} = require('@utils/file');

const fs = require('fs');

jest.mock('@utils/file', () => (
  {
    ...(jest.requireActual('@utils/file')),
    fileCopySync: jest.fn(),
    appendFile: jest.fn(),
    isExistFile: jest.fn(() => true),
  }
));

describe('Clasp', () => {
  const model = new Clasp();
  const oldLocalRepo = model.localRepo;
  const currentPath = fs.realpathSync('./');

  afterEach(() => {
    jest.restoreAllMocks();
    model.localRepo = oldLocalRepo;
  });

  describe('#update', () => {
    describe('when localRepo exist', () => {
      it('should return correctly', () => {
        console.log = jest.fn();
        isExistFile
          .mockReturnValueOnce(true)
          .mockReturnValueOnce(true);
        model.update();

        expect(fileCopySync).toHaveBeenCalledTimes(2);
        expect(fileCopySync.mock.calls[0]).toEqual([`${currentPath}/src/clasp/.claspignore`, `${currentPath}/.claspignore`]);
        expect(fileCopySync.mock.calls[1]).toEqual([`${currentPath}/src/clasp`, `${currentPath}/test/localRepo/.sit/scripts/clasp`, { mkdirp: true }]);

        expect(appendFile).toHaveBeenCalledTimes(1);
        expect(appendFile.mock.calls[0]).toEqual([`${currentPath}/.claspignore`, '!.sit/scripts/clasp/**/*.js']);

        expect(console.log).toHaveBeenCalledTimes(1);
        expect(console.log.mock.calls[0]).toEqual(['update files: test/localRepo/.sit/scripts/clasp']);
      });

      describe('when clasp scripts do not exist', () => {
        it('should return correctly', () => {
          console.log = jest.fn();
          isExistFile
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(false);

          model.update();

          expect(console.log).toHaveBeenCalledTimes(1);
          expect(console.log.mock.calls[0]).toEqual(['create files: test/localRepo/.sit/scripts/clasp']);
        });
      });
    });

    // https://stackoverflow.com/questions/50379916/how-to-mock-test-a-node-js-cli-with-jest
    describe('when localRepo do not exit', () => {
      it('should return correctly', () => {
        model.localRepo = 'test/do_not_exist/.sit';
        console.error = jest.fn();
        isExistFile
          .mockReturnValueOnce(false);
        jest.spyOn(process, 'exit').mockImplementation(() => {
          throw new Error('process.exit() was called.');
        });

        expect(() => model.update()).toThrow('process.exit() was called.');
        expect(console.error).toHaveBeenCalledTimes(1);
        // must be calls[0] but bug
        expect(console.error.mock.calls[0]).toEqual(["Don't exists local repo: test/do_not_exist/.sit."]);
        expect(process.exit).toHaveBeenCalledWith(1);
      });
    });
  });
});
