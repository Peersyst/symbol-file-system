import inquirer from "inquirer";
import fs from "fs";
import chalk from "chalk";
import {Account, Address, NetworkHttp, NetworkType} from "symbol-sdk";

const DEFAULT_NODE = {
    [NetworkType.MAIN_NET]: 'http://ngl-dual-001.symbolblockchain.io:3000',
    [NetworkType.TEST_NET]: 'http://ngl-dual-001.testnet.symboldev.network:3000',
}

export const Questions = {
    askForDirectory: async (type: "push" | "clone", options?: string): Promise<string> => {
        let directory;
        if (options) {
            directory = options;
        } else {
            const answers = await inquirer.prompt([{
                type: "input",
                name: "directory",
                message: `Enter the local directory to ${type}`,
            }]);
            directory = answers.directory;
        }
        try {
            fs.readdirSync(directory);
            return directory;
        } catch (e) {
            console.log(chalk.red("The directory specified is not valid"));
            return Questions.askForDirectory(type);
        }
    },
    askForAddress: async (options?: string): Promise<Address> => {
        let address;
        if (options) {
            address = options;
        } else {
            const answers = await inquirer.prompt([{
                type: "input",
                name: "address",
                message: `Enter the Symbol file address`,
            }]);
            address = answers.address;
        }
        try {
            return Address.createFromRawAddress(address);
        } catch (e) {
            console.log(chalk.red("The address specified is not valid"));
            return Questions.askForAddress();
        }
    },
    askForFileAccount: async (address: Address, options?: string): Promise<Account> => {
        let filePrivateKey;
        if (options) {
            filePrivateKey = options;
        } else {
            const answers = await inquirer.prompt([{
                type: "password",
                name: "filePrivateKey",
                message: `Enter the Symbol file account's private key (has to match this ${address.pretty()} address)`,
            }]);
            filePrivateKey = answers.filePrivateKey;
        }
        try {
            const account = Account.createFromPrivateKey(filePrivateKey, address.networkType);
            if (account.address.plain() !== address.plain()) {
                console.log(chalk.red("The Symbol file private key needs to match this address: " + address.pretty()));
                return Questions.askForFileAccount(address);
            } else {
                return account;
            }
        } catch (e) {
            console.log(chalk.red("The Symbol file private key entered is invalid"));
            return Questions.askForFileAccount(address);
        }
    },
    askForPayerAccount: async (networkType: NetworkType, options?: string): Promise<Account> => {
        let payerPrivateKey;
        if (options) {
            payerPrivateKey = options;
        } else {
            const answers = await inquirer.prompt([{
                type: "password",
                name: "payerPrivateKey",
                message: `Enter the Symbol account's private key that will pay the fees`,
            }]);
            payerPrivateKey = answers.payerPrivateKey;
        }
        try {
            return Account.createFromPrivateKey(payerPrivateKey, networkType);
        } catch (e) {
            console.log(chalk.red("The Symbol payer private key entered is invalid"));
            return Questions.askForPayerAccount(networkType);
        }
    },
    askForSymbolNode: async (networkType: NetworkType, options?: string): Promise<string> => {
        let node;
        if (options) {
            node = options;
        } else {
            const answers = await inquirer.prompt([{
                type: "input",
                name: "node",
                message: `Enter a Symbol node to connect`,
                default: DEFAULT_NODE[networkType],
            }]);
            node = answers.node;
        }
        try {
            const nodeNetworkType = await new NetworkHttp(node).getNetworkType().toPromise();
            if (nodeNetworkType !== networkType) {
                console.log(chalk.red(`Node ${node} is from a different network, please specify another one`));
                return Questions.askForSymbolNode(networkType);
            } else {
                return node;
            }
        } catch (e) {
            console.log(chalk.red("Node is not valid, please specify another one"));
            return Questions.askForSymbolNode(networkType);
        }
    },
    askForFees: async (fees: number): Promise<boolean> => {
        const answers = await inquirer.prompt([{
            type: "confirm",
            name: "pay",
            message: `This operation has a cost of ${fees} XYM. Do you want to continue?`,
            default: false,
        }]);
        return answers.pay
    },
}
