# sit

 Git like management for Sheet (ex: GoogleSpreadSheet)

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
# Fetch sheet
sit fetch origin master
# Update sheet
sit push origin master
# cat-file
sit cat-file
# compute sit object
sit hash-object
```

## 📖 Usage

```bash
$ sit -h
Usage: sit [options] [command]

sit cli

Options:
  -V, --version                          output the version number
  -h, --help                             output usage information

Commands:
  fetch [options] <repository> <branch>  fetch rows from Sheet
  push [options] <repository> <branch>   push rows into Sheet
  cat-file [options] <hash>              cat sit objects
  hash-object [options] <path>           compute hash sit object
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
