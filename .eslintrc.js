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
    "semi": ["error", "always"]
  },
};
