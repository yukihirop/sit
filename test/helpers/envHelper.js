'use strict';

if (process.platform === "win32") {
  process.env.USERPROFILE = "./test/homeDir";
} else {
  process.env.HOME = "./test/homeDir";
}

process.env.SIT_DIR = './test/localRepo'
process.env.SIT_SETTING_DIR = './test/localRepo'
