import {NodeType} from "./entity/NodeType";

export interface IFileSystem {
    readFile(path: string): Promise<Buffer>;

    writeFile(path: string, data: Buffer): Promise<void>;

    removeFile(path: string): Promise<void>;

    mkdir(path: string): Promise<void>;

    rmdir(path: string): Promise<void>;

    ls(path: string): Promise<{[node: string]: NodeType}>;
}
