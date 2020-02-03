'use strict';

class SitObject {
  constructor(repo, data, size = 0) {
    this.repo = repo;
    this.data = data;
    this.size = size;
    this.deserialize(data);
  }
}

module.exports = SitObject;
