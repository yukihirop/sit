## What is sit?

`sit` is the very very very stupid csv content tracker.

It was born out of the idea that I wanted to manage `GoogleSpreadSheet `CSV data like `git`.

So `sit` is very similar to `git`. The name `sit` comes from `sheet git`.

But there are differences. `git` can be completed with just the git command, but sit is not.

It is necessary to additionally use the `clasp` command to manage the script of `GoogleSpreadSheet`.

We will actually explain through the tutorial. It is a table of contents.

- Initialize sit
- Create local repository
  - Setting user.name and user.email
- Create remote repository
  - Setting Sheet Sharing
- Edit data and Push for GoogleSpreadSheet
  - Create remote master sheet
  - Checkout and Edit data and Push
- Fetch from GoogleSpreadSheet
- Resolve Conflict
- Stash File Changes
- Create Pull Request

Let's start the tutorial!!!!


## Initialize sit

In `sit`, you need to create a settings file called `.sitsetting` before creating a local repository.

The minimum setting is the __Authentication setting__. See SitSetting for other settings.

```bash
$ mkdir sit-tutorial
$ cd sit-tutorial
$ sit init
created setting file: /Users/yukihirop/JavaScriptProjects/sit-tutorial/.sitsetting
```

`.sitsetting` is generated as below

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

Access the `GoogleCloudPlatform` and issue a service acccount.

![image](https://user-images.githubusercontent.com/11146767/77819902-d0d99000-7121-11ea-83d6-accdefa8bbef.png)

Then download the authentication file as `creds.json`.

![image](https://user-images.githubusercontent.com/11146767/77820003-72f97800-7122-11ea-807d-d4e4f86f748b.png)

If you can download it correctly.

![image](https://user-images.githubusercontent.com/11146767/77820057-cf5c9780-7122-11ea-9459-ad2763dc066d.png)

I just want to be able to access GoogleSpreadSheet with this,

but I can not access it alone. The explanation is given in the chapter on `Create Remote Repository`.

!> Please make sure the Google Sheets API is enabled.

![image](https://user-images.githubusercontent.com/11146767/77845547-ac95b600-71ea-11ea-8ff4-013ced488bdd.png)

## Create local repository

Let's create a local repository. You can change the name of the local repository, but here we use the default `.sit`.

```bash
$ sit repo init
created local repository: ./.sit
created dist file: dist/master_data.csv
created script files: .sit/scripts/clasp
```

The following three files are generated at this time.

- Files for implementing sit management
- File `dist/master_data.csv` to be managed
- Script set in `GoogleSpreadSheet` (`clasp scripts`)


Use `clasp scripts` to create a remote repository.

### Setting user.name and user.email


By setting `user.name` and `user.email`, you can see who committed, etc., and the log will be meaningful.

There are `global` settings and `local` settings, but here we set them `local`.

```bash
sit config --local user.name yukihirop
sit config --local user.email yukihirop@example.com
```

You can see that it has been set in `.sit/config`.

```bash
$ cat .sit/config
[user]
name=yukihirop
email=yukihirop@example.com

[remote.origin]
type=GoogleSpreadSheet
url="https://docs.google.com/spreadsheets/d/1QPNoQcKGQrk1U9_5RP42y7YbWZMcPcN-Vn96wO2ZCh8/edit#gid=1549813878"
fetch=+refs/heads/*:refs/remotes/origin/*
```

## Create remote repository

The remote repository here is `GoogleSpreadSheet` that can behave as a pseudo repository by GAS script.

Therefore, it is necessary to generate `GoogleSpreadSheet` and set GAS script. This is done using the [clasp](https://github.com/google/clasp/) command.

First, create GoogleSpreadSheet.

```bash
$ clasp create --type sheets
Created new Google Sheet: https://drive.google.com/open?id=1QPNoQcKGQrk1U9_5RP42y7YbWZMcPcN-Vn96wO2ZCh8
Created new Google Sheets Add-on script: https://script.google.com/d/1GmpSBRbopUky8dkWTHIX88Vj47lHmH8q8melU_zkSEaM0uslRvozbj6c/edit
Warning: files in subfolder are not accounted for unless you set a '.claspignore' file.
Cloned 1 file.
└─ appsscript.json
```

You can't use it with `GoogleDrive` type url so access it and get `GoogleSpreadSheet` type url.

![image](https://user-images.githubusercontent.com/11146767/77844917-7570d600-71e5-11ea-84d7-7d3631018f72.png)

In this example, this URL is the URL of GoogleSpreadSheet.

`https://docs.google.com/spreadsheets/d/1QPNoQcKGQrk1U9_5RP42y7YbWZMcPcN-Vn96wO2ZCh8/edit#gid=0`

Set the acquired url to `origin`. You can now access the remote repository under the name `origin`.

```bash
$ sit remote add origin https://docs.google.com/spreadsheets/d/1QPNoQcKGQrk1U9_5RP42y7YbWZMcPcN-Vn96wO2ZCh8/edit\#gid\=0
```

Let's check if the settings are correct.

```bash
$ sit remote get-url origin
https://docs.google.com/spreadsheets/d/1QPNoQcKGQrk1U9_5RP42y7YbWZMcPcN-Vn96wO2ZCh8/edit#gid=0
```

Next, set the GAS script in the generated GoogleSpreadSheet. Use `clasp` command for setting.

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
- AKfycbx7zOoxj4opUQrqA0xtryXvxdYUihPgwGkeJwKmsul6wmf9V-kDbYEReZYU5Op56A7CgQ @1.
```

Let's check.

```bash
$ clasp open
Opening script: https://script.google.com/d/1GmpSBRbopUky8dkWTHIX88Vj47lHmH8q8melU_zkSEaM0uslRvozbj6c/edit
```

![image](https://user-images.githubusercontent.com/11146767/77845224-16609080-71e8-11ea-808a-75b6a2dc920e.png)

### Setting Sheet Sharing

Set sharing settings for `client_email` written in downloaded `creds.json`.

![image](https://user-images.githubusercontent.com/11146767/77845415-b834ad00-71e9-11ea-9e29-bd7e0e92359b.png)

You now have full access to `GoogleSpreadSheet`.

## Edit data and Push for GoogleSpreadSheet

### Create remote master sheet

Then update the data and push to `GoogleSpreadSheet`.

First, let's check the initial state.

```bash
$ sit status
On branch master

	modified: dist/master_data.csv

no changes added to commit
```

```bash
$ sit branch
```

```bash
$ sit diff
Index: 0000000..35daa93
===================================================================
--- a/dist/master_data.csv
+++ b/dist/master_data.csv
@@ -1,0 +1,1 @@
\ No newline at end of file
+日本語,英語,キー
\ No newline at end of file

```

This means that by default there is a difference for the header added.

First of all, you have to create a master branch like developing with github.

```bash
$ sit commit -m "Initial Commit"
[master 0aa608d] Initial Commit
```

```bash
$ sit push origin master
Writed objects: 100% (1/1)
Total 1
remote:
remote: Create a pull request for master on GoogleSpreadSheet by visiting:
remote:     https://docs.google.com/spreadsheets/d/1QPNoQcKGQrk1U9_5RP42y7YbWZMcPcN-Vn96wO2ZCh8/edit#gid=2143308413
remote:
To https://docs.google.com/spreadsheets/d/1QPNoQcKGQrk1U9_5RP42y7YbWZMcPcN-Vn96wO2ZCh8/edit#gid=2143308413
	* [new branch]	0000000..0aa608d  master -> master
```

Let's check if it was pushed correctly.

```bash
sit browse-remote
```

![image](https://user-images.githubusercontent.com/11146767/78094760-4be7c280-7410-11ea-912b-66196f532167.png)


### Checkout and Edit data and Push

Then, I'm currently on the `master` branch, so checkout to the `develop` branch.

```bash
$ sit checkout -b develop
Switched to a new branch 'develop'
```

```
$ sit branch
* develop
  master
```

Edit `dist/master_data.csv` like this.

```csv
日本語,英語,キー
こんにちは,hello,greeting.hello
```

Check the diff and commit.

```bash
$ sit diff
Index: 35daa93..b0122f0
===================================================================
--- a/dist/master_data.csv
+++ b/dist/master_data.csv
@@ -1,1 +1,2 @@
-日本語,英語,キー
\ No newline at end of file
+日本語,英語,キー
+こんにちは,hello,greeting.hello
\ No newline at end of file

```

```bash
$ sit commit -m "Initial Commit"
[develop 60243bc] Initial Commit
```

Let's check the log.

```bash
$ sit log
commit 60243bc893424001185de58890104bc49e853ae5 (HEAD -> develop)
Author: yukihirop <yukihirop@example.com>
Date: Sun Mar 0 18:33:57 2020 +0900 +0900

	Initial Commit

```

Now that the `commit` is successful, let's `push`.

```bash
$ sit push origin develop
Writed objects: 100% (1/1)
Total 1
remote:
remote: Create a pull request for develop on GoogleSpreadSheet by visiting:
remote:     https://docs.google.com/spreadsheets/d/1QPNoQcKGQrk1U9_5RP42y7YbWZMcPcN-Vn96wO2ZCh8/edit#gid=0
remote:
To https://docs.google.com/spreadsheets/d/1QPNoQcKGQrk1U9_5RP42y7YbWZMcPcN-Vn96wO2ZCh8/edit#gid=0
	* [new branch]	0000000..60243bc  develop -> develop
```

Now you have a `push`. Let's check with `browse-remote`.

```bash
$ sit browse-remote
```

![image](https://user-images.githubusercontent.com/11146767/77845934-7c9be200-71ed-11ea-829a-1d44dcbfe1fa.png)

## Fetch and Merge from GoogleSpreadSheet

Now suppose the contents of the `develop` branch are merged into the `master` branch and the `master sheet` is updated.

![image](https://user-images.githubusercontent.com/11146767/78098918-56f42000-741b-11ea-858f-f989aa9ae901.png)

!>Unfortunately, merging on `GoogleSpreadSheet` is manual.

Let's fetch the master branch.

```bash
$ sit fetch origin master
remote: Total 1
From https://docs.google.com/spreadsheets/d/1QPNoQcKGQrk1U9_5RP42y7YbWZMcPcN-Vn96wO2ZCh8/edit#gid=2143308413
  * branch		master	-> FETCH_HEAD
  0aa608d..5f027c5	master	-> origin/master
```

Let's check the contents that have been fetched.

```bash
$ sit cat-file -p 5f027c5
blob b0122f0795b0be80d51a7ff6946f00bf0300e723
parent 0aa608d96db68ac609bfb27de5036fe63a75fcd5
author yukihirop <yukihirop@example.com> 1585488810621 +0900
committer GoogleSpreadSheet <noreply@googlespreadsheet.com> 1585488810621 +0900

Merge from GoogleSpreadSheet/master
```

```bash
$ sit cat-file -p b0122f0795b0be80d51a7ff6946f00bf0300e723
日本語,英語,キー
こんにちは,hello,greeting.hello
```

This is the content of the `master` branch.

Now that you have confirmed that you have successfully fetched, let's `merge`.

```bash
$ sit merge origin master
The current branch is 'develop'
Sorry... Only the same branch ('origin/develop') on the remote can be merged
```

!> The local and remote branches that are merged by the sit specification must have matching names.

So you need to checkout to master branch once.

```bash
$ sit checkout master
Switched to branch 'master'
```

```bash
$ sit merge origin master
Updating b98f96a..aab61a3

Fast-forward
  dist/master_data.csv
  1 file changed
```

If you check the `dist/master_data.csv`, you can confirm that it has been merged.

```bash
$ cat dist/master_data.csv
日本語,英語,キー
こんにちは,hello,greeting.hello%
```

## Resolve Conflict

Suppose you manually modified the `master` sheet as follows:

![image](https://user-images.githubusercontent.com/11146767/77930836-57d76580-72e6-11ea-9b9f-5a41cb994557.png)


Let's `fetch` and `merge` in this state.

```bash
$ sit fetch origin master
remote: Total 1
From https://docs.google.com/spreadsheets/d/1QPNoQcKGQrk1U9_5RP42y7YbWZMcPcN-Vn96wO2ZCh8/edit#gid=1549813878
  * branch		master	-> FETCH_HEAD
  87fbc98..00323a3	master	-> origin/master
```

```bash
$ sit merge origin master
Two-way-merging dist/master_data.csv
CONFLICT (content): Merge conflict in dist/master_data.csv
two-way-merge failed; fix conflicts and then commit the result.
```

Conflict. Since sit objects cannot be managed in the remote repository in sit,

it is easy to conflict because two-way merging compares line units.

>sit merge strategy is two way merge

![image](https://user-images.githubusercontent.com/11146767/77931180-cddbcc80-72e6-11ea-86de-daf13f4b6d74.png)


Let's see the state of merge in this state.

```bash
$ sit merge --stat
fatal: You have not concluded your merge (MERGE_HEAD exists)
Please, commit your changes before you merge.
```

There is a message that `MERGE_HEAD` exists and resolve the conflict.

Let's undo the `merge`. `dist/master_data.csv` is restored.

```bash
$ sit merge --abort
$ sit merge --stat
Already up to date.
```

![image](https://user-images.githubusercontent.com/11146767/77932990-40e64280-72e9-11ea-8806-0c2b4e33e8ae.png)

```bash
$ sit merge origin master
Two-way-merging dist/master_data.csv
CONFLICT (content): Merge conflict in dist/master_data.csv
two-way-merge failed; fix conflicts and then commit the result.
```

Remove conflict as follows and try `--continue`.

![image](https://user-images.githubusercontent.com/11146767/77934118-966f1f00-72ea-11ea-92eb-17cc014ab99c.png)

```bash
$ sit merge --continue
hint: Waiting for your editor to close the file...
```

![image](https://user-images.githubusercontent.com/11146767/77934276-d0d8bc00-72ea-11ea-9ab3-f86611f779d0.png)

Close the launched file and press `Ctrl + C` to complete the `merge`.

```bash
$ sit merge --continue
hint: Waiting for your editor to close the file...
^C
```

Let's check the status.

```bash
$ sit merge --stat
Already up to date.
```

```bash
$ sit log
commit aab61a36fff2bf2dacc87d416a83b6c0e15a569c (HEAD -> master)
Author: yukihirop <yukihirop@example.com>
Date: Tue Mar 2 00:21:45 2020 +0900 +0900

	Merge from GoogleSpreadSheet/master

commit b98f96a746dba25e2c927beda41cf9fa361a44ab
Author: yukihirop <yukihirop@example.com>
Date: Tue Mar 2 00:11:31 2020 +0900 +0900

	Initial Commit

```

Merged successfully.

## Stash File Changes

Let's edit the file as follows and `stash` it.

![image](https://user-images.githubusercontent.com/11146767/77989866-d241cd00-735a-11ea-85a7-d56c8dc74871.png)

```bash
$ sit stash save
Saved working directory and index state WIP on master: 5fe2e48 Merge remote-tracking branch 'origin/master'
```

Let's check the details of stash.　Let's check the `dist/master_data.csv` file.

![image](https://user-images.githubusercontent.com/11146767/77990168-a4a95380-735b-11ea-810d-df676b079f24.png)


```bash
$ sit stash list
ffe9070 stash@{0}: On master: WIP
```

```bash
$ sit stash show -p stash@{0}
Index: 9bb9157..0e90f47
===================================================================
--- a/dist/master_data.csv
+++ b/dist/master_data.csv
@@ -1,3 +1,4 @@
 日本語,英語,キー
 こんにちは,hello,greeting.hello
-おやすみ,good night,greeting.good_night
\ No newline at end of file
+おやすみ,good night,greeting.good_night
+歓迎します,wellcome,greeting.wellcome
\ No newline at end of file

```

Let's restore the contents of the stash. Let's use `apply` .

```bash
$ sit stash apply stash@{0}
On branch master
Changes not staged for commit:

	modified:	dist/master_data.csv

no changes added to commit
```

> `stash@{0}` is　can be omitted. But `stash@{n} (n > 0)` cannot be omitted.

Let's `stash` it again and then `pop` it back.

```bash
$ sit stash save "WIP"
Saved working directory and index state On master: WIP
```

```bash
$ sit stash list
2f077ef stash@{0}: On master: WIP
7284116 stash@{1}: WIP on master: 08d2106 Merge remote-tracking branch 'origin/master'
```

```bash
$ sit stash pop
On branch master
Changes not staged for commit:

	modified:	dist/master_data.csv

Dropped stash@{0} (2f077ef6551e339e1808e6fbb38f27424be46b8d)
```

As with `git`, `pop` deletes the contents of the stash.

```
$ sit stash list
7284116 stash@{0}: WIP on master: 08d2106 Merge remote-tracking branch 'origin/master'
```

## Create Pull Request

We have added a new sheet to `GoogleSpreadSheet` with a name different from `master`, for example, `develop`, but you can also use pull as `GitHub` to send a pull request.

`master`

![image](https://user-images.githubusercontent.com/11146767/77992365-e2f54180-7360-11ea-9958-ba1c4810eba0.png)

`develop`

![image](https://user-images.githubusercontent.com/11146767/77992432-00c2a680-7361-11ea-8019-a6db4cd8d3e2.png)


Let's send a pull request from the `develop` branch to the `master` branch.



```bash
$ sit pull-request origin master...develop
Total 1
remote:
remote: Create a pull request for 'master' from 'develop' on GoogleSpreadSheet by visiting:
remote:     https://docs.google.com/spreadsheets/d/1xZ6egbhsuqIh8kMsfeg8vCkyFGabZQybcxKuc2F7Le4/edit#gid=2115668596
remote:
To https://docs.google.com/spreadsheets/d/1xZ6egbhsuqIh8kMsfeg8vCkyFGabZQybcxKuc2F7Le4/edit#gid=2115668596
	Please look at sheet: '[pr] master...develop' in GoogleSpreadSheet
```

> Unlike the `push` command, which generates a change in the local repository each time it is executed, the `pull-request` command is a stateless command and can be executed any number of times.

Take a look at `GoogleSpreadSheet`. I think that a seat is made with the name `[pr]master...develop`.

![image](https://user-images.githubusercontent.com/11146767/77992891-f5bc4600-7361-11ea-89b8-21e99bced717.png)


!>Sheet(branch) names starting with `[pr]` cannot be used as branch names because they are reserved for pull requests.

I think that there is a footer unlike other sheets. I will explain that.

|name|description|
|----|-----------|
|`created at`|Creation date|
|`reviewers`|Write a reviewer|
|`assignees`|The person who created this PR|
|`message`|Write a complete message so you can see the corrections made in this PR|
|`labels`|Please use it freely|
|`projects`|Please use it freely|
|`milestone`|Please use it freely|

At a minimum, I think that only `message` should be used.

This time, "go go" was added, so I wrote "Add go go" so that I could understand that.

![image](https://user-images.githubusercontent.com/11146767/77993996-35842d00-7364-11ea-8732-2d8148dd0417.png)


The following describes the `Status` column. `Three symbols` are used in the Status column.

|symbol|description|
|----|-----------|
|+|added|
|-|deleted|
|±|to_branch only|

This means that in the current example, the row with `index == 2` has changed, and the column with `index == 3` is only in `master` and remains as it is.

Since merging to the `master` sheet is not supported, if there is no problem,

please edit the `master` sheet manually by the person in charge.
