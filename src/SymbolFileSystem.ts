import {IFileSystem} from "./IFileSystem";
import {File, isFile} from "./entity/File";
import {Account, Address, UInt64} from "symbol-sdk";
import {SymbolService} from "./service/SymbolService";
import {NodeType} from "./entity/NodeType";
import {Blocks} from "./entity/Blocks";
import {FileSystemTableService} from "./service/FileSystemTableService";
import {DividerService} from "./service/DividerService";
import {Directory, isDirectory} from "./entity/Directory";
import {EncodingService} from "./service/EncodingService";
import {Path} from "./helper/Path";
import {ProgressCbs} from "./helper/Progress";

export type FeesCallback = (fees: number) => Promise<boolean>;

export class SymbolFileSystem implements IFileSystem {
    private readonly symbolService: SymbolService;
    private fileSystemTable: Directory;
    private blocks: Blocks;
    private synced: boolean = false;

    private dirtyTable: boolean = false;
    private dirtyBlocks: Blocks = {};

    constructor(public readonly address: Address, nodes: string[], syncCallback?: () => void, private readonly feesCb?: FeesCallback, public readonly verbose = false) {
        this.symbolService = new SymbolService(nodes, () => {
            this.sync().then(syncCallback);
        });
    }

    async sync(): Promise<void> {
        this.blocks = await this.symbolService.fetchBlocks(this.address.plain(), this.verbose);
        this.fileSystemTable = FileSystemTableService.readFileSystemTable(this.blocks);
        this.synced = true;
    }

    async save(fileAccount: Account, payerAccount: Account): Promise<boolean> {
        if (fileAccount.address.plain() !== this.address.plain()) {
            throw new Error("Specified file account doesn't match this file address!");
        }
        let allBlocks: Blocks = {};
        if (this.dirtyTable) {
            allBlocks = {
                ...FileSystemTableService.saveFileSystemTable(this.fileSystemTable),
                ...allBlocks,
            };
        }
        if (Object.keys(this.dirtyBlocks).length > 0) {
            allBlocks = {
                ...FileSystemTableService.saveFileSystemTable(this.fileSystemTable),
                ...this.dirtyBlocks,
            };
        }
        const processed = await this.symbolService.saveBlocks(this.blocks, allBlocks, fileAccount, payerAccount, this.feesCb, this.verbose);

        if (processed) {
            this.dirtyTable = false;
            this.blocks = {
                ...this.blocks,
                ...this.dirtyBlocks,
            };
            this.dirtyBlocks = {};
            return true;
        }
        return false;
    }

    async readFile(dirPath: string): Promise<Buffer> {
        if (!this.pathExists(Path.dirname(dirPath))) {
            throw new Error(`Path ${dirPath} does not exist!`);
        }
        const file = this.cd(Path.dirname(dirPath))[Path.basename(dirPath)];
        if (!isFile(file)) {
            throw new Error(`Path ${dirPath} is not a file`);
        }

        let fileBlocks: string = "";
        for (const blockNumber of file) {
            if (!this.blocks[blockNumber.toHex()]) {
                throw new Error(`The data of the file ${dirPath} is corrupted. Missing block ${blockNumber.toHex()}`);
            }
            fileBlocks += this.blocks[blockNumber.toHex()];
        }

        return EncodingService.decode(fileBlocks);
    }

    nextValidBlockId(): UInt64 {
        let i = FileSystemTableService.FS_TABLE_BLOCK_END;
        while(this.blocks[i.toHex()] != null || this.dirtyBlocks[i.toHex()] != null) {
            i = i.add(UInt64.fromUint(1));
        }
        return i;
    }

    private pathExists(dirPath: string): boolean {
        try {
            this.cd(dirPath);
            return true;
        } catch (e) {
            return false;
        }
    }

    public cd(path: string): Directory {
        const folders = Path.split(path);
        let actualFolder: Directory | File = this.fileSystemTable;
        for (let i=0; i < folders.length; i++) {
            if (actualFolder[folders[i]] == null || isFile(actualFolder[folders[i]])) {
                throw new Error("Path does not exist or it is invalid!")
            }
            actualFolder = actualFolder[folders[i]];
        }
        return actualFolder as Directory;
    }

    async writeFile(filePath: string, data: Buffer): Promise<void> {
        if (!this.pathExists(Path.dirname(filePath))) {
            throw new Error(`Path ${filePath} does not exist! please create all the folders`);
        }
        const directory = this.cd(Path.dirname(filePath));
        if (directory[Path.basename(filePath)]) {
            throw new Error(`File ${filePath} already exists, please remove it first.`);
        }
        const encodedData = EncodingService.encode(data);
        let blocksData = DividerService.divideData(encodedData);
        const newUsedBlocks: UInt64[] = [];
        for (const block of blocksData) {
            const nextValidBlockId = this.nextValidBlockId();
            this.dirtyBlocks[nextValidBlockId.toHex()] = block;
            newUsedBlocks.push(nextValidBlockId);
        }
        const containerFolder = this.cd(Path.dirname(filePath));
        containerFolder[Path.basename(filePath)] = newUsedBlocks;
        this.dirtyTable = true;
    }

    async removeFile(path: string): Promise<void> {
        const container = this.cd(Path.dirname(path));
        delete container[Path.basename(path)];
    }

    async mkdir(dirPath: string): Promise<void> {
        if (this.pathExists(dirPath)) {
            throw new Error(`Path ${dirPath} already exists!`);
        }
        if (!this.pathExists(Path.dirname(dirPath))) {
            throw new Error(`Path ${Path.dirname(dirPath)} does not exist! please create all the folders`);
        }
        const containerFolder = this.cd(Path.dirname(dirPath));
        containerFolder[Path.basename(dirPath)] = {};
        this.dirtyTable = true;
    }

    async rmdir(path: string): Promise<void> {
        throw new Error("Not implemented");
    }

    async ls(path: string): Promise<{[node: string]: NodeType}> {
        if (!this.pathExists(path)) {
            throw new Error(`Path ${path} does not exist! please create all the folders`);
        }
        const containerFolder = this.cd(path);
        const result: {[node: string]: NodeType} = {};
        for (const item in containerFolder) {
            if (!containerFolder.hasOwnProperty(item)) continue;
            if (isFile(containerFolder[item])) {
                result[item] = NodeType.FILE;
            } else if (isDirectory(containerFolder[item])) {
                result[item] = NodeType.DIRECTORY;
            }
        }
        return result;
    }
}
