class MMU {

    constructor() {
        this.bios = [
            0x31, 0xFE, 0xFF, 0xAF, 0x21, 0xFF, 0x9F, 0x32, 0xCB, 0x7C, 0x20, 0xFB, 0x21, 0x26, 0xFF, 0x0E, 0x11, 0x3E, 0x80, 0x32, 0xE2, 0x0C, 0x3E, 0xF3, 0xE2, 0x32, 0x3E, 0x77, 0x77, 0x3E, 0xFC, 0xE0, 0x47, 0x11, 0x04, 0x01, 0x21, 0x10, 0x80, 0x1A,
            0xCD, 0x95, 0x00, 0xCD, 0x96, 0x00, 0x13, 0x7B, 0xFE, 0x34, 0x20, 0xF3, 0x11, 0xD8, 0x00, 0x06, 0x08, 0x1A, 0x13, 0x22, 0x23, 0x05, 0x20, 0xF9, 0x3E, 0x19, 0xEA, 0x10, 0x99, 0x21, 0x2F, 0x99, 0x0E, 0x0C, 0x3D, 0x28, 0x08, 0x32, 0x0D, 0x20,
            0xF9, 0x2E, 0x0F, 0x18, 0xF3, 0x67, 0x3E, 0x64, 0x57, 0xE0, 0x42, 0x3E, 0x91, 0xE0, 0x40, 0x04, 0x1E, 0x02, 0x0E, 0x0C, 0xF0, 0x44, 0xFE, 0x90, 0x20, 0xFA, 0x0D, 0x20, 0xF7, 0x1D, 0x20, 0xF2, 0x0E, 0x13, 0x24, 0x7C, 0x1E, 0x83, 0xFE, 0x62,
            0x28, 0x06, 0x1E, 0xC1, 0xFE, 0x64, 0x20, 0x06, 0x7B, 0xE2, 0x0C, 0x3E, 0x87, 0xE2, 0xF0, 0x42, 0x90, 0xE0, 0x42, 0x15, 0x20, 0xD2, 0x05, 0x20, 0x4F, 0x16, 0x20, 0x18, 0xCB, 0x4F, 0x06, 0x04, 0xC5, 0xCB, 0x11, 0x17, 0xC1, 0xCB, 0x11, 0x17,
            0x05, 0x20, 0xF5, 0x22, 0x23, 0x22, 0x23, 0xC9, 0xCE, 0xED, 0x66, 0x66, 0xCC, 0x0D, 0x00, 0x0B, 0x03, 0x73, 0x00, 0x83, 0x00, 0x0C, 0x00, 0x0D, 0x00, 0x08, 0x11, 0x1F, 0x88, 0x89, 0x00, 0x0E, 0xDC, 0xCC, 0x6E, 0xE6, 0xDD, 0xDD, 0xD9, 0x99,
            0xBB, 0xBB, 0x67, 0x63, 0x6E, 0x0E, 0xEC, 0xCC, 0xDD, 0xDC, 0x99, 0x9F, 0xBB, 0xB9, 0x33, 0x3E, 0x3C, 0x42, 0xB9, 0xA5, 0xB9, 0xA5, 0x42, 0x3C, 0x21, 0x04, 0x01, 0x11, 0xA8, 0x00, 0x1A, 0x13, 0xBE, 0x20, 0xFE, 0x23, 0x7D, 0xFE, 0x34, 0x20,
            0xF5, 0x06, 0x19, 0x78, 0x86, 0x23, 0x05, 0x20, 0xFB, 0x86, 0x20, 0xFE, 0x3E, 0x01, 0xE0, 0x50, 0x00
        ];
        this.biosOff = false;

        this.wRam = new Uint8Array(0x2000);
        this.oam = new Uint8Array(0xA0);
        this.hram = new Uint8Array(0x80);
        this.rom;
        this.cart = this.cartType_NONE;
        this.romTmp = new Uint8Array(this.bios.length);
    };

    init(io) {
        this.io = io;
    }

    loadRom() {
        // implement a mapper class later
        let cartType = this.rom[0x147];
        let romSize = this.rom[0x148];

        console.log(cartType, romSize);

        switch (cartType) {
            case 0x00: this.cart = this.cartType_NONE; break;
            case 0x01: this.cart = this.cartType_MBC1; break;
            default: this.cart = this.cartType_NONE; break;
        }
        this.cart.rom = this.rom;

        // dont judge me
        if (this.biosOff === false) {
            for (let byte in this.bios) {
                this.romTmp[byte] = this.rom[byte];
                this.rom[byte] = this.bios[byte];
            }
        } else for (let byte in this.bios) this.rom[byte] = this.romTmp[byte];
    }

    read8(address) {

        switch ((address & 0xFFFF) >> 12) {
            case 0: case 1: case 2: case 3:
            case 4: case 5: case 6: case 7:
                return this.cart.cartRead(address) & 0xFF;
            case 0xC: case 0xD:
                return this.wRam[address & 0x1FFF] & 0xFF;
            case 0xF:
                switch ((address >> 4) & 0xF) {
                    case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
                        return this.io.read8(address);
                    case 8: case 9: case 0xA: case 0xB: case 0xC: case 0xD: case 0xE: case 0xF:
                        return this.hram[0x7F & address] & 0xFF;
                }
                return 0;
            default:
                console.log("Area not implemented: %04x\n", address);
                return 0;
        }
    }

    write8(address, value) {
        if (address == 0xFF02 && value == 0x81) {
            console.log(String.fromCharCode(this.read8(0xFF01)));
        }

        switch ((address & 0xFFFF) >> 12) {
            case 0: case 1: case 2: case 3:
            case 4: case 5: case 6: case 7:
                this.cart.cartWrite(address, value);
                break;
            case 0xC: case 0xD:
                this.wRam[address & 0x1FFF] = (value & 0xFF);
                break;
            case 0xF:
                switch ((address >> 8) & 0xF) {
                    case 0xE:
                        this.oam[0x9F & address] = (value & 0xFF);
                        break;
                    case 0xF:
                        switch ((address >> 4) & 0xF) {
                            case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
                                this.io.write8(address, value);
                                break;
                            case 8: case 9: case 0xA: case 0xB: case 0xC: case 0xD: case 0xE: case 0xF:
                                this.hram[0x7F & address] = (value & 0xFF);
                                break;
                        }
                        break;
                }
                break;
            default:
                console.log("Area not implemented: %04x\n", address);
                break;
        }
    }

    cartType_NONE =
        {
            cartRead: function (addr) {
                switch (addr >> 14) {
                    case 0: return this.rom[addr];
                    case 1: return this.rom[addr];
                }
            },
            cartWrite: function (addr, value) { },
        }

    cartType_MBC1 =
        {
            bankMask: 0,
            cartRead: function (addr) {
                switch (addr >> 14) {
                    case 0: return this.rom[addr & 0x3FFF]; // 0x000 - 0x3FFF ROM Bank 00 (Read Only)
                    case 1: return this.rom[this.bankMask + addr];// 0x4000 - 0x7FFF - ROM Bank 01-7F (Read Only)
                    case 2: break; // A000-BFFF - RAM Bank 00-03, if any (Read/Write)
                }
            },
            cartWrite: function (addr, value) {
                switch (addr >> 12) {
                    case 0: case 1: //0x0000 - 0x1FFF RAM Enable (Write Only)
                    console.log("Write ram enable");
                        if ((value & 0xF) === 0xA) {
                            // ram enable...
                        } else { }; break; // ram disable...
                    case 2: case 3: // 0x2000 - 0x3FFF ROM Bank Number (Write Only)
                        let bank = value & 0x1F;
                        this.bankMask = (0x4000 * bank) - 0x4000;
                        console.log("BANK: ", bank, "MASK: ", this.bankMask.toString(16));
                        break;
                    case 4: case 5: // 4000-5FFF - RAM Bank Number - or - Upper Bits of ROM Bank Number (Write Only)
                    console.log("4 5");
                    break;

                }
            },
        }
};

export { MMU };