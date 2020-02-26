'use strict';

const SitLogParser = require('@repos/logs/SitLogParser')
const SitRepo = require('@main/SitRepo')

describe('SitLogParser', () => {
  let model;
  const repo = new SitRepo()

  describe('#parseToCSV', () => {
    describe('when logFile exist', () => {
      it('should return correctly', () => {
        model = new SitLogParser(repo, 'master', 'logs/refs/heads/master')
        jest.spyOn(repo, '_refBlobFromCommitHash').mockReturnValueOnce('0000000000000000000000000000000000000000')
          .mockReturnValue('953b3794394d6b48d8690bc5e53aa2ffe2133035')

        expect(model.parseToCSV()).toEqual([
          ["branch", "beforesha", "aftersha", "username", "email", "unixtime", "timezone", "message"],
          ["master", "0000000000000000000000000000000000000000", "953b3794394d6b48d8690bc5e53aa2ffe2133035", "yukihirop", "<te108186@gmail.com>", "1580961933681", "+0900", "clone: from https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=0"]
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
