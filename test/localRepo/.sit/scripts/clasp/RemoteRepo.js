function appendRef(remoteRef, branch) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  const wh = sheet.getSheetByName(remoteRef);
  const txtHash = calcBranchHash(branch);
  insertOrUpdate(wh, [branch, txtHash]);
}

function deleteRef(remoteRef, branch) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  const wh = sheet.getSheetByName(remoteRef);
  const row = getRow(branch, 'A', wh);
  wh.deleteRows(row, 1);
}

function calcBranchHash(branch) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  const origRange = sheet.getSheetByName(branch).getDataRange();
  let values = origRange.getValues();

  const header = values[0].filter(function (item) { return (item !== '' && item !== undefined) });
  const headerCount = header.length;

  values = values.map(function (item) { return item.slice(0, headerCount) });
  // MEMO: [[1,2,3],[,,]] => [[1,2,3]]
  values = values.filter(function (value) { return value.filter(function (item) { return item }).length > 0 });

  /*
  * ***********************************************************************************
  * GAS scripts cannot use null-terminated strings(\0). I can't help but escape and use
  * ***********************************************************************************
  */
  const result = values.join('\n')
  const store = 'blob' + ' ' + getByteLength(result) + '\\0' + result;
  return toSHA1(store);
}

// https://blog.mosuke.tech/entry/2018/12/20/slideshare-api-by-gas/
// https://blog.keinos.com/20170525_2324
function toSHA1(text) {
  const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_1, text, Utilities.Charset.UTF_8);
  let txtHash = "";

  for (i = 0; i < rawHash.length; i++) {
    let hashVal = rawHash[i];
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
