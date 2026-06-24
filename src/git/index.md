# Git

Git is a version-control tool: it records snapshots of your project so you can review history,
undo mistakes, and collaborate. You run it as `git <command>` in a terminal.

## One-time setup

Tell Git who you are; this name and email are stamped on every commit you make.

```bash
git config --global user.name "Ada Lovelace"
git config --global user.email "ada@example.com"
git config --global init.defaultBranch main
```

## Start a repository

`git init` turns a folder into a repo; `git clone` copies an existing one from a URL.

```bash
git init                                    # new repo in the current folder
git clone https://github.com/user/repo.git  # copy a remote repo
```

## The basic workflow

Edit files, **stage** the changes with `add`, then **commit** them with a message.

```bash
git status              # what changed?
git add file.txt        # stage one file
git add .               # stage everything
git commit -m "Add login form"
```

## See what changed

`git diff` shows unstaged edits; `git log` shows the commit history.

```bash
git diff                # changes not yet staged
git diff --staged       # changes that are staged
git log --oneline -5    # last 5 commits, compact
```

## Branches

A branch is a separate line of work. Create one, switch to it, and list them.

```bash
git branch feature-x        # create a branch
git switch feature-x        # move onto it
git switch -c feature-y     # create and switch in one step
git branch                  # list branches (* marks current)
```

## Merging

Bring another branch's commits into the one you're on with `merge`.

```bash
git switch main
git merge feature-x
# => Updating a1b2c3..d4e5f6  Fast-forward
```

## Remotes

A remote is a copy hosted elsewhere (e.g. GitHub). `push` sends commits up; `pull` brings them down.

```bash
git remote -v                       # list remotes
git push origin main                # upload your commits
git pull                            # fetch + merge remote changes
git fetch                           # download without merging
```

## Undo changes

`restore` discards edits, `reset` unstages, `revert` makes a new commit that undoes an old one.

```bash
git restore file.txt          # throw away unstaged edits to a file
git restore --staged file.txt # unstage (keep the edits)
git revert a1b2c3             # safely undo a commit with a new commit
```

## Stashing

`stash` shelves your current changes so you can switch tasks, then bring them back later.

```bash
git stash             # set unfinished work aside
git stash pop         # reapply the most recent stash
git stash list        # see what you've stashed
```

## Ignore files

List paths in a `.gitignore` file and Git won't track them.

```text
node_modules/
.env
dist/
*.log
```

## Tags

Tags mark specific commits, often for releases.

```bash
git tag v1.0.0              # tag the current commit
git push origin v1.0.0      # share the tag
git tag                     # list tags
```

## Inspect history

`show` displays a commit's changes; `blame` shows who last touched each line.

```bash
git show a1b2c3        # full details of one commit
git blame file.txt     # line-by-line authorship
```
