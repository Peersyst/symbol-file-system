import chalk from "chalk";
const cliProgress = require('cli-progress');

export type ProgressCbs = {
    update: (current: number) => void,
    finish: () => void,
    increment: () => void,
};

export const Progress = (message: string, total: number): ProgressCbs => {
    console.log(chalk.magentaBright(message));
    const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
    progressBar.start(total, 0);
    const interval = setInterval(() => progressBar.updateETA(), 500);
    return {
        update: (current: number) => {
            progressBar.update(current);
        },
        increment: () => {
            progressBar.increment();
        },
        finish: () => {
            progressBar.stop();
            clearInterval(interval);
            console.log();
        },
    };
}
