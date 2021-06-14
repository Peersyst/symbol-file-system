import {Blocks} from "../entity/Blocks";
import {UInt64} from "symbol-sdk";
import {DividerService} from "./DividerService";
import {Directory} from "../entity/Directory";
import {File, isFile} from "../entity/File";
import {EncodingService} from "./EncodingService";

export class FileSystemTableService {
    static FS_TABLE_BLOCK_START = UInt64.fromUint(0);
    static FS_TABLE_BLOCK_END = UInt64.fromUint(1024);

    static readFileSystemTable(blocks: Blocks): Directory {
        let blockNumber = FileSystemTableService.FS_TABLE_BLOCK_START;
        let block = blocks[blockNumber.toHex()];
        let data = "";
        while (block != null) {
            data += block;
            blockNumber = blockNumber.add(UInt64.fromUint(1));
            block = blocks[blockNumber.toHex()];
        }
        if (blockNumber.compare(FileSystemTableService.FS_TABLE_BLOCK_END) >= 0) {
            throw new Error("File System table overflow!");
        }
        try {
            const decoded = EncodingService.decode(data);
            return FileSystemTableService.decodeFileSystemTable(decoded);
        } catch (e) {
            console.log("Failed to load system table, empty or corrupted");
            return {};
        }
    }

    static saveFileSystemTable(root: Directory): Blocks {
        const encoded = FileSystemTableService.encodeFileSystemTable(root);
        const blocks = {};
        const encodedBlocks = EncodingService.encode(encoded);
        const orderedBlocks = DividerService.divideData(encodedBlocks);
        let i = FileSystemTableService.FS_TABLE_BLOCK_START;
        for (const block of orderedBlocks) {
            blocks[i.toHex()] = block;
            i = i.add(UInt64.fromUint(1));
        }
        if (i.compare(FileSystemTableService.FS_TABLE_BLOCK_END) >= 0) {
            throw new Error("File System table overflow!");
        }
        return blocks;
    }

    static encodeFileSystemTable(table: Directory): Buffer {
        const rawTable = JSON.stringify(FileSystemTableService.directoryToDTO(table));
        return Buffer.from(rawTable);
    }

    static decodeFileSystemTable(data: Buffer): Directory {
        const rawTable = data.toString();
        const obj = JSON.parse(rawTable);
        return FileSystemTableService.directoryFromDTO(obj);
    }

    static directoryToDTO(table: Directory): object {
        const obj = {};
        for (const name in table) {
            if (!table.hasOwnProperty(name)) continue;
            if (isFile(table[name])) {
                obj[name] = (table[name] as File).map(id => id.toHex());
            } else {
                obj[name] = FileSystemTableService.directoryToDTO((table[name] as Directory));
            }
        }
        return obj;
    }

    static directoryFromDTO(obj: object): Directory {
        const table: Directory = {};
        for (const name in obj) {
            if (!obj.hasOwnProperty(name)) continue;
            if (Array.isArray(obj[name])) {
                table[name] = obj[name].map(id => UInt64.fromHex(id));
            } else {
                table[name] = FileSystemTableService.directoryFromDTO(obj[name]);
            }
        }
        return table;
    }
}
