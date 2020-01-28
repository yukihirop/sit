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
# Configure .sitconfig
#
# repo init
sit repo init
# clasp init
sit clasp init
# clasp
clasp push
clasp deploy
# Fetch sheet
sit fetch origin master
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
  fetch [options] <repository> <branch>  fetch rows from Sheet
  cat-file [options] <hash>              cat sit objects
  hash-object [options] <path>           compute hash sit object
  branch [options]                       display local branch
  checkout [options] [name]              checkout branch
  status                                 status dist file
  diff                                   diff dist file
  commit [options]                       commit dist file
  push [options] <repository> <branch>   push rows into Sheet
  init                                   create setting file (.sitconfig)
  clasp                                  clasp cli
  repo                                   repo cli
```

## ❤️ Support Sheets

- GoogleSpreadSheet

## ⚙ .sitconfig

The configuration file called `.sitconfig` is a file that contains all settings.

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
repo:
  local: ./.sit
  remote:
    origin: <your/GoogleSpreadSheet/url>
dist:
  path: ./dist
  sheetName: "master_data.csv"
```
