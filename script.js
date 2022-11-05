class IO{

    register = new Uint8Array(0x80);
	
	init(mmu, cpu, ppu) {
		this.mmu = mmu;
		this.cpu = cpu;
		this.ppu = ppu;
	}

	write8(address, value) {
		switch (address & 0xFF) {
		case 0x47: this.ppu.updatePalette(value & 0xFF); break;
		case 0x50: this.mmu.loadRom(mmu.romPath); break;
		default:
			this.register[address & 0x7F] = (value & 0xFF);
			break;
		}
	}
	
	read8(address) {
		switch(address & 0xFF)
		{
			default: return this.register[address & 0x7F] & 0xFF;
		}
	}
}

io = new IO();

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

        this.romBank0 = new Uint8Array(0x4000);
        this.romBankN = new Uint8Array(0x4000);
        this.wRam = new Uint8Array(0x2000);
        this.oam = new Uint8Array(0xA0);
        this.hram = new Uint8Array(0x80);

        this.romBank0 = [...this.bios];
    };

    init(io){
        this.io = io;
    }

    read8(address) {

        switch ((address & 0xFFFF) >> 12) {
            case 0: case 1: case 2: case 3:
                return this.romBank0[address & 0x3FFF] & 0xFF;
            case 4: case 5: case 6: case 7:
                return this.romBankN[address & 0x3FFF] & 0xFF;
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
		switch ((address & 0xFFFF) >> 12) {
		case 0: case 1: case 2: case 3:
			//romBank0[address & 0x3FFF] = (byte) (value & 0xFF);
			break;
		case 4: case 5: case 6: case 7:
			//romBank0[address & 0x3FFF] = (byte) (value & 0xFF);
			break;
		case 0xC: case 0xD:
			this.wRam[address & 0x1FFF] = (value & 0xFF);
			break;
		case 0xF:
			switch((address >> 8) & 0xF){
			case 0xE:
					this.oam[0x9F & address] = (value & 0xFF);
					 break;
			case 0xF:
				switch((address >> 4) & 0xF) {
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
};

mmu = new MMU();

const A = 'A';
const B = 'B';
const C = 'C';
const D = 'D';
const E = 'E';
const F = 'F';
const H = 'H';
const L = 'L';
const af = 'AF';
const bc = 'BC';
const de = 'DE';
const hl = 'HL';

const ZERO = 7;
const NEGATIVE = 6;
const HALF_CARRY = 5;
const CARRY = 4;

class CPU {
    constructor() {
        this.m = 0; // M Cycles;
        this.totalCycles = 0;
    };

    init(mmu, bus){
        this.mmu = mmu;
        this.bus = bus;
    }

    reg = {
        A: 0,
        B: 0,
        C: 0,
        D: 0,
        E: 0,
        F: 0,
        H: 0,
        L: 0,
        SP: 0,
        PC: 0,

        get AF() { return this.A << 8 | this.F },
        set AF(u16) { [this.F, this.A] = [(u16 & 0xFF), (u16 >> 8)] },
        get BC() { return this.B << 8 | this.C },
        set BC(u16) { [this.C, this.B] = [(u16 & 0xFF), (u16 >> 8)] },
        get DE() { return this.D << 8 | this.E },
        set DE(u16) { [this.E, this.D] = [(u16 & 0xFF), (u16 >> 8)] },
        get HL() { return this.H << 8 | this.L },
        set HL(u16) { [this.L, this.H] = [(u16 & 0xFF), (u16 >> 8)] },

        get _AF_() { return this.A << 8 | this.F },
        set _AF_(u16) { [this.F, this.A] = [(u16 & 0xFF), (u16 >> 8)] },
        get _BC_() { return this.B << 8 | this.C },
        set _BC_(u16) { [this.C, this.B] = [(u16 & 0xFF), (u16 >> 8)] },
        get _DE_() { return this.D << 8 | this.E },
        set _DE_(u16) { [this.E, this.D] = [(u16 & 0xFF), (u16 >> 8)] },
        get _HL_() { return bus.read8(this.HL)},
        set _HL_(u8) { bus.write8(this.HL, u8)},
    };

    // writeR = (register, value) => this.reg[register] = value;
    // readR = (register) => this.reg[register];
    decR = (register) => {
        let tmp = this.reg[register] - 1;
        this.setFlag(ZERO, (tmp & 0xFF) === 0);
        this.setFlag(NEGATIVE, true);
        this.setFlag(HALF_CARRY, ((((tmp & 0xf) - (this.reg[register] & 0xf)) & 0x10) < 0));
        this.reg[register] = tmp & 0xFF;
    }

    incR(register) {
		let tmp = cpu.reg[register] + 1;
		this.setFlag(ZERO, (tmp & 0xFF) == 0);
		this.setFlag(NEGATIVE, false);
		this.setFlag(HALF_CARRY, ((((tmp & 0xf) + (cpu.reg[register] & 0xf)) & 0x10) === 0x10));
		cpu.reg[register]= tmp & 0xFF;
	}

    setFlag(bit, condition) {
		this.reg.F = (this.reg.F & ~(1 << bit)) | (condition << bit);
	};
    setFlags(z, n, h, c){
    }

    jmpCond(condition){
        let offset = bus.next8();
		if (condition) {
			this.reg.PC += (offset > 127) ? (offset & 0x7F) - 128 : offset & 0x7F;
			this.m = 3;
		}
		this.m = 2;
    }
    xor = (u8) => {
        this.reg.A ^= u8 & 0xFF;
        this.reg.F = (this.reg.A === 0) ? 0x80 : 0x00
    };

    cbBit = (bitPos, u8) => {
        let bit = !(u8 >> bitPos ) & 0x1;
        this.setFlag(ZERO, bit);
        this.setFlag(NEGATIVE, false);
        this.setFlag(HALF_CARRY, true);
    }
    tick() {
        this.OC = bus.next8();
        this.instructions[this.OC]();
    }

    instructions = {
        0x00: () => this.m = 1,

        0x20: () => {this.jmpCond((this.reg.F & 0x80) === 0x00)},

        0x04: () => {this.incR(B); this.m = 1},
        0x0C: () => {this.incR(C); this.m = 1},
        0x14: () => {this.incR(D); this.m = 1},
        0x1C: () => {this.incR(E); this.m = 1},
        0x24: () => {this.incR(H); this.m = 1},
        0x2C: () => {this.incR(L); this.m = 1},
        0x34: () => {this.incR(_HL_); this.m = 3},
        0x3C: () => {this.incR(A); this.m = 1},

        0x05: () => {this.decR(B); this.m = 1},
        0x0D: () => {this.decR(C); this.m = 1},
        0x15: () => {this.decR(D); this.m = 1},
        0x1D: () => {this.decR(E); this.m = 1},
        0x25: () => {this.decR(H); this.m = 1},
        0x2D: () => {this.decR(L); this.m = 1},
        0x35: () => {this.decR(_HL_); this.m = 3},
        0x3D: () => {this.decR(A); this.m = 1},

        0x01: () => { this.reg.BC = bus.next16(); this.m = 3 },
        0x11: () => { this.reg.DE = bus.next16(); this.m = 3 },
        0x21: () => { this.reg.HL = bus.next16(); this.m = 3 },
        0x31: () => { this.reg.SP = bus.next16(); this.m = 3 },

        0x02: () => { this.reg._BC_ = this.reg.A; this.m = 2 },
        0x12: () => { this.reg._DE_ = this.reg.A; this.m = 2 },
        0x22: () => { this.reg._HL_ = this.reg.A; this.reg.HL++; this.m = 2 },
        0x32: () => { this.reg._HL_ = this.reg.A; this.reg.HL--; this.m = 2 },

        0x06: () => {this.reg.B = bus.next8(); this.m = 2},
        0x0E: () => {this.reg.C = bus.next8(); this.m = 2},
        0x16: () => {this.reg.D = bus.next8(); this.m = 2},
        0x1E: () => {this.reg.E = bus.next8(); this.m = 2},
        0x26: () => {this.reg.H = bus.next8(); this.m = 2},
        0x2E: () => {this.reg.L = bus.next8(); this.m = 2},
        0x36: () => {this.reg._HL_ = bus.next8(); this.m = 3},
        0x3E: () => {this.reg.A = bus.next8(); this.m = 2},

        0x40: () => { this.reg.B = this.reg.B; this.m = 1 },
        0x41: () => { this.reg.B = this.reg.C; this.m = 1 },
        0x42: () => { this.reg.B = this.reg.D; this.m = 1 },
        0x43: () => { this.reg.B = this.reg.E; this.m = 1 },
        0x44: () => { this.reg.B = this.reg.H; this.m = 1 },
        0x45: () => { this.reg.B = this.reg.L; this.m = 1 },
        0x46: () => { this.reg.B = this.reg._HL_; this.m = 2 },
        0x47: () => { this.reg.B = this.reg.A; this.m = 1 },

        0x48: () => { this.reg.C = this.reg.B; this.m = 1 },
        0x49: () => { this.reg.C = this.reg.C; this.m = 1 },
        0x4A: () => { this.reg.C = this.reg.D; this.m = 1 },
        0x4B: () => { this.reg.C = this.reg.E; this.m = 1 },
        0x4C: () => { this.reg.C = this.reg.H; this.m = 1 },
        0x4D: () => { this.reg.C = this.reg.L; this.m = 1 },
        0x4E: () => { this.reg.C = this.reg._HL_; this.m = 2 },
        0x4F: () => { this.reg.C = this.reg.A; this.m = 1 },

        0x50: () => { this.reg.D = this.reg.B; this.m = 1 },
        0x51: () => { this.reg.D = this.reg.C; this.m = 1 },
        0x52: () => { this.reg.D = this.reg.D; this.m = 1 },
        0x53: () => { this.reg.D = this.reg.E; this.m = 1 },
        0x54: () => { this.reg.D = this.reg.H; this.m = 1 },
        0x55: () => { this.reg.D = this.reg.L; this.m = 1 },
        0x56: () => { this.reg.D = this.reg._HL_; this.m = 2 },
        0x57: () => { this.reg.D = this.reg.A; this.m = 1 },

        0x58: () => { this.reg.E = this.reg.B; this.m = 1 },
        0x59: () => { this.reg.E = this.reg.C; this.m = 1 },
        0x5A: () => { this.reg.E = this.reg.D; this.m = 1 },
        0x5B: () => { this.reg.E = this.reg.E; this.m = 1 },
        0x5C: () => { this.reg.E = this.reg.H; this.m = 1 },
        0x5D: () => { this.reg.E = this.reg.L; this.m = 1 },
        0x5E: () => { this.reg.E = this.reg._HL_; this.m = 2 },
        0x5F: () => { this.reg.E = this.reg.A; this.m = 1 },

        0x60: () => { this.reg.H = this.reg.B; this.m = 1 },
        0x61: () => { this.reg.H = this.reg.C; this.m = 1 },
        0x62: () => { this.reg.H = this.reg.D; this.m = 1 },
        0x63: () => { this.reg.H = this.reg.E; this.m = 1 },
        0x64: () => { this.reg.H = this.reg.H; this.m = 1 },
        0x65: () => { this.reg.H = this.reg.L; this.m = 1 },
        0x66: () => { this.reg.H = this.reg._HL_; this.m = 2 },
        0x67: () => { this.reg.H = this.reg.A; this.m = 1 },

        0x68: () => { this.reg.L = this.reg.B; this.m = 1 },
        0x69: () => { this.reg.L = this.reg.C; this.m = 1 },
        0x6A: () => { this.reg.L = this.reg.D; this.m = 1 },
        0x6B: () => { this.reg.L = this.reg.E; this.m = 1 },
        0x6C: () => { this.reg.L = this.reg.H; this.m = 1 },
        0x6D: () => { this.reg.L = this.reg.L; this.m = 1 },
        0x6E: () => { this.reg.L = this.reg._HL_; this.m = 2 },
        0x6F: () => { this.reg.L = this.reg.A; this.m = 1 },

        0x70: () => { this.reg._HL_ = this.reg.B; this.m = 1 },
        0x71: () => { this.reg._HL_= this.reg.C; this.m = 1 },
        0x72: () => { this.reg._HL_ = this.reg.D; this.m = 1 },
        0x73: () => { this.reg._HL_ = this.reg.E; this.m = 1 },
        0x74: () => { this.reg._HL_ = this.reg.H; this.m = 1 },
        0x75: () => { this.reg._HL_ = this.reg.L; this.m = 1 },
        // 0x76: () => { this.reg._HL_ = this.reg._HL_; this.m = 2 },
        0x77: () => { this.reg._HL_ = this.reg.A; this.m = 1 },

        0x78: () => { this.reg.A = this.reg.B; this.m = 1 },
        0x79: () => { this.reg.A = this.reg.C; this.m = 1 },
        0x7A: () => { this.reg.A = this.reg.D; this.m = 1 },
        0x7B: () => { this.reg.A = this.reg.E; this.m = 1 },
        0x7C: () => { this.reg.A = this.reg.H; this.m = 1 },
        0x7D: () => { this.reg.A = this.reg.L; this.m = 1 },
        0x7E: () => { this.reg.A = this.reg._HL_; this.m = 2 },
        0x7F: () => { this.reg.A = this.reg.A; this.m = 1 },

        0xE2: () => { this.bus.write8(0xFF00 + this.reg.C, this.reg.A); this.m = 2},

        0xA8: () => { this.xor(this.reg.B); this.m = 1 },
        0xA9: () => { this.xor(this.reg.C); this.m = 1 },
        0xAA: () => { this.xor(this.reg.D); this.m = 1 },
        0xAB: () => { this.xor(this.reg.E); this.m = 1 },
        0xAC: () => { this.xor(this.reg.H); this.m = 1 },
        0xAD: () => { this.xor(this.reg.L); this.m = 1 },
        0xAE: () => { this.xor(this.reg._HL_); this.m = 2 },
        0xAF: () => { this.xor(this.reg.A); this.m = 1 },

        0xCB: () => this.cbInstructions[this.bus.next8()](),
        default:() => {console.log("Instruction not implemented: " + this.OC)}
    };

    cbInstructions = {
        0x40: () => { this.cbBit(0, this.reg.B); this.m = 3 },
        0x41: () => { this.cbBit(0, this.reg.C); this.m = 3 },
        0x42: () => { this.cbBit(0, this.reg.D); this.m = 3 },
        0x43: () => { this.cbBit(0, this.reg.E); this.m = 3 },
        0x44: () => { this.cbBit(0, this.reg.H); this.m = 3 },
        0x45: () => { this.cbBit(0, this.reg.L); this.m = 3 },
        0x46: () => { this.cbBit(0, this.reg._HL_); this.m = 4 },
        0x47: () => { this.cbBit(0, this.reg.B); this.m = 3 },

        0x48: () => { this.cbBit(1, this.reg.B); this.m = 3 },
        0x49: () => { this.cbBit(1, this.reg.C); this.m = 3 },
        0x4A: () => { this.cbBit(1, this.reg.D); this.m = 3 },
        0x4B: () => { this.cbBit(1, this.reg.E); this.m = 3 },
        0x4C: () => { this.cbBit(1, this.reg.H); this.m = 3 },
        0x4D: () => { this.cbBit(1, this.reg.L); this.m = 3 },
        0x4E: () => { this.cbBit(1, this.reg._HL_); this.m = 4 },
        0x4F: () => { this.cbBit(1, this.reg.B); this.m = 3 },

        0x50: () => { this.cbBit(2, this.reg.B); this.m = 3 },
        0x51: () => { this.cbBit(2, this.reg.C); this.m = 3 },
        0x52: () => { this.cbBit(2, this.reg.D); this.m = 3 },
        0x53: () => { this.cbBit(2, this.reg.E); this.m = 3 },
        0x54: () => { this.cbBit(2, this.reg.H); this.m = 3 },
        0x55: () => { this.cbBit(2, this.reg.L); this.m = 3 },
        0x56: () => { this.cbBit(2, this.reg._HL_); this.m = 4 },
        0x57: () => { this.cbBit(2, this.reg.B); this.m = 3 },

        0x58: () => { this.cbBit(3, this.reg.B); this.m = 3 },
        0x59: () => { this.cbBit(3, this.reg.C); this.m = 3 },
        0x5A: () => { this.cbBit(3, this.reg.D); this.m = 3 },
        0x5B: () => { this.cbBit(3, this.reg.E); this.m = 3 },
        0x5C: () => { this.cbBit(3, this.reg.H); this.m = 3 },
        0x5D: () => { this.cbBit(3, this.reg.L); this.m = 3 },
        0x5E: () => { this.cbBit(3, this.reg._HL_); this.m = 4 },
        0x5F: () => { this.cbBit(3, this.reg.B); this.m = 3 },

        0x60: () => { this.cbBit(4, this.reg.B); this.m = 3 },
        0x61: () => { this.cbBit(4, this.reg.C); this.m = 3 },
        0x62: () => { this.cbBit(4, this.reg.D); this.m = 3 },
        0x63: () => { this.cbBit(4, this.reg.E); this.m = 3 },
        0x64: () => { this.cbBit(4, this.reg.H); this.m = 3 },
        0x65: () => { this.cbBit(4, this.reg.L); this.m = 3 },
        0x66: () => { this.cbBit(4, this.reg._HL_); this.m = 4 },
        0x67: () => { this.cbBit(4, this.reg.B); this.m = 3 },

        0x68: () => { this.cbBit(5, this.reg.B); this.m = 3 },
        0x69: () => { this.cbBit(5, this.reg.C); this.m = 3 },
        0x6A: () => { this.cbBit(5, this.reg.D); this.m = 3 },
        0x6B: () => { this.cbBit(5, this.reg.E); this.m = 3 },
        0x6C: () => { this.cbBit(5, this.reg.H); this.m = 3 },
        0x6D: () => { this.cbBit(5, this.reg.L); this.m = 3 },
        0x6E: () => { this.cbBit(5, this.reg._HL_); this.m = 4 },
        0x6F: () => { this.cbBit(5, this.reg.B); this.m = 3 },

        0x70: () => { this.cbBit(6, this.reg.B); this.m = 3 },
        0x71: () => { this.cbBit(6, this.reg.C); this.m = 3 },
        0x72: () => { this.cbBit(6, this.reg.D); this.m = 3 },
        0x73: () => { this.cbBit(6, this.reg.E); this.m = 3 },
        0x74: () => { this.cbBit(6, this.reg.H); this.m = 3 },
        0x75: () => { this.cbBit(6, this.reg.L); this.m = 3 },
        0x76: () => { this.cbBit(6, this.reg._HL_); this.m = 4 },
        0x77: () => { this.cbBit(6, this.reg.B); this.m = 3 },

        0x78: () => { this.cbBit(7, this.reg.B); this.m = 3 },
        0x79: () => { this.cbBit(7, this.reg.C); this.m = 3 },
        0x7A: () => { this.cbBit(7, this.reg.D); this.m = 3 },
        0x7B: () => { this.cbBit(7, this.reg.E); this.m = 3 },
        0x7C: () => { this.cbBit(7, this.reg.H); this.m = 3 },
        0x7D: () => { this.cbBit(7, this.reg.L); this.m = 3 },
        0x7E: () => { this.cbBit(7, this.reg._HL_); this.m = 4 },
        0x7F: () => { this.cbBit(7, this.reg.B); this.m = 3 },

    }

};


cpu = new CPU();

class PPU {
    vram = new Uint8Array(0x2000);

    write8(address, value) {
        this.vram[address & 0x1FFF] = value & 0xFF;
    }

    read8(address) {
        return this.vram[address & 0x1FFF];
    }
}

ppu = new PPU();

class Bus{
    init(cpu, mmu, ppu){
        this.cpu = cpu;
        this.mmu = mmu;
        this.ppu = ppu;
    }

    read8(address) {
		switch((address & 0xF000))
		{	
			case 0x0000: case 0x1000: case 0x2000: case 0x3000:
				return mmu.read8(address);
			case 0x4000: case 0x5000: case 0x6000: case 0x7000:
				return mmu.read8(address);
			case 0x8000: case 0x9000:
				return ppu.read8(address);
			case 0xA000: case 0xB000:
				// implement External ram
				break;
			case 0xC000:
				return mmu.read8(address);
			case 0xD000:
				return mmu.read8(address);
			case 0xE000:
				// not used area
                break;
			case 0xF000:
				return mmu.read8(address);
			default: console.log("Area not implemented: " + address); break;
		}
		return 0;
	};

    write8(address, value) {
		switch((address & 0xF000))
		{	
			case 0x0000: case 0x1000: case 0x2000: case 0x3000:
				mmu.write8(address, value);
			case 0x4000: case 0x5000: case 0x6000: case 0x7000:
				mmu.write8(address, value);
				break;
			case 0x8000: case 0x9000:
				ppu.write8(address, value);
				break;
			case 0xA000: case 0xB000:
				// implement External ram
				break;
			case 0xC000:
				mmu.write8(address, value);
				break;
			case 0xD000:
				mmu.write8(address, value);
				break;
			case 0xE000:
				// not used area
			case 0xF000:
				mmu.write8(address, value);
				break;
			default: console.log("Area not implemented: " + address);
		}
	};

    next8() {
		return this.read8(this.cpu.reg.PC++) & 0xFF;
	}
	
	next16() {
		return (this.next8() | this.next8() << 8) & 0xFFFF;
	}

}

bus = new Bus();

bus.init(cpu, mmu, ppu);
cpu.init(mmu, bus);
io.init(mmu, cpu, ppu);
mmu.init(io);

function updateDebug() {
    document.getElementById("pc").innerHTML = `PC: ${cpu.reg.PC.toString(16)}`;
    document.getElementById("af").innerHTML = 'AF: ' + cpu.reg.AF.toString(16);
    document.getElementById("bc").innerHTML = 'BC: ' + cpu.reg.BC.toString(16);
    document.getElementById("de").innerHTML = 'DE: ' + cpu.reg.DE.toString(16);
    document.getElementById("hl").innerHTML = 'HL: ' + cpu.reg.HL.toString(16);
    document.getElementById("sp").innerHTML = 'SP: ' + cpu.reg.SP.toString(16);

    document.getElementById("zero").checked = (cpu.reg.F & 0x80) === 0x80;
    document.getElementById("negative").checked = (cpu.reg.F & 0x40) === 0x40;
    document.getElementById("halfcarry").checked = (cpu.reg.F & 0x20) === 0x20;
    document.getElementById("carry").checked = (cpu.reg.F & 0x10) === 0x10;
};

function tick() {
    cpu.tick();
    updateDebug();
}

running = true;

function run(){
    while(running){
        cpu.tick();
        console.log(`PC: ${cpu.reg.PC.toString(16)} OC: ${cpu.OC.toString(16)} HL: ${cpu.reg.HL.toString(16)}`);
    }
    // updateDebug();
}