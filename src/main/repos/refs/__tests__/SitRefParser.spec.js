'use strict';

const SitRefParser = require('@repos/refs/SitRefParser');
const {
  colorize
} = require('@utils/string');

describe('SitRefParser', () => {
  let model;

  describe('#parseToCSV', () => {
    describe('when refFile exist', () => {
      it('should return correctly', () => {
        model = new SitRefParser('master', 'refs/heads/master')
        expect(model.parseToCSV()).toEqual([
          ["branch", "sha1"],
          ["master", "953b3794394d6b48d8690bc5e53aa2ffe2133035"]
        ])
      })
    })
  })

  describe('#isRemote', () => {
    describe("refFile include 'refs/remotes'", () => {
      it('should return correctly', () => {
        model = new SitRefParser('origin/develop', 'refs/remotes/origin/develop')
        expect(model.isRemote()).toEqual(true)
      })
    })

    describe("refFile do not include 'refs/remotes'", () => {
      it('should return correctly', () => {
        model = new SitRefParser('develop', 'refs/heads/develop')
        expect(model.isRemote()).toEqual(false)
      })
    })
  })

  describe('#displayedBranch', () => {
    describe("refFile include 'refs/remotes'", () => {
      it('should return correctly', () => {
        model = new SitRefParser('origin/develop', 'refs/remotes/origin/develop')
        expect(model.displayedBranch()).toEqual(colorize("remotes/origin/develop", 'mark'))
      })
    })

    describe("refFile do not include 'refs/remotes'", () => {
      it('should return correctly', () => {
        model = new SitRefParser('develop', 'refs/heads/develop')
        expect(model.displayedBranch()).toEqual('develop')
      })
    })
  })
})
