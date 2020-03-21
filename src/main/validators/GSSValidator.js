'use strict';

const GSSValidator = function (uri, baseURL) {
  const _errors = [];

  const getErrors = () => {
    return _errors;
  };

  const setErrors = (val) => {
    _errors.push(val);
  };

  const isSpreadSheetURL = () => {
    if (!uri) {
      const err = new Error(`Requires a vaid URL: ${uri}`);
      setErrors(err);
      return false;
    }

    if (uri.indexOf(baseURL) > -1) {
      return true;
    } else {
      const err = new Error(`Requires a vaid URL: ${uri}`);
      setErrors(err);
      return false;
    }
  };

  return {
    getErrors,
    setErrors,
    isSpreadSheetURL,
  };
};

module.exports = GSSValidator;
