## NAME

`sit init` - Create `.sitsetting`

## SYNOPSIS

```
sit init
```

## DESCRIPTION

Create ｃonfiguration file called　`.sitsetting`.　

By default, GoogleSpreadSheet will be treated as a remote repository.

Therefore, set the path of the `credentials` file so that `GoogleSpreadSheet` can be accessed in `credPath`.

Then set the schema(`openAPI3Schema`) of the table you want to manage correctly

Later you can freely change the name of the local repository.


`.sitsetting`

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
      rowCount: 10000
      colCount: 20
repo:
  local: .sit
dist:
  path: ./dist
  sheetName: "master_data.csv"
```

![image](https://user-images.githubusercontent.com/11146767/77722191-6268d500-7030-11ea-85dd-4cc8cdb16789.png)

## EXAMPLE

```bash
$ sit init
created setting file: /Users/fukudayu/JavaScripts/sit-sample/.sitsetting
```
