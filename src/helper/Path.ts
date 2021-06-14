import * as osPath from "path";

export const Path = {
    basename: (path: string): string => {
        return osPath.basename(path);
    },
    dirname: (path: string): string => {
        const calculated = osPath.dirname(path);
        return calculated === "." ? "/" : calculated;
    },
    split: (path: string): string[] => {
        return path.split("/").filter((val) => val !== "");
    },
}
