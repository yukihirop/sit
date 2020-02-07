'use strict';

if (process.platform === "win32") {
  process.env.USERPROFILE = "./test/homeDir";
} else {
  process.env.HOME = "./test/homeDir";
}
