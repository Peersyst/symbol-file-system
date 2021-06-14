#!/usr/bin/env node
import chalk from "chalk";
import clear from 'clear';
import figlet from 'figlet';
import {Command} from 'commander';
import {Clone} from "./Clone";
import {Push} from "./Push";
const { version } = require('../../../package.json');
const program = new Command();

clear();
console.log(
    chalk.magenta(
        figlet.textSync('symbol-file-system CLI', { horizontalLayout: 'full' })
    )
);
console.log();
console.log();

program
    .version(version)
    .description("Welcome to the first file system build on top of the Symbol blockchain");

console.log(chalk.whiteBright(program.description()));
console.log();

Clone(program);
Push(program);

program.parse();
