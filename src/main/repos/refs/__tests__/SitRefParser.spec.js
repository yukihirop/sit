'use strict';

const SitBaseRepo = require('@repos/base/SitBaseRepo')
const SitRefParser = require('@repos/refs/SitRefParser');
const {
  colorize
} = require('@utils/string');

describe('SitRefParser', () => {
  let model;
  const repo = new SitBaseRepo

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('#parseToCSV', () => {
    describe('when refFile exist', () => {
      it('should return correctly', () => {
        jest.spyOn(repo, '_refBlobFromCommitHash').mockReturnValueOnce('4e2b7c47eb492ab07c5d176dccff3009c1ebc79b')
        model = new SitRefParser(repo, 'master', 'refs/heads/master')
        expect(model.parseToCSV()).toEqual([
          ["branch", "sha1"],
          ["master", "4e2b7c47eb492ab07c5d176dccff3009c1ebc79b"]
        ])
      })
    })
  })

  describe('#isRemote', () => {
    describe("refFile include 'refs/remotes'", () => {
      it('should return correctly', () => {
        model = new SitRefParser(repo, 'origin/develop', 'refs/remotes/origin/develop')
        expect(model.isRemote()).toEqual(true)
      })
    })

    describe("refFile do not include 'refs/remotes'", () => {
      it('should return correctly', () => {
        model = new SitRefParser(repo, 'develop', 'refs/heads/develop')
        expect(model.isRemote()).toEqual(false)
      })
    })
  })

  describe('#displayedBranch', () => {
    describe("refFile include 'refs/remotes'", () => {
      it('should return correctly', () => {
        model = new SitRefParser(repo, 'origin/develop', 'refs/remotes/origin/develop')
        expect(model.displayedBranch()).toEqual(colorize("remotes/origin/develop", 'mark'))
      })
    })

    describe("refFile do not include 'refs/remotes'", () => {
      it('should return correctly', () => {
        model = new SitRefParser(repo, 'develop', 'refs/heads/develop')
        expect(model.displayedBranch()).toEqual('develop')
      })
    })
  })
})
