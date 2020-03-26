
## NAME

[clasp](https://github.com/google/clasp/) - Command Line Apps Script Projects


## DESCRIPTION

Generate GoogleSpreadSheet that can be clasp managed by `clasp create --type sheets`.

and use only `clasp push` and `clasp deploy` to update GoogleSpreadSheet GAS script.
GoogleSpreadSheet will be able to act as a pseudo repository for this GAS script.

## TUTORIAL

First create a googlespreadsheet using `clasp create --type sheets`

```bash
$ clasp create --type sheets
Created new Google Sheet: https://drive.google.com/open?id=1Xrmd_Ox-isTd-mNgySH7nlnjXKMnoDVqr4YZxstsYOI
Created new Google Sheets Add-on script: https://script.google.com/d/1Zdqd98YgDBotlQqaQosaOeHx3VzwJ_rLywbygc41koFQ_urWJf5DDLKo/edit
Warning: files in subfolder are not accounted for unless you set a '.claspignore' file.
Cloned 1 file.
└─ appsscript.json
```

GoogleSpreadSheet was generated.

!>Since the displayed Google Drive url does not support sit,
!>please access and get the GoogleSpreadSheet URL.


So click `https://drive.google.com/open?id=1Xrmd_Ox-isTd-mNgySH7nlnjXKMnoDVqr4YZxstsYOI` get url.

like this: https://docs.google.com/spreadsheets/d/1Xrmd_Ox-isTd-mNgySH7nlnjXKMnoDVqr4YZxstsYOI/edit#gid=0

This URL will be the URL to the repository as compared on github.

If you do [sit init](getting-started/init) and [sit repo init](getting-started/repo-init),

scripts for clasp will be generated.

```bash
$ ls -al .sit/scripts/clasp
total 20
drwxr-xr-x 7 yukihirop  224  3 27 15:05 .
drwxr-xr-x 3 yukihirop   96  3 27 15:05 ..
-rw-r--r-- 1 yukihirop   28  3 27 15:05 .claspignore
-rw-r--r-- 1 yukihirop  888  3 27 15:05 Code.js
-rw-r--r-- 1 yukihirop 1918  3 27 15:05 RemoteRepo.js
-rw-r--r-- 1 yukihirop  361  3 27 15:05 const.js
-rw-r--r-- 1 yukihirop 3214  3 27 15:05 util.js
```

Upload this generated script with `clasp push` and deploy with `clasp deploy`.

```bash
$ clasp push
└─ .sit/scripts/clasp/Code.js
└─ .sit/scripts/clasp/RemoteRepo.js
└─ .sit/scripts/clasp/const.js
└─ .sit/scripts/clasp/util.js
└─ appsscript.json
Pushed 5 files.
```

```bash
$ clasp deploy
Created version 1.
- AKfycbxEfOaysKXp0DyrvRTm1AtoMeqV7EtwB8hoco6tIpQNpPMsn5cAXz3Gtd-r1FcNgu-r @1.
```

Let's check with `clasp open`.

![image](https://user-images.githubusercontent.com/11146767/77727185-0eb0b880-703d-11ea-83e7-93262f0a01f7.png)


Now `GoogleSpreadSheet` can behave as a pseudo-remote repository.


## WHAT IS PSEUDO REMOTE REPOSITORY ?

The initial state of GoogleSpreadSheet after the clasp script is applied is as follows

![image](https://user-images.githubusercontent.com/11146767/77727659-263c7100-703e-11ea-85ae-90f3389ab580.png)

Actually, there is a hidden sheet and when all are displayed, it is as follows.

hidden sheet:

- `refs/remotes`
- `logs/refs/remotes`

The name of each sheet is reserved and plays an important role.


### refs/remotes

![image](https://user-images.githubusercontent.com/11146767/77727824-7adfec00-703e-11ea-8c9c-72cd0ab400d6.png)

This sheet has the role of calculating and recording `SHA1` of the writing sheet (blob).

`SHA1` is updated when a sheet is edited or reloaded.

!> If you create or delete the sheet manually, the `SHA1` value in the `refs/remotes` sheet will __not be updated__, so please reload.

This feature allows other users to know through the sit command whether the sheet has been updated.

### logs/refs/remotes

![image](https://user-images.githubusercontent.com/11146767/77729159-56394380-7041-11ea-8dfe-2ae166e3e43d.png)

`.sit/logs/refs/HEAD` logs are registered using `beforesha` and `aftersha` in blob format.

The example of the image is an example after　`sit push origin master`.

Thanks to this sheet, you can see who updated which sheet (`branch`) and when.

>This sheet is not affected by the clasp script.
>So once recorded, the value must not change.
