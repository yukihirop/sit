'use strict';

const SitBase = require('../base/SitBase');
const PROHIBITED_STR_REGEXP = /[\^,@,\0,!,?,*]/
const RESERVED_RESERVED_BRANCH_PREFIX = '[pr]'
const RESERVED_BRANCH = [
  'refs/remotes',
  'logs/refs/remotes'
]

class SitRepoValidator extends SitBase {

  constructor(opts) {
    super(opts)
    this.errors = []
  }

  isBranch(branch) {
    const pattern = new RegExp(PROHIBITED_STR_REGEXP)
    const includeInvalidStr = pattern.test(branch)
    const includeReservedBranch = RESERVED_BRANCH.indexOf(branch) !== -1
    const includeReservedBranchPrefix = branch.startsWith(RESERVED_RESERVED_BRANCH_PREFIX)

    if (includeInvalidStr || includeReservedBranch || includeReservedBranchPrefix) {
      this.errors.push(new Error(`fatal: '${branch}' is not a valid branch name.`))
      return false
    } else {
      return true
    }
  }
}

module.exports = SitRepoValidator;
