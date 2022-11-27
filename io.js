class IO {

    register = new Uint8Array(0x80);

    init(mmu, cpu, ppu) {
        this.mmu = mmu;
        this.cpu = cpu;
        this.ppu = ppu;
    }

    write8(address, value) {
        switch (address & 0xFF) {
            case 0x47: this.ppu.updatePalette(0xFC & 0xFF); break;
            case 0x42: this.register[0x42] = value; break;
            case 0x50: if (this.mmu.biosOFF === false) { this.mmu.biosOff = true; this.mmu.loadRom(); } break;
            default:
                this.register[address & 0x7F] = (value & 0xFF);
                break;
        }
    }

    read8(address) {
        switch (address & 0xFF) {
            default: return this.register[address & 0x7F] & 0xFF;
        }
    }
}

export{IO};
