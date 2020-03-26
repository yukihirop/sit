# .SitSetting

The file called `.sitsetting` is a file that contains the settings required to use the sit command.

- Path information to the credentials file to access `GoogleSpreadSheet`
- Schema information of tables managed in sit

etc...

## 1.0.0

|name|description|
|----|-----------|
|`version`|The version of the `sit` command. If it is not set correctly, the sit command cannot be used.|
|`sheet.gss.auth.credPath`|Path information to the credentials file to access `GoogleSpreadSheet`|
|`sheet.gss.openAPIV3Schema.type`|Settings according to [OpenAPI (V3)](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.0.md)|
|`sheet.gss.openAPIV3Schema.properties`|Settings according to [OpenAPI (V3)](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.0.md)|
|`sheet.gss.defaultWorksheet.rowCount`|Set the row of the sheet created by push|
|`sheet.gss.defaultWorksheet.colCount`|Set the column of the sheet created by push|
|`repo.local`|The name of the local repository|
|`dist.path`|Path to the directory where the csv file to be managed is located|
|`dist.sheetName`|Name of csv file to manage|

#### default value (1.0.0)

```yaml
version: 1.0.0
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
      colCount: 50
repo:
  local: .sit
dist:
  path: ./dist
  sheetName: "master_data.csv"
```
