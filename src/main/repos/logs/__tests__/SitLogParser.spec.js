'use strict';

const SitLogParser = require('@repos/logs/SitLogParser')
const SitRepo = require('@main/SitRepo')

const {
  colorize
} = require('@main/utils/string')

describe('SitLogParser', () => {
  let model;
  const repo = new SitRepo()

  describe('#parseToCSV', () => {
    describe('when logFile exist', () => {
      // FIXME:
      // Why...?
      /**
       *   ● SitLogParser › #parseToCSV › when logFile exist › should return correctly

          expect(received).toEqual(expected) // deep equality

          - Expected  - 1
          + Received  + 1

          @@ -15,11 +15,11 @@
                "8b58f3891ae3e4d274972a39d27fd460aaeaa6cc",
                "yukihirop",
                "<te108186@gmail.com>",
                "1580961933681",
                "+0900",
          -     "clone: from 'https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=0'",
          ",    "clone: from https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=0
              ],
              Array [
                "master",
                "8b58f3891ae3e4d274972a39d27fd460aaeaa6cc",
                "2938ad2ab5722adf9b48ff5bac74989eaa2d144c",

            16 |           .mockReturnValueOnce('8b58f3891ae3e4d274972a39d27fd460aaeaa6cc')
            17 |
          > 18 |         expect(model.parseToCSV()).toEqual([
              |                                    ^
            19 |           ["branch", "beforesha", "aftersha", "username", "email", "unixtime", "timezone", "message"],
            20 |           ["master", "0000000000000000000000000000000000000000", "8b58f3891ae3e4d274972a39d27fd460aaeaa6cc", "yukihirop", "<te108186@gmail.com>", "1580961933681", "+0900", "clone: from 'https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=0'"],
            21 |           ["master", "8b58f3891ae3e4d274972a39d27fd460aaeaa6cc", "2938ad2ab5722adf9b48ff5bac74989eaa2d144c", "yukihirop", "<te108186@gmail.com>", "1583639422044", "+0900", "commit Add good_bye"]
      */
      describe('when replaceBlob is true', () => {
        xit('should return correctly', () => {
          model = new SitLogParser(repo, 'master', 'logs/refs/heads/master')
          jest.spyOn(repo, '_refBlobFromCommitHash').mockReturnValueOnce('0000000000000000000000000000000000000000')
            .mockReturnValueOnce('8b58f3891ae3e4d274972a39d27fd460aaeaa6cc')

          expect(model.parseToCSV()).toEqual([
            ["branch", "beforesha", "aftersha", "username", "email", "unixtime", "timezone", "message"],
            ["master", "0000000000000000000000000000000000000000", "8b58f3891ae3e4d274972a39d27fd460aaeaa6cc", "yukihirop", "<te108186@gmail.com>", "1580961933681", "+0900", "clone: from https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=0"],
            ["master", "8b58f3891ae3e4d274972a39d27fd460aaeaa6cc", "2938ad2ab5722adf9b48ff5bac74989eaa2d144c", "yukihirop", "<te108186@gmail.com>", "1583639422044", "+0900", "commit Add good_bye"]
          ])
        })
      })

      describe('when replaceBlob is false', () => {
        xit('should return correctly', () => {
          model = new SitLogParser(repo, 'master', 'logs/refs/stash')

          expect(model.parseToCSV(false)).toEqual([
            ["branch", "beforesha", "aftersha", "username", "email", "unixtime", "timezone", "message"],
            ["master", "0000000000000000000000000000000000000000", "3df8acdb918794c2bda15ae45fec2c5929ca4929", "yukihirop", "<te108186@gmail.com>", "1583663621190", "+0900", "WIP on master: 4e2b7c4 Add good_bye"],
            ["master", "3df8acdb918794c2bda15ae45fec2c5929ca4929", "00fa2d2f5b497b41e288f8c9bce3bf61515d3101", "yukihirop", "<te108186@gmail.com>", "1583747819860", "+0900", "On master: stash message"]
          ])
        })
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

  describe('#parseToJSON', () => {
    describe('whn logFile exist', () => {
      describe('when replaceBlob is true', () => {
        xit('should return correctly', () => {
          model = new SitLogParser(repo, 'master', 'logs/refs/heads/master')
          jest.spyOn(repo, '_refBlobFromCommitHash').mockReturnValueOnce('0000000000000000000000000000000000000000')
            .mockReturnValueOnce('8b58f3891ae3e4d274972a39d27fd460aaeaa6cc')

          expect(model.parseToJSON()).toEqual([
            { "aftersha": "8b58f3891ae3e4d274972a39d27fd460aaeaa6cc", "beforesha": "0000000000000000000000000000000000000000", "branch": "master", "email": "<te108186@gmail.com>", "message": "clone: from https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=0", "timezone": "+0900", "unixtime": "1580961933681", "username": "yukihirop" },
            { "aftersha": "2938ad2ab5722adf9b48ff5bac74989eaa2d144c", "beforesha": "8b58f3891ae3e4d274972a39d27fd460aaeaa6cc", "branch": "master", "email": "<te108186@gmail.com>", "message": "commit Add good_bye", "timezone": "+0900", "unixtime": "1583639422044", "username": "yukihirop" }
          ])
        })
      })

      describe('when replaceBlob is false', () => {
        xit('should return correctly', () => {
          model = new SitLogParser(repo, 'master', 'logs/refs/stash')

          expect(model.parseToJSON(false)).toEqual([
            { "aftersha": "3df8acdb918794c2bda15ae45fec2c5929ca4929", "beforesha": "0000000000000000000000000000000000000000", "branch": "master", "email": "<te108186@gmail.com>", "message": "WIP on master: 4e2b7c4 Add good_bye", "timezone": "+0900", "unixtime": "1583663621190", "username": "yukihirop" },
            { "aftersha": "00fa2d2f5b497b41e288f8c9bce3bf61515d3101", "beforesha": "3df8acdb918794c2bda15ae45fec2c5929ca4929", "branch": "master", "email": "<te108186@gmail.com>", "message": "On master: stash message", "timezone": "+0900", "unixtime": "1583747819860", "username": "yukihirop" }
          ])
        })
      })
    })

    describe('when logFile do not exist', () => {
      it('should return correctly', () => {
        model = new SitLogParser(repo, 'master', 'logs/refs/heads/hoge')
        expect(() => { model.parseToJSON() }).toThrowError("Do not exist file: test/localRepo/.sit/logs/refs/heads/hoge")
      })
    })
  })

  describe('#remakeLog', () => {
    describe('when specify stash@{0}', () => {
      xit('should return correctly', () => {
        model = new SitLogParser(repo, 'master', 'logs/refs/stash')
        expect(model.remakeLog('stash@{0}')).toEqual('0000000000000000000000000000000000000000 3df8acdb918794c2bda15ae45fec2c5929ca4929 yukihirop <te108186@gmail.com> 1583663621190 +0900	WIP on master: 4e2b7c4 Add good_bye\n')
      })
    })

    describe('when specify stash@{1}', () => {
      xit('should return correctly', () => {
        model = new SitLogParser(repo, 'master', 'logs/refs/stash')
        expect(model.remakeLog('stash@{1}')).toEqual('0000000000000000000000000000000000000000 00fa2d2f5b497b41e288f8c9bce3bf61515d3101 yukihirop <te108186@gmail.com> 1583747819860 +0900	On master: stash message\n')
      })
    })
  })

  describe('#parseForIndex', () => {
    describe('when specify stash', () => {
      xit('should reutrn correctly', () => {
        model = new SitLogParser(repo, 'master', 'logs/refs/stash')
        expect(model.parseForIndex('stash')).toEqual({
          "stash@{0}": {
            "aftersha": "00fa2d2f5b497b41e288f8c9bce3bf61515d3101",
            "beforesha": "3df8acdb918794c2bda15ae45fec2c5929ca4929",
            "branch": "master",
            "email": "<te108186@gmail.com>",
            "message": "On master: stash message",
            "timezone": "+0900",
            "unixtime": "1583747819860",
            "username": "yukihirop"
          },
          "stash@{1}": {
            "aftersha": "3df8acdb918794c2bda15ae45fec2c5929ca4929",
            "beforesha": "0000000000000000000000000000000000000000",
            "branch": "master",
            "email": "<te108186@gmail.com>",
            "message": "WIP on master: 4e2b7c4 Add good_bye",
            "timezone": "+0900",
            "unixtime": "1583663621190",
            "username": "yukihirop",
          }
        })
      })
    })
  })

  describe('#parseForLog', () => {
    describe('when specify stash', () => {
      it('should return correctly', () => {
        model = new SitLogParser(repo, 'master', 'logs/refs/stash')
        expect(model.parseForLog('stash')).toEqual(`\
${colorize('00fa2d2', 'info')} stash@{0}: On master: stash message
${colorize('3df8acd', 'info')} stash@{1}: WIP on master: 4e2b7c4 Add good_bye`)
      })
    })
  })
})
