'use strict';

class SitObject {
  constructor(repo, data, size) {
    this.repo = repo;
    this.data = data;
    this.size = size;
    this.deserialize(data);
  }
}

module.exports = SitObject;
