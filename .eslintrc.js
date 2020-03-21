module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es6: true
  },
  extends: [
    'airbnb-base', 'plugin:jest/recommended'
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
    "die": true
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  rules: {
    "semi": ["error", "always"],
    "no-underscore-dangle": "off",
    "no-console": "off",
    "arrow-parens": "off",
    "arrow-body-style": "off",
    "comma-style": "off",
    "no-else-return": "off",
    "no-shadow": "off",
    "no-param-reassign": "off",
    "jest/no-test-callback": "off",
    "jest/no-disabled-tests": "off",
    "jest/no-test-prefixes": "off",
    "object-curly-newline": "off",
    "one-var": "off",
    "max-len": "off",
    "no-tabs": "off",
    "jest/no-standalone-expect": "off",
    "prefer-template": "off"
  },
};
