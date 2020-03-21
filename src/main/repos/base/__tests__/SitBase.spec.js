/* eslint-disable  camelcase, import/no-unresolved */

'use strict';

const SitBase = require('../SitBase');

describe('SitBase', () => {
  const model = new SitBase();

  describe('#_INITIAL_HASH', () => {
    it('should return correctly', () => {
      expect(model._INITIAL_HASH()).toEqual('0000000000000000000000000000000000000000');
    });
  });
});
