class IO {

    register = new Uint8Array(0x80);

    init(mmu, cpu, ppu) {
        this.mmu = mmu;
        this.cpu = cpu;
        this.ppu = ppu;
    }

    write8(address, value) {
        switch (address & 0xFF) {
            case 0x42: this.ppu.reg.scrollY = value; return;
            case 0x43: this.ppu.reg.scrollX = value; return;
            case 0x47: this.ppu.updatePalette(value); return;
            case 0x50: if (this.mmu.biosOff === false) { this.mmu.biosOff = true; this.mmu.loadRom(); } break;
            default:
                this.register[address & 0x7F] = (value & 0xFF);
                break;
        }
        this.register[address & 0x7F] = (value & 0xFF);
    }

    read8(address) {
        switch (address & 0xFF) {
            case 0x42: return this.ppu.reg.scrollY;
            case 0x43: return this.ppu.reg.scrollX;
            default: return this.register[address & 0x7F] & 0xFF;
        }
    }
}

export{IO};
