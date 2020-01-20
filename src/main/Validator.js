'use strict';

const { yamlSafeLoad, packageJSON } = require('./utils/file');
const GSSValidator = require('./validators/GSSValidator');

function Validator(opts) {
  const { type, baseURL, settingPath } = opts;
  const yamlData = yamlSafeLoad(settingPath)
    , version = yamlData['version'];


  let _errors = [];

  const getErrors = () => {
    return _errors
  }

  const setErrors = (val) => {
    _errors.push(val)
  }

  const isValid = () => {
    return isVersion() && isURL()
  }

  const isVersion = () => {
    if (version === packageJSON().version) {
      return true;
    } else {
      const err = new Error(`Required version: ${packageJSON().version}\nBut not it's ${version}`);
      setErrors(err);
      return false;
    }
  }

  const isURL = () => {
    let result = false;

    switch (type) {
      case 'GoogleSpreadSheet':
        const url = yamlData['sheet']['gss']['url'];
        const validator = new GSSValidator(url, baseURL);
        result = validator.isSpreadSheetURL();
        if (!result) {
          setErrors(...validator.getErrors())
        }
        break;
    }

    return result;
  }

  return {
    getErrors,
    setErrors,
    isValid,
    isVersion,
    isURL
  }
}

module.exports = Validator;
