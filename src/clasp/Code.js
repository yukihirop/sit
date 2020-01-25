function onOpen(e) {
  findOrCreateSheet(MASTER_BRANCH, false)
  findOrCreateSheet(REMOTE_REF, true)

  // Add header
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  var wh = sheet.getSheetByName(REMOTE_REF);
  insertOrUpdate(wh, REMOTE_REF_HEADER);

  getShownSheetNames().forEach(function (branch) {
    appendRef(REMOTE_REF, branch);
  });

  getDiffBranches().forEach(function (branch) {
    deleteRef(REMOTE_REF, branch);
  });
}

function onEdit(e) {
  getShownSheetNames().forEach(function (branch) {
    appendRef(REMOTE_REF, branch);
  });

  getDiffBranches().forEach(function (branch) {
    deleteRef(REMOTE_REF, branch);
  });
}
