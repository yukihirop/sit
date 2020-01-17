'use strict';

function GSSValidator(uri, baseURL) {
  const isSpreadSheetURL = () => {
    if (!uri) {
      throw new Error(`Requres a vaid URL: ${uri}`);
    }

    if (uri.indexOf(baseURL) > -1) {
      return true
    } else {
      throw new Error(`Requres a vaid URL: ${uri}`);
    }
  }

  return {
    isSpreadSheetURL,
  }
}

module.exports = GSSValidator;
