import {expect} from "chai";
import * as fs from "fs";
import {EncodingService} from "../../src/service/EncodingService";

describe("EncodingService", () => {
    const developer = fs.readFileSync(__dirname + "/../data/developer.jpeg");

    it("should encode and decode", (done) => {
        const encoded = EncodingService.encode(developer)
        const result = EncodingService.decode(encoded)
        expect(result.compare(developer)).to.equal(0);
        fs.writeFileSync("./developer.jpeg", result);
        done();
    });
});
