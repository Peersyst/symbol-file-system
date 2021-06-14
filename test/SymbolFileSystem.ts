import * as fs from "fs";
import {Account, NetworkType} from "symbol-sdk";
import {SymbolFileSystem} from "../src/SymbolFileSystem";
import { expect } from "chai";

describe("SymbolFileSystem", () => {
    const developer = fs.readFileSync(__dirname + "/data/developer.jpeg");
    // const file1m = fs.readFileSync(__dirname + "/data/1mfile");
    const networkType = NetworkType.TEST_NET;
    const nodes = ["http://ngl-dual-401.testnet.symboldev.network:3000"];
    const account = Account.createFromPrivateKey("73928D3C99516E86DF43C709727792C5B4563E14EDB73B1AA363090488932155", networkType);
    const payerAccount = Account.createFromPrivateKey("634CF47374288F4C0DC1AA2DA02927B8F89F78CF8B72A2A5BFD9F2F6CDA49B9A", networkType);

    it("should save file", (done) => {
        const symbolFileSystem = new SymbolFileSystem(account.address, nodes, () => {
            symbolFileSystem.writeFile("/developer3.jpg", developer).then(async () => {
                await symbolFileSystem.save(account, payerAccount);
                // done();
            })
        });
    });

    it("should read file", (done) => {
        const symbolFileSystem = new SymbolFileSystem(account.address, nodes, () => {
            symbolFileSystem.readFile("/developer.jpg").then(async (data) => {
                fs.writeFileSync("./developer.jpg", data);
                done();
            })
        });
    });

    it("should create a directory", (done) => {
        const symbolFileSystem = new SymbolFileSystem(account.address, nodes, () => {
            symbolFileSystem.mkdir("/photos").then(async () => {
                await symbolFileSystem.save(account, payerAccount);
                // done();
            })
        });
    });

    it("should list a directory", (done) => {
        const symbolFileSystem = new SymbolFileSystem(account.address, nodes, () => {
            symbolFileSystem.ls("/photos").then(async (data) => {
                expect(data).to.deep.equal({});
                done();
            })
        });
    });
});
