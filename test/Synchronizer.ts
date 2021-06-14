import {Account, NetworkType} from "symbol-sdk";
import {SymbolFileSystem} from "../src/SymbolFileSystem";
import {Synchronizer} from "../src/Synchronizer";

describe("Synchronizer", () => {
    const networkType = NetworkType.TEST_NET;
    const nodes = ["http://ngl-dual-401.testnet.symboldev.network:3000"];
    const account = Account.createFromPrivateKey("5DABE2D3BC673D8601902172905ED648AB4861ED5B08E80B0D86D38EDD0B720A", networkType);
    const payerAccount = Account.createFromPrivateKey("EE7981AE15FC0EBB491483F5D97C418C93DC321058375B0714B98202CB46E326", networkType);
    it("should save example", (done) => {
        console.log(account.address.plain());
        const symbolFileSystem = new SymbolFileSystem(account.address, nodes, async () => {
            const synchronizer = new Synchronizer(symbolFileSystem, "./example");
            await synchronizer.up(account, payerAccount);
        });
    });
});
