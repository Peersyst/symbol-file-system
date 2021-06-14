import {SymbolFileSystem} from "../SymbolFileSystem";
import {Synchronizer} from "../Synchronizer";
import commander from "commander";
import {Questions} from "./Questions";
import chalk from "chalk";

export const Push = (program: commander.Command) => {
    program
        .command("push")
        .description("Push a Symbol directory from a local directory to the specified Symbol address")
        .option('-d, --directory <path>', 'Directory to push')
        .option('-a, --address <address>', 'Address of the directory')
        .option('-n, --node <node>', 'Symbol node to connect')
        .option('-f, --file <file>', 'Symbol file account\'s private key')
        .option('-p, --payer <payer>', 'Symbol fee payer account\'s private key')
        .option('-f, --force', 'Force execution without asking for confirmation')
        .action(async (options) => {
            const directory = await Questions.askForDirectory("push", options.directory);
            const address = await Questions.askForAddress(options.address);
            const node = await Questions.askForSymbolNode(address.networkType, options.node);
            const fsAccount = await Questions.askForFileAccount(address, options.file);
            const payerAccount = await Questions.askForPayerAccount(address.networkType, options.payer);
            const fileSystem = new SymbolFileSystem(address, [node], async () => {
                await new Synchronizer(fileSystem, directory).up(fsAccount, payerAccount);
                console.log(chalk.green("Data pushed successfully!"));
                process.exit();
            }, !options.force ? Questions.askForFees: undefined, true)
        })
};
