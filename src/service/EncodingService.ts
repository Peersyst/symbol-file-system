import * as zlib from "zlib";

export class EncodingService {
    private static compress(data: Buffer): Buffer {
        return zlib.gzipSync(data);
    }
    private static decompress(data: Buffer): Buffer {
        return zlib.gunzipSync(data);
    }

    static encode(data: Buffer): string {
        const compressed = EncodingService.compress(data);
        return compressed.toString("base64");
    }
    static decode(data: string): Buffer {
        const compressed = Buffer.from(data, "base64");
        return EncodingService.decompress(compressed);
    }
}
