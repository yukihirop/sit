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
  var result = values.reduce(function (acc, value) {
    return acc = acc + value + '\n';
  }, []);
  var store = 'blob' + ' ' + result.length + '\0' + result;
  return toSHA1(store);
}

function toSHA1(text) {
  var rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_1, text);
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
