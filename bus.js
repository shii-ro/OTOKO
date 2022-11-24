class Bus {
    init(cpu, mmu, ppu) {
        this.cpu = cpu;
        this.mmu = mmu;
        this.ppu = ppu;
    }

    read8(address) {
        switch ((address & 0xF000)) {
            case 0x0000: case 0x1000: case 0x2000: case 0x3000:
                return this.mmu.read8(address);
            case 0x4000: case 0x5000: case 0x6000: case 0x7000:
                return this.mmu.read8(address);
            case 0x8000: case 0x9000:
                return this.ppu.read8(address);
            case 0xA000: case 0xB000:
                // implement External ram
                break;
            case 0xC000:
                return this.mmu.read8(address);
            case 0xD000:
                return this.mmu.read8(address);
            case 0xE000:
                // not used area
                break;
            case 0xF000:
                return this.mmu.read8(address);
            default: console.log("Area not implemented: " + address); break;
        }
        return 0;
    };

    write8(address, value) {
        switch ((address & 0xF000)) {
            case 0x0000: case 0x1000: case 0x2000: case 0x3000:
                this.mmu.write8(address, value);
            case 0x4000: case 0x5000: case 0x6000: case 0x7000:
                this.mmu.write8(address, value);
                break;
            case 0x8000: case 0x9000:
                this.ppu.write8(address, value);
                break;
            case 0xA000: case 0xB000:
                // implement External ram
                break;
            case 0xC000:
                this.mmu.write8(address, value);
                break;
            case 0xD000:
                this.mmu.write8(address, value);
                break;
            case 0xE000:
            // not used area
            case 0xF000:
                this.mmu.write8(address, value);
                break;
            default: console.log("Area not implemented: " + address);
        }
    };

    read16() {
        return this.read8(this.cpu.reg.PC) | this.read8(this.cpu.reg.PC + 1) << 8;
    }
    next8() {
        let u8 = this.read8(this.cpu.reg.PC++) & 0xFF;
        return u8;
    }

    next16() {
        let u16 = ((this.next8() | this.next8() << 8) & 0xFFFF);
        return u16;
    }

}
export {Bus};