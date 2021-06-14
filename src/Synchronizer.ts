import {SymbolFileSystem} from "../index";
import {Path} from "./helper/Path";
import {FileHelper} from "./helper/FileHelper";
import {Account} from "symbol-sdk";
import * as fs from "fs";
import * as path from "path";
import {Progress, ProgressCbs} from "./helper/Progress";

export class Synchronizer {
    constructor(
        private readonly fileSystem: SymbolFileSystem,
        private readonly directory: string,
    ) {}

    async clone(): Promise<void> {
        const filePaths = await FileHelper.walkRemote(this.fileSystem);
        for (const filePath of filePaths) {
            FileHelper.createSubDirectories(path.join(this.directory, filePath));
            try {
                const file = await this.fileSystem.readFile(path.join(filePath));
                fs.writeFileSync(path.join(this.directory, filePath), file);
            } catch (e) {
                console.error("Error loading file: ");
                console.error(e.toString());
            }
        }
    }

    async up(fsAccount: Account, payerAccount: Account): Promise<boolean> {
        if (fsAccount.address.plain() !== this.fileSystem.address.plain()) {
            throw new Error("Provided file account doesn't match the current file system");
        }
        const filePaths = FileHelper.walk(this.directory);
        let pb;
        if (this.fileSystem.verbose) pb = Progress("Processing files...", filePaths.length);
        for (const filePath of filePaths) {
            await this.uploadSingleFile(filePath, pb);
        }
        if (pb) pb.finish();
        return await this.save(fsAccount, payerAccount);
    }

    private async uploadSingleFile(filePath: string, pb?: ProgressCbs) {
        const localFile = fs.readFileSync(this.directory + filePath);
        let remoteFile: Buffer | null = null;
        try {
            remoteFile = await this.fileSystem.readFile(filePath);
        } catch (e) {}
        if (remoteFile) {
            if (remoteFile.compare(localFile) === 0) {
                // Same files, continue
                // console.log("Skipping file " + filePath + " has the same content...");
                return;
            } else {
                // Different files
                // console.log("Removing file " + filePath + " has different contents...");
                await this.fileSystem.removeFile(filePath);
            }
        }
        await this.createPathsIfNotExist(filePath);
        await this.fileSystem.writeFile(filePath, localFile);
        if (pb) pb.increment();
    }

    async save(fsAccount: Account, payerAccount: Account): Promise<boolean> {
        return await this.fileSystem.save(fsAccount, payerAccount);
    }

    async createPathsIfNotExist(directory: string) {
        const pathParts = Path.split(directory).slice(0, -1);
        let actualPath = "";
        for (const pathPart of pathParts) {
            actualPath += "/" + pathPart;
            try {
                await this.fileSystem.ls(actualPath);
            } catch (e) {
                await this.fileSystem.mkdir(actualPath);
            }
        }
    }
}
