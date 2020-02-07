'use strict';

const SitRefParser = require('@repos/refs/SitRefParser');

jest.mock('@main/SitSetting', () => (
  {
    ...(jest.requireActual('@main/SitSetting')),
    repo: {
      local: './test/localRepo/.sit'
    },
    dist: {
      path: './test/localRepo/dist',
      sheetName: 'test_data.csv'
    }
  }
));

describe('SitRefParser', () => {
  let model;

  describe('#parseToCSV', () => {
    describe('when refFile exist', () => {
      it('should return correctly', () => {
        model = new SitRefParser('master', 'refs/heads/master')
        expect(model.parseToCSV()).toEqual([
          ["branch", "sha1"],
          ["master", "953b3794394d6b48d8690bc5e53aa2ffe2133035"]
        ])
      })
    })
  })
})
