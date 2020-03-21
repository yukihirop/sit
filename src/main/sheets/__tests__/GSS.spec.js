/* eslint-disable  camelcase, import/no-unresolved */



const GSS = require('@sheets/GSS');

describe('GSS', () => {
  const model = new GSS();

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('#loadInfo', () => {
    it('should return correctly', (done) => {
      model.loadInfo('origin', (doc, sheets) => {
        expect(doc).not.toBeNull();
        expect(sheets).not.toBeNull();
        done();
      });
    });
  });

  describe('#getSheetNames', () => {
    it('should return correctly', (done) => {
      model.getSheetNames('origin', (result) => {
        expect(result).not.toBeNull();
        done();
      });
    });
  });

  describe('#getRows', () => {
    describe('when sheet exist', () => {
      it('should return correctly', (done) => {
        model.getRows('origin', 'refs/remotes', ['branch', 'sha1'])
          .then(rows => {
            expect(rows).not.toBeNull();
            done();
          });
      });
    });

    describe('when sheet do not exist', () => {
      it('should return correctly', (done) => {
        model.getRows('origin', 'do_not_exist')
          .catch(err => {
            expect(err.message).toEqual('Do not exist sheet: do_not_exist');
            done();
          });
      });
    });
  });

  describe('#_rows2CSV', () => {
    it('should return correctly', () => {
      const header = ['日本語', '英語', 'キー'];
      const mockRows = [
        { 日本語: 'こんにちは', 英語: 'hello', キー: 'greeting.hello' },
      ];
      expect(model._rows2CSV(mockRows, header)).toEqual([['日本語', '英語', 'キー'], ['こんにちは', 'hello', 'greeting.hello']]);
    });
  });
});
