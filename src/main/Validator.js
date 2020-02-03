'use strict';

const { packageJSON } = require('./utils/file');
const GSSValidator = require('./validators/GSSValidator');

const SitSetting = require('./SitSetting');
const SitConfig = require('./repos/SitConfig');

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
        const remotes = SitConfig.remote;
        if (remotes) {
          Object.keys(remotes).forEach((name) => {
            let url = remotes[name];
            let validator = new GSSValidator(url, baseURL);
            result = validator.isSpreadSheetURL();
            if (!result) {
              setErrors(...validator.getErrors())
            }
          })
        } else {
          result = false
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
