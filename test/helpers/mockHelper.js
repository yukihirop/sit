'use strict';

jest.mock('@main/SitSetting', () => (
  {
    ...(jest.requireActual('@main/SitSetting')),
    repo: {
      local: '.sit'
    },
    dist: {
      path: '../dist',
      sheetName: 'test_data.csv'
    }
  }
));
