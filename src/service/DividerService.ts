export class DividerService {
    static BLOCK_SIZE = 1024;

    static divideData(data: string): string[] {
        const divided: string[] = [];
        while (data.length > 0) {
            const actual = data.slice(0, DividerService.BLOCK_SIZE);
            data = data.slice(DividerService.BLOCK_SIZE);
            divided.push(actual);
        }
        return divided;
    }

    static arrangeBlocks(blocks: Buffer[]): Buffer {
        return Buffer.concat(blocks);
    }
}
