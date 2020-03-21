'use strict';

const SitBlob = require('../SitBlob');

describe('SitBlob', () => {
  const mockRepo = jest.fn();
  const model = new SitBlob(mockRepo, '1,2,3\n4,5,6', 7);

  describe('constructor', () => {
    it('should return correctly', () => {
      expect(model.fmt).toEqual('blob');
      expect(model.repo).toEqual(mockRepo);
      expect(model.size).toEqual(7);
      expect(model.data).toEqual('1,2,3\n4,5,6');
    });
  });

  describe('#serialize', () => {
    it('should return correctly', () => {
      expect(model.serialize()).toEqual('1,2,3\n4,5,6');
    });
  });

  describe('#deserialize', () => {
    it('should return correctly', () => {
      model.deserialize('1,2,3\n4,5,6\n7,8,9');
      expect(model.data).toEqual('1,2,3\n4,5,6\n7,8,9');
    });
  });
});
