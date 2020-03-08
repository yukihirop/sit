'use strict';

const SitLogParser = require('@repos/logs/SitLogParser')
const SitRepo = require('@main/SitRepo')

describe('SitLogParser', () => {
  let model;
  const repo = new SitRepo()

  describe('#parseToCSV', () => {
    describe('when logFile exist', () => {
      // FIXME:
      xit('should return correctly', () => {
        model = new SitLogParser(repo, 'master', 'logs/refs/heads/master')
        jest.spyOn(repo, '_refBlobFromCommitHash').mockReturnValueOnce('0000000000000000000000000000000000000000')
          .mockReturnValueOnce('4e2b7c47eb492ab07c5d176dccff3009c1ebc79b')

        expect(model.parseToCSV()).toEqual([
          ["branch", "beforesha", "aftersha", "username", "email", "unixtime", "timezone", "message"],
          ["master", "0000000000000000000000000000000000000000", "4e2b7c47eb492ab07c5d176dccff3009c1ebc79b", "yukihirop", "<te108186@gmail.com>", "1580961933681", "+0900", "clone: from https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=0"],
          ["master", "8b58f3891ae3e4d274972a39d27fd460aaeaa6cc", "2938ad2ab5722adf9b48ff5bac74989eaa2d144c", "yukihirop", "<te108186@gmail.com>", "1583639422044", "+0900", "commit Add good_bye"]
        ])
      })
    })

    // https://jestjs.io/docs/ja/expect#tothrowerror
    describe('when logFile do not exist', () => {
      it('should return correctly', () => {
        model = new SitLogParser(repo, 'master', 'logs/refs/heads/hoge')
        expect(() => { model.parseToCSV() }).toThrowError("Do not exist file: test/localRepo/.sit/logs/refs/heads/hoge")
      })
    })
  })
})
