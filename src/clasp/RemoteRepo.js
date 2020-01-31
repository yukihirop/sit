function appendRef(remoteRef, branch) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  var wh = sheet.getSheetByName(remoteRef);
  var txtHash = calcBranchHash(branch);
  insertOrUpdate(wh, [branch, txtHash]);
}

function deleteRef(remoteRef, branch) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  var wh = sheet.getSheetByName(remoteRef);
  var row = getRow(branch, 'A', wh);
  wh.deleteRows(row, 1);
}

function calcBranchHash(branch) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  var origRange = sheet.getSheetByName(branch).getDataRange();
  var values = origRange.getValues();

  var header = values[0].filter(function (item) { return (item !== '' && item !== undefined) });
  var headerCount = header.length;

  values = values.map(function (item) { return item.slice(0, headerCount) });
  // MEMO: [[1,2,3],[,,]] => [[1,2,3]]
  values = values.filter(function (value) { return value.filter(function (item) { return item }).length > 0 });

  var result = values.reduce(function (acc, value) {
    return acc = acc + value.join(',') + '\n';
  }, '');
  var store = 'blob' + ' ' + getByteLength(result) + '\0' + result;
  return toSHA1(store);
}

// https://blog.mosuke.tech/entry/2018/12/20/slideshare-api-by-gas/
// https://blog.keinos.com/20170525_2324
function toSHA1(text) {
  var rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_1, text, Utilities.Charset.UTF_8);
  var txtHash = "";

  for (i = 0; i < rawHash.length; i++) {
    var hashVal = rawHash[i];
    if (hashVal < 0) {
      hashVal += 256;
    }
    if (hashVal.toString(16).length == 1) {
      txtHash += '0';
    }
    txtHash += hashVal.toString(16);
  }
  return txtHash;
}
