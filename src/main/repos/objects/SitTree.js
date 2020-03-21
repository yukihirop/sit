

const SitObject = require('./SitObject');

class SitTree extends SitObject {
  constructor(repo, data, size) {
    super(repo, data, size);
    this.fmt = 'tree';
  }
}

module.exports = SitTree;
