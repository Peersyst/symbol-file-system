import * as fs from "fs";
import {IFileSystem} from "../IFileSystem";
import {NodeType} from "../entity/NodeType";
import * as path from "path";

export class FileHelper {
    static walk(baseDirectory: string, current = "/"): string[] {
        const currentDirectory = baseDirectory + current;
        const list = fs.readdirSync(currentDirectory);

        const results: string[] = [];
        for (const filePath of list) {
            const stat = fs.statSync(currentDirectory + filePath);
            if (stat && stat.isDirectory()) {
                const res = FileHelper.walk(baseDirectory, current + filePath + "/");
                results.push(...res);
            } else {
                results.push(current + filePath);
            }
        }

        return results;
    }
    static async walkRemote(fileSystem: IFileSystem, current = "/"): Promise<string[]> {
        const list = await fileSystem.ls(current);

        const results: string[] = [];
        for (const nodeName of Object.keys(list)) {
            if (list[nodeName] === NodeType.DIRECTORY) {
                const res = await FileHelper.walkRemote(fileSystem, current + nodeName + "/");
                results.push(...res);
            } else {
                results.push(current + nodeName);
            }
        }

        return results;
    }

    static createSubDirectories(filePath: string) {
        const dirname = path.dirname(filePath);
        if (fs.existsSync(dirname)) {
            return true;
        }
        fs.mkdirSync(dirname, { recursive: true });
    }
}
