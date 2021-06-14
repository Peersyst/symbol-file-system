import chalk from "chalk";
import {SymbolFileSystem} from "../SymbolFileSystem";
import {Synchronizer} from "../Synchronizer";
import commander from "commander";
import {Questions} from "./Questions";

export const Clone = (program: commander.Command) => {
    program
        .command("clone")
        .description("Clone a symbol directory from and address to the specified path")
        .option('-d, --directory <path>', 'Directory to push')
        .option('-a, --address <address>', 'Address of the directory')
        .option('-n, --node <node>', 'Symbol node to connect')
        .action(async (options) => {
            const directory = await Questions.askForDirectory("clone", options.directory);
            const address = await Questions.askForAddress(options.address);
            const node = await Questions.askForSymbolNode(address.networkType, options.node);
            const fileSystem = new SymbolFileSystem(address, [node], async () => {
                await new Synchronizer(fileSystem, directory).clone();
                console.log(chalk.green("Data cloned successfully!"));
                process.exit();
            }, undefined, true);
        })
};
