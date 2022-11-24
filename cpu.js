const A = 'A';
const B = 'B';
const C = 'C';
const D = 'D';
const E = 'E';
const F = 'F';
const H = 'H';
const L = 'L';
const AF = 'AF';
const BC = 'BC';
const DE = 'DE';
const HL = 'HL';
const _HL_ = '_HL_';

const ZERO = 7;
const NEGATIVE = 6;
const HALF_CARRY = 5;
const CARRY = 4;

class CPU{
    constructor() {
        this.m = 0; // M Cycles;
        this.OC = 0x00;
        this.totalCycles = 0;
    };

    init(mmu, bus) {
        this.mmu = mmu;
        this.bus = bus;
        this.reg.bus = bus; // really ?
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

        get _AF_() { return this.bus.read8(this.AF) },
        set _AF_(u8) { this.bus.write8(this.AF, u8) },

        get _BC_() { return this.bus.read8(this.BC) },
        set _BC_(u8) { this.bus.write8(this.BC, u8) },

        get _DE_() { return this.bus.read8(this.DE) },
        set _DE_(u8) { this.bus.write8(this.DE, u8) },

        get _HL_() { return this.bus.read8(this.HL); },
        set _HL_(u8) { this.bus.write8(this.HL, u8) },
    };

    decR = (register) => {
        let tmp = this.reg[register] - 1;
        this.setFlag(ZERO, (tmp & 0xFF) === 0);
        this.setFlag(NEGATIVE, true);
        this.setFlag(HALF_CARRY, ((((tmp & 0xf) - (this.reg[register] & 0xf)) & 0x10) < 0));
        this.reg[register] = tmp & 0xFF;
    }

    incR(register) {
        let tmp = this.reg[register] + 1;
        this.setFlag(ZERO, (tmp & 0xFF) == 0);
        this.setFlag(NEGATIVE, false);
        this.setFlag(HALF_CARRY, ((((tmp & 0xf) + (this.reg[register] & 0xf)) & 0x10) === 0x10));
        this.reg[register] = tmp & 0xFF;
    }
    setFlag(bit, condition) {
        this.reg.F = (this.reg.F & ~(1 << bit)) | (condition << bit);
    };

    getFlag(bit) {
        return (this.reg.F >> bit) & 0x1;
    }

    push8(value) {
        this.bus.write8(--this.reg.SP, value & 0xFF);
    }

    push16(value) {
        this.push8((value >> 8) & 0xFF);
        this.push8(value & 0xFF);
    }

    pop8() {
        return this.bus.read8(this.reg.SP++);
    }

    pop16() {
        return this.pop8() | this.pop8() << 8;
    }

    jr(condition) {
        let offset = this.bus.next8();
        if (condition) {
            this.reg.PC += (offset > 127) ? (offset & 0x7F) - 128 : offset & 0x7F;
            this.m = 3;
        } else this.m = 2;
    }

    jp = (condition) => {
        let newPC = this.bus.next16();
        if (condition) {
            this.reg.PC = newPC;
            this.m = 4;
        }
        else this.m = 3;
    }

    call(condition) {
        let newPC = this.bus.read16();
        if (condition) {
            this.push16(this.reg.PC + 2);
            this.reg.PC = newPC;
            this.m = 6;
        } else this.m = 3;
    }

    ret() {
        this.reg.PC = this.pop16();
        this.m = 4;
    }

    retCond(condition) {
        if (condition) {
            this.reg.PC = this.pop16();
            this.m = 5;
        }
        else this.m = 2
    }

    add = (u8) => {
        let tmp = this.reg.A + u8;
        this.setFlag(ZERO, true);
        this.setFlag(NEGATIVE, false);
        this.setFlag(HALF_CARRY, (this.reg.A & 0xF) + (u8 & 0xF) > 0xF);
        this.setFlag(CARRY, tmp > 0xFF);
        this.reg.A = tmp & 0xFF;
    }

    and = (u8) => {
        let tmp = this.reg.A & u8;
        this.setFlag(ZERO, tmp === 0x00);
        this.setFlag(NEGATIVE, false);
        this.setFlag(HALF_CARRY, true);
        this.setFlag(CARRY, false);
        this.reg.A = tmp & 0xFF;
    };

    xor = (u8) => {
        this.reg.A ^= u8 & 0xFF;
        this.reg.F = (this.reg.A === 0) ? 0x80 : 0x00
    };
    or = (u8) => {
        this.reg.A |= u8 & 0xFF;
        this.reg.F = (this.reg.A === 0) ? 0x80 : 0x00
    }

    sub = (u8) => {
        let tmp = this.reg.A - u8;
        this.setFlag(ZERO, (tmp & 0xFF) == 0);
        this.setFlag(NEGATIVE, true);
        this.setFlag(HALF_CARRY, (((this.reg.A & 0xf) - (u8 & 0xf)) & 0x10) == 0x10);
        this.setFlag(CARRY, u8 > this.reg.A); // check this line later
        this.reg.A = tmp & 0xFF;
    }

    cp = (u8) => {
        let tmp = this.reg.A - (u8 & 0xFF);
        this.setFlag(ZERO, (tmp & 0xFF) == 0);
        this.setFlag(NEGATIVE, true);
        this.setFlag(HALF_CARRY, (((this.reg.A & 0xf) - (u8 & 0xf)) & 0x10) == 0x10);
        this.setFlag(CARRY, u8 > this.reg.A); // check this line later
    }

    cbBit = (bitPos, u8) => {
        let bit = !(u8 >> bitPos) & 0x1;
        this.setFlag(ZERO, bit);
        this.setFlag(NEGATIVE, false);
        this.setFlag(HALF_CARRY, true);
    }

    rla = () => {
        let carry = (this.reg.A >> 7) & 0x1;
        this.reg.A = (this.reg.A << 1 | this.getFlag(CARRY)) & 0xFF;

        this.setFlag(ZERO, false);
        this.setFlag(HALF_CARRY, false);
        this.setFlag(NEGATIVE, false);
        this.setFlag(CARRY, carry);
    }

    cbRl = (register) => {
        //check this implementation later
        let carry = (this.reg[register] >> 7) & 0x1;
        this.reg[register] = (this.reg[register] << 1 | this.getFlag(CARRY)) & 0xFF;

        this.setFlag(ZERO, this.reg[register] === 0x00);
        this.setFlag(HALF_CARRY, false);
        this.setFlag(NEGATIVE, false);
        this.setFlag(CARRY, carry);
    }

    tick() {
        this.OC = this.bus.next8();
        if(this.instructions[this.OC] === undefined){
            console.log("Unimplemented instruction: ", this.OC.toString(16));
        };
        this.instructions[this.OC]();
    }

    instructions = {
        0x00: () => { this.m = 1 },
        0x18: () => { this.jr(true) },
        0x20: () => { this.jr((this.reg.F & 0x80) === 0x00) },
        0x28: () => { this.jr((this.reg.F & 0x80) === 0x80) },
    
        0xCD: () => { this.call(true) },
        0xC4: () => { this.call((this.reg.F & 0x80) === 0x00) },
        0xC3: () => { this.jp(true) },
        0xC8: () => { this.retCond((this.reg.F & 0x80) === 0x80) },
        0xC9: () => { this.ret() },
    
        0xC1: () => { this.reg.BC = this.pop16(); this.m = 3 },
        0xD1: () => { this.reg.DE = this.pop16(); this.m = 3 },
        0xE1: () => { this.reg.HL = this.pop16(); this.m = 3 },
        0xF1: () => { this.reg.AF = this.pop16(); this.m = 3 },
    
        0xC5: () => { this.push16(this.reg.BC); this.m = 4 },
        0xD5: () => { this.push16(this.reg.DE); this.m = 4 },
        0xE5: () => { this.push16(this.reg.HL); this.m = 4 },
        0xF5: () => { this.push16(this.reg.AF); this.m = 4 },
    
        0x04: () => { this.incR(B); this.m = 1 },
        0x0C: () => { this.incR(C); this.m = 1 },
        0x14: () => { this.incR(D); this.m = 1 },
        0x1C: () => { this.incR(E); this.m = 1 },
        0x24: () => { this.incR(H); this.m = 1 },
        0x2C: () => { this.incR(L); this.m = 1 },
        0x34: () => { this.incR(_HL_); this.m = 3 },
        0x3C: () => { this.incR(A); this.m = 1 },
    
        0x05: () => { this.decR(B); this.m = 1 },
        0x0D: () => { this.decR(C); this.m = 1 },
        0x15: () => { this.decR(D); this.m = 1 },
        0x1D: () => { this.decR(E); this.m = 1 },
        0x25: () => { this.decR(H); this.m = 1 },
        0x2D: () => { this.decR(L); this.m = 1 },
        0x35: () => { this.decR(_HL_); this.m = 3 },
        0x3D: () => { this.decR(A); this.m = 1 },
    
        0x03: () => { this.reg.BC++; this.m = 2 },
        0x13: () => { this.reg.DE++; this.m = 2 },
        0x23: () => { this.reg.HL++; this.m = 2 },
        0x33: () => { this.reg.SP++; this.m = 2 },
        0x0B: () => { this.reg.BC--; this.m = 2 },
        0x1B: () => { this.reg.DE--; this.m = 2 },
        0x2B: () => { this.reg.HL--; this.m = 2 },
        0x3B: () => { this.reg.SP--; this.m = 2 },
    
        0x01: () => { this.reg.BC = this.bus.next16(); this.m = 3 },
        0x11: () => { this.reg.DE = this.bus.next16(); this.m = 3 },
        0x21: () => { this.reg.HL = this.bus.next16(); this.m = 3 },
        0x31: () => { this.reg.SP = this.bus.next16(); this.m = 3 },
    
        0x02: () => { this.reg._BC_ = this.reg.A; this.m = 2 },
        0x12: () => { this.reg._DE_ = this.reg.A; this.m = 2 },
        0x22: () => { this.reg._HL_ = this.reg.A; this.reg.HL++; this.m = 2 },
        0x32: () => { this.reg._HL_ = this.reg.A; this.reg.HL--; this.m = 2 },
    
        0x0A: () => { this.reg.A = this.reg._BC_; this.m = 2 },
        0x1A: () => { this.reg.A = this.reg._DE_; this.m = 2 },
        0x2A: () => { this.reg.A = this.reg._HL_; this.reg.HL++; this.m = 2 },
        0x3A: () => { this.reg.A = this.reg._HL_; this.reg.HL--; this.m = 2 },
    
        0x06: () => { this.reg.B = this.bus.next8(); this.m = 2 },
        0x0E: () => { this.reg.C = this.bus.next8(); this.m = 2 },
        0x16: () => { this.reg.D = this.bus.next8(); this.m = 2 },
        0x1E: () => { this.reg.E = this.bus.next8(); this.m = 2 },
        0x26: () => { this.reg.H = this.bus.next8(); this.m = 2 },
        0x2E: () => { this.reg.L = this.bus.next8(); this.m = 2 },
        0x36: () => { this.reg._HL_ = this.bus.next8(); this.m = 3 },
        0x3E: () => { this.reg.A = this.bus.next8(); this.m = 2 },
    
    
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
        0x71: () => { this.reg._HL_ = this.reg.C; this.m = 1 },
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
    
        0xE0: () => { this.bus.write8(0xFF00 + this.bus.next8(), this.reg.A); this.m = 3 },
        0xE2: () => { this.bus.write8(0xFF00 + this.reg.C, this.reg.A); this.m = 2 },
        0xEA: () => { this.bus.write8(this.bus.next16(), this.reg.A); this.m = 4 },
        0xF0: () => { this.reg.A = this.bus.read8(0xFF00 + this.bus.next8()); this.m = 3 },
        0xFA: () => { this.reg.A = this.bus.read8(this.bus.next16()); this.m = 4 },
    
        0x17: () => { this.rla(); this.m = 1 },
        0x86: () => { this.add(this.reg._HL_); this.m = 2 },
        0xC6: () => { this.add(this.bus.next8()); this.m = 2 },
    
        0x90: () => { this.sub(this.reg.B); this.m = 1 },
        0xD6: () => { this.sub(this.bus.next8()); this.m = 2 },
    
        0xA0: () => { this.and(this.reg.B); this.m = 1 },
        0xA1: () => { this.and(this.reg.C); this.m = 1 },
        0xA2: () => { this.and(this.reg.D); this.m = 1 },
        0xA3: () => { this.and(this.reg.E); this.m = 1 },
        0xA4: () => { this.and(this.reg.H); this.m = 1 },
        0xA5: () => { this.and(this.reg.L); this.m = 1 },
        0xA6: () => { this.and(this.reg._HL_); this.m = 2 },
        0xA7: () => { this.and(this.reg.A); this.m = 1 },
        0xE6: () => { this.and(this.bus.next8()); this.m = 2 },
    
        0xA8: () => { this.xor(this.reg.B); this.m = 1 },
        0xA9: () => { this.xor(this.reg.C); this.m = 1 },
        0xAA: () => { this.xor(this.reg.D); this.m = 1 },
        0xAB: () => { this.xor(this.reg.E); this.m = 1 },
        0xAC: () => { this.xor(this.reg.H); this.m = 1 },
        0xAD: () => { this.xor(this.reg.L); this.m = 1 },
        0xAE: () => { this.xor(this.reg._HL_); this.m = 2 },
        0xAF: () => { this.xor(this.reg.A); this.m = 1 },
    
        0xB0: () => { this.or(this.reg.B); this.m = 1 },
        0xB1: () => { this.or(this.reg.C); this.m = 1 },
        0xB2: () => { this.or(this.reg.D); this.m = 1 },
        0xB3: () => { this.or(this.reg.E); this.m = 1 },
        0xB4: () => { this.or(this.reg.H); this.m = 1 },
        0xB5: () => { this.or(this.reg.L); this.m = 1 },
        0xB6: () => { this.or(this.reg._HL_); this.m = 2 },
        0xB7: () => { this.or(this.reg.A); this.m = 1 },
    
        0xB8: () => { this.cp(this.reg.B); this.m = 1 },
        0xB9: () => { this.cp(this.reg.C); this.m = 1 },
        0xBA: () => { this.cp(this.reg.D); this.m = 1 },
        0xBB: () => { this.cp(this.reg.E); this.m = 1 },
        0xBC: () => { this.cp(this.reg.H); this.m = 1 },
        0xBD: () => { this.cp(this.reg.L); this.m = 1 },
        0xBE: () => { this.cp(this.reg._HL_); this.m = 2 },
        0xBF: () => { this.cp(this.reg.A); this.m = 1 },
        0xFE: () => { this.cp(this.bus.next8()); this.m = 2 },
    
        0xF3: () => { this.m = 1 },
    
        0xCB: () => {
            let cbInst = this.cbInstructions[this.OC = this.bus.next8()];
            if (cbInst === undefined)
                console.log("CB Instruction not implemented: " + this.OC.toString(16))
            cbInst();
        },
    };
    

    cbInstructions = {
        0x10: () => { this.cbRl(B); this.m = 3 },
        0x11: () => { this.cbRl(C); this.m = 3 },
        0x12: () => { this.cbRl(D); this.m = 3 },
        0x13: () => { this.cbRl(E); this.m = 3 },
        0x14: () => { this.cbRl(H); this.m = 3 },
        0x15: () => { this.cbRl(L); this.m = 3 },
        0x16: () => { this.cbRl(_HL_); this.m = 4 },
        0x17: () => { this.cbRl(A); this.m = 3 },

        0x40: () => { this.cbBit(0, this.reg.B); this.m = 3 },
        0x41: () => { this.cbBit(0, this.reg.C); this.m = 3 },
        0x42: () => { this.cbBit(0, this.reg.D); this.m = 3 },
        0x43: () => { this.cbBit(0, this.reg.E); this.m = 3 },
        0x44: () => { this.cbBit(0, this.reg.H); this.m = 3 },
        0x45: () => { this.cbBit(0, this.reg.L); this.m = 3 },
        0x46: () => { this.cbBit(0, this.reg._HL_); this.m = 4 },
        0x47: () => { this.cbBit(0, this.reg.A); this.m = 3 },

        0x48: () => { this.cbBit(1, this.reg.B); this.m = 3 },
        0x49: () => { this.cbBit(1, this.reg.C); this.m = 3 },
        0x4A: () => { this.cbBit(1, this.reg.D); this.m = 3 },
        0x4B: () => { this.cbBit(1, this.reg.E); this.m = 3 },
        0x4C: () => { this.cbBit(1, this.reg.H); this.m = 3 },
        0x4D: () => { this.cbBit(1, this.reg.L); this.m = 3 },
        0x4E: () => { this.cbBit(1, this.reg._HL_); this.m = 4 },
        0x4F: () => { this.cbBit(1, this.reg.A); this.m = 3 },

        0x50: () => { this.cbBit(2, this.reg.B); this.m = 3 },
        0x51: () => { this.cbBit(2, this.reg.C); this.m = 3 },
        0x52: () => { this.cbBit(2, this.reg.D); this.m = 3 },
        0x53: () => { this.cbBit(2, this.reg.E); this.m = 3 },
        0x54: () => { this.cbBit(2, this.reg.H); this.m = 3 },
        0x55: () => { this.cbBit(2, this.reg.L); this.m = 3 },
        0x56: () => { this.cbBit(2, this.reg._HL_); this.m = 4 },
        0x57: () => { this.cbBit(2, this.reg.A); this.m = 3 },

        0x58: () => { this.cbBit(3, this.reg.B); this.m = 3 },
        0x59: () => { this.cbBit(3, this.reg.C); this.m = 3 },
        0x5A: () => { this.cbBit(3, this.reg.D); this.m = 3 },
        0x5B: () => { this.cbBit(3, this.reg.E); this.m = 3 },
        0x5C: () => { this.cbBit(3, this.reg.H); this.m = 3 },
        0x5D: () => { this.cbBit(3, this.reg.L); this.m = 3 },
        0x5E: () => { this.cbBit(3, this.reg._HL_); this.m = 4 },
        0x5F: () => { this.cbBit(3, this.reg.A); this.m = 3 },

        0x60: () => { this.cbBit(4, this.reg.B); this.m = 3 },
        0x61: () => { this.cbBit(4, this.reg.C); this.m = 3 },
        0x62: () => { this.cbBit(4, this.reg.D); this.m = 3 },
        0x63: () => { this.cbBit(4, this.reg.E); this.m = 3 },
        0x64: () => { this.cbBit(4, this.reg.H); this.m = 3 },
        0x65: () => { this.cbBit(4, this.reg.L); this.m = 3 },
        0x66: () => { this.cbBit(4, this.reg._HL_); this.m = 4 },
        0x67: () => { this.cbBit(4, this.reg.A); this.m = 3 },

        0x68: () => { this.cbBit(5, this.reg.B); this.m = 3 },
        0x69: () => { this.cbBit(5, this.reg.C); this.m = 3 },
        0x6A: () => { this.cbBit(5, this.reg.D); this.m = 3 },
        0x6B: () => { this.cbBit(5, this.reg.E); this.m = 3 },
        0x6C: () => { this.cbBit(5, this.reg.H); this.m = 3 },
        0x6D: () => { this.cbBit(5, this.reg.L); this.m = 3 },
        0x6E: () => { this.cbBit(5, this.reg._HL_); this.m = 4 },
        0x6F: () => { this.cbBit(5, this.reg.A); this.m = 3 },

        0x70: () => { this.cbBit(6, this.reg.B); this.m = 3 },
        0x71: () => { this.cbBit(6, this.reg.C); this.m = 3 },
        0x72: () => { this.cbBit(6, this.reg.D); this.m = 3 },
        0x73: () => { this.cbBit(6, this.reg.E); this.m = 3 },
        0x74: () => { this.cbBit(6, this.reg.H); this.m = 3 },
        0x75: () => { this.cbBit(6, this.reg.L); this.m = 3 },
        0x76: () => { this.cbBit(6, this.reg._HL_); this.m = 4 },
        0x77: () => { this.cbBit(6, this.reg.A); this.m = 3 },

        0x78: () => { this.cbBit(7, this.reg.B); this.m = 3 },
        0x79: () => { this.cbBit(7, this.reg.C); this.m = 3 },
        0x7A: () => { this.cbBit(7, this.reg.D); this.m = 3 },
        0x7B: () => { this.cbBit(7, this.reg.E); this.m = 3 },
        0x7C: () => { this.cbBit(7, this.reg.H); this.m = 3 },
        0x7D: () => { this.cbBit(7, this.reg.L); this.m = 3 },
        0x7E: () => { this.cbBit(7, this.reg._HL_); this.m = 4 },
        0x7F: () => { this.cbBit(7, this.reg.A); this.m = 3 },
    }

};

 

export { CPU };