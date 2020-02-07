'use strict';

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
