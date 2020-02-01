// https://javascript.programmer-reference.com/js-string-byte-length/
function getByteLength(str){
  str = (str==null)?"":str;
  return encodeURI(str).replace(/%../g, "*").length;
}


function findOrCreateSheet(sheetName, hidden) {
  var findSh = SpreadsheetApp.getActive().getSheetByName(sheetName);

  if (findSh) {
    return findSh;
  } else {
    var sh = SpreadsheetApp.getActiveSpreadsheet();
    var ish = sh.insertSheet(sheetName);
    ish.protect();

    if (hidden) {
      ish.hideSheet();
    }

    return ish;
  }
}

function insertOrUpdate(sheet, data) {
  var row = findRow(sheet, data[0], 0);
  if (row) {
    sheet.getRange(row, 1, 1, data.length).setValues([data])
  } else {
    sheet.appendRow(data);
  }
}

function findRow(sheet, target, col) {
  var values = sheet.getDataRange().getValues();

  for (var i = 0; i < values.length; i++) {
    var value = values[i][col]
    if (value == target) {
      return i + 1;
    }
  }
  return false;
}

function getShownSheetNames() {
  const ignoreSheets = [REMOTE_REF];
  var allSheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  var sheetNames = [];
  var sheetName = '';
  if (allSheets.length >= 1) {
    for (var i = 0; i < allSheets.length; i++) {
      if (!allSheets[i].isSheetHidden()) {
        sheetName = allSheets[i].getName().toString();
        if (ignoreSheets.indexOf(sheetName) == -1) {
          sheetNames.push(sheetName);
        }
      }
    }
  }
  return sheetNames;
}

function getDiffBranches() {
  var sheetsBranches = getShownSheetNames();
  var refsBranches = getColumValues(REMOTE_REF, 'A', 1)
  var result = refsBranches.filter(function (branch) {
    return sheetsBranches.indexOf(branch) == -1
  });
  return result;
}

// https://www.monotalk.xyz/blog/google-apps-script-%E3%81%A7%E3%82%B9%E3%83%97%E3%83%AC%E3%83%83%E3%83%89%E3%82%B7%E3%83%BC%E3%83%88%E3%81%AE%E5%88%97%E3%81%AE%E5%80%A4%E3%82%92%E5%8F%96%E5%BE%97%E3%81%99%E3%82%8B/
function getColumValues(sheetName, columnName, startIndex) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  var values = sheet.getRange(columnName + ":" + columnName).getValues();
  var result = new Array();
  for (var i = 0; i < values.length; i++) {
    if (i >= startIndex) {
      if (values[i] != null && values[i] != "") {
        result.push(values[i][0]);
      }
    }
  }
  return result;
}

// 参考
// https://www.pre-practice.net/2018/01/blog-post_21.html
function getRow(key, col, sh) {
  var array = getArray(sh, col);
  var row = array.indexOf(key) + 1;
  return row;
}

function getArray(sh, col) {
  var last_row = sh.getLastRow();
  var range = sh.getRange(col + "1:" + col + last_row)
  var values = range.getValues();
  var array = [];
  for (var i = 0; i < values.length; i++) {
    array.push(values[i][0]);
  }
  return array;
}
