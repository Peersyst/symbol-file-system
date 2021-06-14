import {File} from "./File";

export type Directory = {
    [name: string]: File | Directory,
}

export const isDirectory = (x: any): x is Directory => typeof x === "object";
