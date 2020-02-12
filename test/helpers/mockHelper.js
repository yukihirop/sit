'use strict';

jest.mock('@main/SitSetting', () => (
  {
    ...(jest.requireActual('@main/SitSetting')),
    repo: {
      local: '.sit'
    },
    dist: {
      path: './test/dist',
      sheetName: 'test_data.csv'
    }
  }
));
