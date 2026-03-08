![xsh banner](/images/banner.png)

## Introduction
**xsh** is an open-source shell written in JavaScript. Developers can create their own themes, that every user can install in seconds!

### Installing
- Install xsh on your global system:
```
npm install xsh-shell
```

- Test xsh:
```
npx xsh-shell
```

Its working now!

### Available Commands

| Command | Aliases | Description | Usage |
| --- | --- | --- | --- |
| `help` | `h` | Shows xsh usage/help information. | `help` |
| `version` | `v` | Shows the current xsh version from `package.json`. | `version` |
| `clear` | `cls` | Clears the terminal screen. | `clear` |
| `exit` | `close`, `quit`, `q` | Exits xsh. | `exit` |
| `pwd` | `path` | Prints the current working directory. | `pwd` |
| `ls` | `la` | Lists files and folders in a directory. | `ls [path]` |
| `cat` | `bat`, `batcat`, `get` | Prints file contents. | `cat <file>` |
| `touch` | - | Creates one or more files if they do not exist. | `touch <file> [file2 ...]` |
| `mkdir` | `md` | Creates one or more directories. | `mkdir <folder> [folder2 ...]` |
| `nano` | - | Opens the built-in text editor. | `nano <file>` |
| `theme` | - | Shows current/available themes, or switches theme. | `theme` or `theme <name>` |
| `config` | `cfg`, `settings` | Opens configuration menu or manages config via flags. | `config`, `config --show`, `config --path`, `config --reset`, `config --help` |
| `reload` | `r` | Reloads command modules in the running shell session. | `reload` |

### Contributors
<a href="https://github.com/sanderhd/xsh/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=sanderhd/xsh" />
</a>