'use strict';

global.testRepoReset = () => {
  testRmDirSync("./test/localRepo/.sit", true, () => {
    testFileCopySync("./test/localRepo/.sit-default", "./test/localRepo/.sit")
  })
}
