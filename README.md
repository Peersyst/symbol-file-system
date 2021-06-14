# Symbol File System

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

Symbol File System is a tool that allows you to create, read update and delete files and directories
inside the Symbol blockchain

## Installation

Use the package manager [npm](https://www.npmjs.com/) to install symbol file system.

Development environment
```bash
npm install symbol-file-system
```

Global cli environment
```bash
npm install symbol-file-system -g
```

## Usage

### symbol-fs CLI

symbol-fs CLI allows cloning and pushing remote and directories to the Symbol blockchain.
The CLI has an interactive mode so there's no need to specify all the parameters at the beginning.

#### Clone a directory:
```shell
$ sfs clone -a TDXKGLNBCVXIB5QIPDLX2QB4VIRQ54YEG2IJIXY -d ./localdir
```

Parameters:
- address [-a]: Specify the address of the remote directory 
- directory [-d]: Specify the local directory to store the downloaded files 
- node [-n]: Specify a symbol node to connect 

#### Push a directory
```shell
$ sfs push -a TDXKGLNBCVXIB5QIPDLX2QB4VIRQ54YEG2IJIXY -d ./localdir
```

Parameters:
- address [-a]: Specify the address of the remote directory
- directory [-d]: Specify the remote directory where the files will be uploaded
- node [-n]: Specify a symbol node to connect
- file [-f]: File system private key of the address specified above
- payer [-p]: Payer private key that will assume the cost of the network fees

### SymbolFileSystem

SymbolFileSystem class allows to work in the file system using the following calls:  

```typescript
import {SymbolFileSystem} from "../src/SymbolFileSystem";

const symbolFileSystem = new SymbolFileSystem(address, nodes, async () => {
    console.log("I am ready to start using the Symbol file system!");
    
    // Create a directory
    await symbolFileSystem.mkdir("/data");
    
    // Write a file to the directory
    await symbolFileSystem.writeFile("/data/notes.txt", myNotesFileBuffer);
    
    // Read a file from a directory
    await symbolFileSystem.readFile("/data/notes.txt");
    
    // Remove a file
    await symbolFileSystem.removeFile("/trash.png");
    
    // Commit changes to the Symbol blockchain
    await symbolFileSystem.save(fileAccount, payerAccount);
});
```

### Synchronizer
Synchronizer class allows to automatically synchronize a remote and a local directories

```typescript
import {Synchronizer} from "../src/Synchronizer";

const symbolFileSystem = new SymbolFileSystem(account.address, nodes, async () => {
    const synchronizer = new Synchronizer(symbolFileSystem, "./example");
    
    // Upload all the files from the ./example directory to the chain
    await synchronizer.up(account, payerAccount);
    
    // Download all the files from the chain to the ./example directory
    await synchronizer.clone();
});
```


## Contributing
This project is being build. Pull requests and new ideas are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.
