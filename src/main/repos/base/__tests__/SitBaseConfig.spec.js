'use strict';

const SitBaseConfig = require('../SitBaseConfig')

describe('SitBaseConfig', () => {
  const model = new SitBaseConfig('local')

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('#update', () => {
    it('should return correctly', () => {
      // Mock is not done unless mockReturnValue is written
      const mockModel__updateUserAttribute = jest.spyOn(model, '_updateUserAttribute').mockReturnValue()
      model.update('user.name', 'testname')
      expect(mockModel__updateUserAttribute).toHaveBeenCalled()
    })
  })

  describe('#_updateUserAttribute', () => {
    describe('when key is name', () => {
      it('should return correctly', () => {
        const mockModel__updateUsername = jest.spyOn(model, '_updateUsername').mockReturnValue()
        model._updateUserAttribute('name', 'testname')
        expect(mockModel__updateUsername).toHaveBeenCalled()
      })
    })
  })

  describe('_createConfig', () => {
    describe('when type is local', () => {
      it('should return correctly', () => {
        expect(new SitBaseConfig('local')._createConfig()).toEqual(
          {
            "branch": {
              "master": {
                "merge": "refs/heads/master", "remote": "origin"
              }
            },
            "remote": {
              "origin": {
                "fetch": "+refs/heads/*:refs/remotes/origin/*", "type": "GoogleSpreadSheet", "url": "https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=0"
              }
            }
          }
        )
      })
    })
  })
})
