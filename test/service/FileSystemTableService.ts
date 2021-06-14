import {UInt64} from "symbol-sdk";
import {expect} from "chai";
import {Directory} from "../../src/entity/Directory";
import {FileSystemTableService} from "../../src/service/FileSystemTableService";

describe("FileSystemTableService", () => {
    const table: Directory = {
        "developer.jpg": [UInt64.fromUint(0), UInt64.fromUint(1)],
        "photos": {
            "developer.jpg": [UInt64.fromUint(123), UInt64.fromUint(1)],
            "deeper": {
                "developer1.jpg": [UInt64.fromUint(0), UInt64.fromUint(1)],
                "developer2.pdf": [UInt64.fromUint(0), UInt64.fromUint(12)],
            }
        }
    }

    it("should parse / read correct table", (done) => {
        const dto = FileSystemTableService.directoryToDTO(table);
        expect(FileSystemTableService.directoryFromDTO(dto)["developer.jpg"][0].compare(UInt64.fromUint(0))).to.equal(0)
        expect(FileSystemTableService.directoryFromDTO(dto)["photos"]["developer.jpg"][0].compare(UInt64.fromUint(123))).to.equal(0)
        expect(FileSystemTableService.directoryFromDTO(dto)["photos"]["deeper"]["developer1.jpg"][1].compare(UInt64.fromUint(1))).to.equal(0)
        expect(FileSystemTableService.directoryFromDTO(dto)["photos"]["deeper"]["developer2.pdf"][1].compare(UInt64.fromUint(12))).to.equal(0)
        done();
    });

    it("should encode / decode correct table", (done) => {
        const dto = FileSystemTableService.encodeFileSystemTable(table);
        const decoded = FileSystemTableService.decodeFileSystemTable(dto)
        expect(decoded["developer.jpg"][0].compare(UInt64.fromUint(0))).to.equal(0)
        expect(decoded["photos"]["developer.jpg"][0].compare(UInt64.fromUint(123))).to.equal(0)
        expect(decoded["photos"]["deeper"]["developer1.jpg"][1].compare(UInt64.fromUint(1))).to.equal(0)
        expect(decoded["photos"]["deeper"]["developer2.pdf"][1].compare(UInt64.fromUint(12))).to.equal(0)
        done();
    });
});
