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
    "prefer-template": "off",
    "class-methods-use-this": "off",
    "default-case": "off",
    "consistent-return": "off",
    "func-names": "off",
    "array-callback-return": "off",
    "global-require": "off",
    "import/no-dynamic-require": "off",
    "new-cap": "off",
    "no-case-declarations": "off",
    "no-constant-condition": "off",
    "no-continue": "off",
    "no-loop-func": "off",
    "no-multi-str": "off",
    "no-new": "off",
    "no-plusplus": "off",
    "no-use-before-define": "off",
    "no-useless-escape": "off"
  },
};
