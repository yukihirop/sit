'use strict';

const { packageJSON } = require('./utils/file');
const GSSValidator = require('./validators/GSSValidator');

const SitSetting = require('./SitSetting');

function Validator(opts) {
  const { type, baseURL } = opts;

  const version = SitSetting.version;
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
        const remotes = SitSetting.repo.remote;
        Object.keys(remotes).forEach((name) => {
          let url = remotes[name];
          let validator = new GSSValidator(url, baseURL);
          result = validator.isSpreadSheetURL();
          if (!result) {
            setErrors(...validator.getErrors())
          }
        })
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
