function onOpen(e) {
  findOrCreateSheet(MASTER_BRANCH, false)
  findOrCreateSheet(REMOTE_REF, true)
  findOrCreateSheet(REMOTE_LOG_REF, true)
  deleteDefaultSheet()

  let sheet, wh;

  // logs/refs/remotes
  sheet = SpreadsheetApp.getActiveSpreadsheet();
  wh = sheet.getSheetByName(REMOTE_LOG_REF);
  insertOrUpdate(wh, REMOTE_LOG_REF_HEADER);

  // refs/remotes
  sheet = SpreadsheetApp.getActiveSpreadsheet();
  wh = sheet.getSheetByName(REMOTE_REF);
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
