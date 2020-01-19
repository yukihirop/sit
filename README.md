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
sit fetch master
# Update sheet
sit push master
```

## 📖 Usage

```bash
$ sit -h
Usage: sit [options] [command]

sit cli

Options:
  -V, --version             output the version number
  -h, --help                output usage information

Commands:
  fetch [options] <branch>  fetch rows from Sheet
  push [options] <branch>   push locales to Sheet
  init                      create setting file (.sitconfig)
  clasp                     clasp cli
```

## ❤️ Support Sheets

- GoogleSpreadSheet

## ⚙ .transtory

The configuration file called `.sitconfig` is a file that contains all settings.

- Schema information of the translation file managed by GoogleSpreadSheet.
- Authentication information for using GoogleSpreadSheetAPI.
- Information such as output destination of deliverables.


The default settings are as follows:

```yaml
---
version: "1.0.0"
repo:
  local: ./.sit
  remote: *sheet_url
sheet:
  gss:
    url: &sheet_url <your/GoogleSpreadSheet/url>
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
local:
  distDirPath: ./dist/locales
```
