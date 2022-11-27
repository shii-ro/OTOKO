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

const cbInstructions = {
    0x10: (cpu) => { cpu.cbRl(B); cpu.m = 3 },
    0x11: (cpu) => { cpu.cbRl(C); cpu.m = 3 },
    0x12: (cpu) => { cpu.cbRl(D); cpu.m = 3 },
    0x13: (cpu) => { cpu.cbRl(E); cpu.m = 3 },
    0x14: (cpu) => { cpu.cbRl(H); cpu.m = 3 },
    0x15: (cpu) => { cpu.cbRl(L); cpu.m = 3 },
    0x16: (cpu) => { cpu.cbRl(_HL_); cpu.m = 5 },
    0x17: (cpu) => { cpu.cbRl(A); cpu.m = 3 },

    0x18: (cpu) => { cpu.cbRr(B); cpu.m = 3 },
    0x19: (cpu) => { cpu.cbRr(C); cpu.m = 3 },
    0x1A: (cpu) => { cpu.cbRr(D); cpu.m = 3 },
    0x1B: (cpu) => { cpu.cbRr(E); cpu.m = 3 },
    0x1C: (cpu) => { cpu.cbRr(H); cpu.m = 3 },
    0x1D: (cpu) => { cpu.cbRr(L); cpu.m = 3 },
    0x1E: (cpu) => { cpu.cbRr(_HL_); cpu.m = 5 },
    0x1F: (cpu) => { cpu.cbRr(A); cpu.m = 3 },
    0x37: (cpu) => { cpu.cbSwap(_HL_); cpu.m = 3 },
    0x38: (cpu) => { cpu.cbSrl(B); cpu.m = 3 },
    0x39: (cpu) => { cpu.cbSrl(C); cpu.m = 3 },
    0x3A: (cpu) => { cpu.cbSrl(D); cpu.m = 3 },
    0x3B: (cpu) => { cpu.cbSrl(E); cpu.m = 3 },
    0x3C: (cpu) => { cpu.cbSrl(H); cpu.m = 3 },
    0x3D: (cpu) => { cpu.cbSrl(L); cpu.m = 3 },
    0x3E: (cpu) => { cpu.cbSrl(_HL_); cpu.m = 5 },
    0x3F: (cpu) => { cpu.cbSrl(A); cpu.m = 3 },

    0x40: (cpu) => { cpu.cbBit(0, cpu.reg.B); cpu.m = 3 },
    0x41: (cpu) => { cpu.cbBit(0, cpu.reg.C); cpu.m = 3 },
    0x42: (cpu) => { cpu.cbBit(0, cpu.reg.D); cpu.m = 3 },
    0x43: (cpu) => { cpu.cbBit(0, cpu.reg.E); cpu.m = 3 },
    0x44: (cpu) => { cpu.cbBit(0, cpu.reg.H); cpu.m = 3 },
    0x45: (cpu) => { cpu.cbBit(0, cpu.reg.L); cpu.m = 3 },
    0x46: (cpu) => { cpu.cbBit(0, cpu.reg._HL_); cpu.m = 4 },
    0x47: (cpu) => { cpu.cbBit(0, cpu.reg.A); cpu.m = 3 },

    0x48: (cpu) => { cpu.cbBit(1, cpu.reg.B); cpu.m = 3 },
    0x49: (cpu) => { cpu.cbBit(1, cpu.reg.C); cpu.m = 3 },
    0x4A: (cpu) => { cpu.cbBit(1, cpu.reg.D); cpu.m = 3 },
    0x4B: (cpu) => { cpu.cbBit(1, cpu.reg.E); cpu.m = 3 },
    0x4C: (cpu) => { cpu.cbBit(1, cpu.reg.H); cpu.m = 3 },
    0x4D: (cpu) => { cpu.cbBit(1, cpu.reg.L); cpu.m = 3 },
    0x4E: (cpu) => { cpu.cbBit(1, cpu.reg._HL_); cpu.m = 4 },
    0x4F: (cpu) => { cpu.cbBit(1, cpu.reg.A); cpu.m = 3 },

    0x50: (cpu) => { cpu.cbBit(2, cpu.reg.B); cpu.m = 3 },
    0x51: (cpu) => { cpu.cbBit(2, cpu.reg.C); cpu.m = 3 },
    0x52: (cpu) => { cpu.cbBit(2, cpu.reg.D); cpu.m = 3 },
    0x53: (cpu) => { cpu.cbBit(2, cpu.reg.E); cpu.m = 3 },
    0x54: (cpu) => { cpu.cbBit(2, cpu.reg.H); cpu.m = 3 },
    0x55: (cpu) => { cpu.cbBit(2, cpu.reg.L); cpu.m = 3 },
    0x56: (cpu) => { cpu.cbBit(2, cpu.reg._HL_); cpu.m = 4 },
    0x57: (cpu) => { cpu.cbBit(2, cpu.reg.A); cpu.m = 3 },

    0x58: (cpu) => { cpu.cbBit(3, cpu.reg.B); cpu.m = 3 },
    0x59: (cpu) => { cpu.cbBit(3, cpu.reg.C); cpu.m = 3 },
    0x5A: (cpu) => { cpu.cbBit(3, cpu.reg.D); cpu.m = 3 },
    0x5B: (cpu) => { cpu.cbBit(3, cpu.reg.E); cpu.m = 3 },
    0x5C: (cpu) => { cpu.cbBit(3, cpu.reg.H); cpu.m = 3 },
    0x5D: (cpu) => { cpu.cbBit(3, cpu.reg.L); cpu.m = 3 },
    0x5E: (cpu) => { cpu.cbBit(3, cpu.reg._HL_); cpu.m = 4 },
    0x5F: (cpu) => { cpu.cbBit(3, cpu.reg.A); cpu.m = 3 },

    0x60: (cpu) => { cpu.cbBit(4, cpu.reg.B); cpu.m = 3 },
    0x61: (cpu) => { cpu.cbBit(4, cpu.reg.C); cpu.m = 3 },
    0x62: (cpu) => { cpu.cbBit(4, cpu.reg.D); cpu.m = 3 },
    0x63: (cpu) => { cpu.cbBit(4, cpu.reg.E); cpu.m = 3 },
    0x64: (cpu) => { cpu.cbBit(4, cpu.reg.H); cpu.m = 3 },
    0x65: (cpu) => { cpu.cbBit(4, cpu.reg.L); cpu.m = 3 },
    0x66: (cpu) => { cpu.cbBit(4, cpu.reg._HL_); cpu.m = 4 },
    0x67: (cpu) => { cpu.cbBit(4, cpu.reg.A); cpu.m = 3 },

    0x68: (cpu) => { cpu.cbBit(5, cpu.reg.B); cpu.m = 3 },
    0x69: (cpu) => { cpu.cbBit(5, cpu.reg.C); cpu.m = 3 },
    0x6A: (cpu) => { cpu.cbBit(5, cpu.reg.D); cpu.m = 3 },
    0x6B: (cpu) => { cpu.cbBit(5, cpu.reg.E); cpu.m = 3 },
    0x6C: (cpu) => { cpu.cbBit(5, cpu.reg.H); cpu.m = 3 },
    0x6D: (cpu) => { cpu.cbBit(5, cpu.reg.L); cpu.m = 3 },
    0x6E: (cpu) => { cpu.cbBit(5, cpu.reg._HL_); cpu.m = 4 },
    0x6F: (cpu) => { cpu.cbBit(5, cpu.reg.A); cpu.m = 3 },

    0x70: (cpu) => { cpu.cbBit(6, cpu.reg.B); cpu.m = 3 },
    0x71: (cpu) => { cpu.cbBit(6, cpu.reg.C); cpu.m = 3 },
    0x72: (cpu) => { cpu.cbBit(6, cpu.reg.D); cpu.m = 3 },
    0x73: (cpu) => { cpu.cbBit(6, cpu.reg.E); cpu.m = 3 },
    0x74: (cpu) => { cpu.cbBit(6, cpu.reg.H); cpu.m = 3 },
    0x75: (cpu) => { cpu.cbBit(6, cpu.reg.L); cpu.m = 3 },
    0x76: (cpu) => { cpu.cbBit(6, cpu.reg._HL_); cpu.m = 4 },
    0x77: (cpu) => { cpu.cbBit(6, cpu.reg.A); cpu.m = 3 },

    0x78: (cpu) => { cpu.cbBit(7, cpu.reg.B); cpu.m = 3 },
    0x79: (cpu) => { cpu.cbBit(7, cpu.reg.C); cpu.m = 3 },
    0x7A: (cpu) => { cpu.cbBit(7, cpu.reg.D); cpu.m = 3 },
    0x7B: (cpu) => { cpu.cbBit(7, cpu.reg.E); cpu.m = 3 },
    0x7C: (cpu) => { cpu.cbBit(7, cpu.reg.H); cpu.m = 3 },
    0x7D: (cpu) => { cpu.cbBit(7, cpu.reg.L); cpu.m = 3 },
    0x7E: (cpu) => { cpu.cbBit(7, cpu.reg._HL_); cpu.m = 4 },
    0x7F: (cpu) => { cpu.cbBit(7, cpu.reg.A); cpu.m = 3 },
}

export default cbInstructions;