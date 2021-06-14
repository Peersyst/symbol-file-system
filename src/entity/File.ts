import {UInt64} from "symbol-sdk";

export type File = UInt64[];

export const isFile = (x: any): x is File => Array.isArray(x);
