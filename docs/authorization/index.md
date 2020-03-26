# Authorization

Describes authentication.

This authentication is for operating GoogleSpreadSheet.

There are two ways of authentication,

one is to `read the credentials json file` and the other is `to set the environment variables`.

## Read the credentials json file

Access the `GoogleCloudPlatform` and issue a service acccount.

![image](https://user-images.githubusercontent.com/11146767/77819902-d0d99000-7121-11ea-83d6-accdefa8bbef.png)

Then download the authentication file as `creds.json`.

![image](https://user-images.githubusercontent.com/11146767/77820003-72f97800-7122-11ea-807d-d4e4f86f748b.png)

If you can download it correctly.

![image](https://user-images.githubusercontent.com/11146767/77820057-cf5c9780-7122-11ea-9459-ad2763dc066d.png)

Finally, update your `.sitsetting`.

You didn't need to do anything this time because the default name is `creds.json`.

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
      colCount: 20
repo:
  local: .sit
dist:
  path: ./dist
  sheetName: master_data.csv
```

However, it is not possible to access `GoogleSpreadSheet` by this alone, so you need to access

`GoogleSpreadSheet` and set up sharing.

## To set the environment variables

Set the environment variables `SIT_GOOGLE_SERVICE_ACCOUNT_EMAIL` and `SIT_GOOGLE_PRIVATE_KEY`.

If the downloaded `creds.json` is in the following state.

```json
{
  "type": "service_account",
  "project_id": "project_id",
  "private_key_id": "private_key_id",
  "private_key": "-----BEGIN PRIVATE.........",
  "client_email": "sit-tutorial@<project_key_id>.iam.gserviceaccount.com",
  "client_id": "client_id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/...."
}
```

Set the environment variables as follows. Set the values ​​for `client_email` and `private_key`.

```bash
export SIT_GOOGLE_SERVICE_ACCOUNT_EMAIL='sit-tutorial@<project_key_id>.iam.gserviceaccount.com'
export SIT_GOOGLE_PRIVATE_KEY='-----BEGIN PRIVATE.........'
```

However, it is not possible to access `GoogleSpreadSheet` by this alone, so you need to access

`GoogleSpreadSheet` and set up sharing.

## Setting Sharing GoogleSpreadSheet

Set sharing settings for `client_email` written in downloaded `creds.json`.

![image](https://user-images.githubusercontent.com/11146767/77845415-b834ad00-71e9-11ea-9e29-bd7e0e92359b.png)

You now have full access to `GoogleSpreadSheet`.
