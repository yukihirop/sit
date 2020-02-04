# sit

Management for Sheet (ex: GoogleSpreadSheet) like git

## 📦 Installation

```bash
npm install -g sit
```

## 🚀 Tutorial

```bash
sit init
#
# Configure .sitsetting
#
# repo init
sit repo init
# clasp init
sit clasp init
# clasp
clasp push
clasp deploy
# Fetch sheet
sit fetch origin develop
sit merge origin develop
# status
sit status
# diff
sit diff
# checkout
sit checkout -b develop
sit checkout master
# commit
sit commit -m 'initial commit'
# Update sheet
sit push origin master
```

## 📖 Usage

```bash
sit -h
Usage: sit [options] [command]

sit cli

Options:
  -V, --version                          output the version number
  -h, --help                             output usage information

Commands:
  cat-file [options] <hash>              cat sit objects
  hash-object [options] <path>           compute hash sit object
  branch [options]                       operate branch
  checkout [options] [name]              checkout branch
  status                                 status dist file
  diff                                   diff dist file
  commit [options]                       commit dist file
  push [options] <repository> <branch>   push rows into Sheet
  fetch [options] <repository> <branch>  fetch rows from Sheet
  merge [options] [repository] [branch]  merge rows
  clone [options] <repository> <url>     clone rows from sheet
  browse-remote [repository]             browse remote repository
  config [options] <key> <value>         configure sitconfig
  init                                   create setting file (.sitsetting)
  clasp                                  clasp cli
  repo                                   repo cli
```

## ❤️ Support Sheets

- GoogleSpreadSheet

## ⚙ .sitsetting

The configuration file called `.sitsetting` is a file that contains all settings.

- Schema information file managed by GoogleSpreadSheet.
- Authentication information for using GoogleSpreadSheetAPI.
- Information such as output destination of deliverables.


The default settings are as follows:

```yaml
---
version: "1.0.0"
sheet:
  gss:
    auth:
      credPath: ./creds.json
    openAPIV3Schema:
      type: object
      properties:
        ja:
          type: string
          description: 日本語
        en:
          type: string
          description: 英語
        key:
          type: string
          description: キー
    defaultWorksheet:
      rowCount: 50
      colCount: 20
repo:
  local: ./.sit
dist:
  path: ./dist
  sheetName: "master_data.csv"
```
