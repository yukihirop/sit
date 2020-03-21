

const SitObject = require('./SitObject');

class SitBlob extends SitObject {
  constructor(repo, data, size) {
    super(repo, data, size);

    this.fmt = 'blob';
  }

  serialize() {
    return this.data;
  }

  deserialize(data) {
    this.data = data;
  }
}

module.exports = SitBlob;
