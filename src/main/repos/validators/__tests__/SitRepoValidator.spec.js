'use strict';

const SitRepoValidator = require('@repos/validators/SitRepoValidator');

describe('SitRepoValidator', () => {
  const validator = new SitRepoValidator();

  beforeEach(() => {
    validator.errors = [];
  });

  describe('#isBranch', () => {
    describe('when brach include invalid str', () => {
      it('should return correctly', () => {
        const result = validator.isBranch('[pr]test^@\0!?*');

        expect(result).toEqual(false);
        expect(validator.errors[0].message).toEqual("fatal: '[pr]test^@\0!?*' is not a valid branch name.");
      });
    });

    describe('when branch include reserved branch(refs/remotes)', () => {
      it('should return correctly', () => {
        const result = validator.isBranch('refs/remotes');

        expect(result).toEqual(false);
        expect(validator.errors[0].message).toEqual("fatal: 'refs/remotes' is not a valid branch name.");
      });
    });

    describe('when branch include reserved branch(logs/refs/remotes)', () => {
      it('should return correctly', () => {
        const result = validator.isBranch('logs/refs/remotes');

        expect(result).toEqual(false);
        expect(validator.errors[0].message).toEqual("fatal: 'logs/refs/remotes' is not a valid branch name.");
      });
    });

    describe('when branch name is valid', () => {
      it('should return correctly', () => {
        const result = validator.isBranch('new_branch');

        expect(result).toEqual(true);
        expect(validator.errors.length).toEqual(0);
      });
    });
  });
});
