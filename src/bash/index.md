# Bash

Bash is the command language of most Linux and macOS terminals: you type commands to navigate
folders, manage files, and automate tasks. You run it interactively or save commands in a `.sh`
script.

## Where am I, what's here?

`pwd` prints the current folder; `ls` lists its contents.

```bash
pwd                  # => /home/ada/projects
ls                   # names only
ls -la               # long format, including hidden files
```

## Move around

`cd` changes directory. `.` is here, `..` is the parent, `~` is your home folder.

```bash
cd projects/app      # go into a subfolder
cd ..                # up one level
cd ~                 # back to home
cd -                 # back to the previous folder
```

## Create files and folders

`mkdir` makes folders, `touch` makes an empty file.

```bash
mkdir notes              # one folder
mkdir -p src/app/utils   # create nested folders in one go
touch todo.txt           # empty file (or update its timestamp)
```

## Copy, move, rename, delete

`cp` copies, `mv` moves or renames, `rm` deletes. There is no undo — be careful.

```bash
cp file.txt backup.txt       # copy
cp -r src/ dist/             # copy a folder and its contents
mv old.txt new.txt           # rename
mv report.txt ~/Documents/   # move
rm file.txt                  # delete a file
rm -r folder/                # delete a folder and everything in it
```

## Look inside a file

`cat` dumps the whole file; `head`/`tail` show the start or end; `less` scrolls page by page.

```bash
cat notes.txt           # print the whole file
head -n 5 log.txt       # first 5 lines
tail -n 20 log.txt      # last 20 lines
tail -f log.txt         # follow new lines as they're written (Ctrl-C to stop)
less big.txt            # scroll (q to quit)
```

## Find files and search text

`find` locates files by name; `grep` searches for text inside files.

```bash
find . -name "*.js"           # all .js files under the current folder
grep "error" log.txt          # lines containing "error"
grep -ri "todo" src/          # recursive, case-insensitive search in src/
grep -n "fix" notes.txt       # show line numbers
```

## Pipes and redirection

A pipe `|` feeds one command's output into the next; `>` writes output to a file, `>>` appends.

```bash
ls -la | grep ".txt"          # list, keep only .txt lines
cat log.txt | wc -l           # count lines in the file
echo "hello" > greeting.txt   # write (overwrites the file)
echo "again" >> greeting.txt  # append a line
```

## Variables

Assign with no spaces around `=`; read the value back with a `$` prefix.

```bash
name="Ada"
echo "Hello, $name"     # => Hello, Ada
greeting="Hi ${name}!"  # braces help when text follows the name
echo "$greeting"        # => Hi Ada!
```

## Command substitution

Wrap a command in `$( )` to capture its output into a variable.

```bash
today=$(date +%Y-%m-%d)
echo "Today is $today"        # => Today is 2026-06-24
files=$(ls | wc -l)
echo "$files files here"
```

## Conditionals

`if` runs a block when a test passes. Use `[ ... ]` for the test, with spaces inside the brackets.

```bash
if [ -f config.json ]; then
  echo "config exists"
else
  echo "no config"
fi
```

Common test flags: `-f` file exists, `-d` folder exists, `-z` string is empty.

```bash
if [ -z "$name" ]; then
  echo "name is empty"
fi
```

## Compare values

Numbers use `-eq`/`-lt`/`-gt`; strings use `=` and `!=`.

```bash
count=5
if [ "$count" -gt 3 ]; then
  echo "more than three"   # => more than three
fi
if [ "$name" = "Ada" ]; then
  echo "hi Ada"
fi
```

## Loops

`for` repeats over a list; `while` repeats while a condition holds.

```bash
for file in *.txt; do
  echo "Found $file"
done
```

```bash
count=1
while [ "$count" -le 3 ]; do
  echo "count is $count"
  count=$((count + 1))
done
```

## Functions

Group commands under a name; refer to arguments as `$1`, `$2`, and so on.

```bash
greet() {
  echo "Hello, $1!"
}
greet "Ada"     # => Hello, Ada!
```

## Write a script

Start the file with a shebang line so the system knows to run it with Bash.

```bash
#!/usr/bin/env bash
echo "Backing up..."
cp -r src/ backup/
echo "Done."
```

Make it executable once, then run it by path.

```bash
chmod +x backup.sh      # mark as runnable
./backup.sh             # run it
```

## File permissions

`chmod` sets who can read/write/execute; `ls -l` shows the current permissions.

```bash
ls -l script.sh         # => -rw-r--r-- 1 ada ada ...
chmod +x script.sh      # add execute permission
chmod 644 notes.txt     # owner read/write, others read-only
```

## Environment and PATH

Environment variables configure your shell; `PATH` lists folders searched for commands.

```bash
echo "$HOME"            # => /home/ada
echo "$PATH"            # colon-separated folders
export API_KEY="abc123" # set a variable for this session and child processes
```

## Handy shortcuts

These save time at the prompt every day.

```bash
history                 # list recent commands
!!                      # run the previous command again
clear                   # clear the screen (or Ctrl-L)
which node              # show the full path of a command
man ls                  # open the manual for a command (q to quit)
```

## Chaining commands

`&&` runs the next command only if the previous one succeeded; `;` runs regardless.

```bash
mkdir build && cd build       # cd only if mkdir worked
npm install ; npm test        # run both, even if install fails
command || echo "it failed"   # run the fallback only on failure
```
