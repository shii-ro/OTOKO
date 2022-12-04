import { CPU } from "./cpu.js";
import cbInstructions from "./instructionsCB.js";

const instructions = {
    0x00: (cpu) => { cpu.m = 1 }, // NOP
    0x01: (cpu) => { cpu.reg.BC = cpu.bus.next16(); cpu.m = 3 }, // LD BC, u16
    0x03: (cpu) => { cpu.reg.BC++; cpu.m = 2 }, // INC BC
    0x02: (cpu) => { cpu.reg._BC_ = cpu.reg.A; cpu.m = 2 }, // LD (BC), A
    0x04: (cpu) => { cpu.incR(B); cpu.m = 1 }, // INC B
    0x05: (cpu) => { cpu.decR(B); cpu.m = 1 }, // DEC B
    0x06: (cpu) => { cpu.reg.B = cpu.bus.next8(); cpu.m = 2 }, // LD B, u8
    0x07: (cpu) => { cpu.rlca(); cpu.m = 1; }, //RLCA
    0x08: (cpu) => {
        let target = cpu.bus.next16();
        cpu.bus.write8(target, cpu.reg.SP & 0xFF);
        cpu.bus.write8(target + 1, cpu.reg.SP >> 8);
        cpu.m = 5
    },
    0x09: (cpu) => { cpu.add16(cpu.reg.BC); cpu.m = 2 }, // ADD HL, BC
    0x0A: (cpu) => { cpu.reg.A = cpu.reg._BC_; cpu.m = 2 }, // LD A, (BC)
    0x0B: (cpu) => { cpu.reg.BC--; cpu.m = 2 }, // DEC BC
    0x0C: (cpu) => { cpu.incR(C); cpu.m = 1 }, // INC C
    0x0D: (cpu) => { cpu.decR(C); cpu.m = 1 }, // DEC C
    0x0E: (cpu) => { cpu.reg.C = cpu.bus.next8(); cpu.m = 2 }, // LD C, u8
    0x0F: (cpu) => { cpu.rrca(); cpu.m = 1; },// RRCA
    0x10: (cpu) => { cpu.m = 1 }, // STOP
    0x11: (cpu) => { cpu.reg.DE = cpu.bus.next16(); cpu.m = 3 }, // LD DE, u16
    0x12: (cpu) => { cpu.reg._DE_ = cpu.reg.A; cpu.m = 2 }, // LD (DE), A
    0x13: (cpu) => { cpu.reg.DE++; cpu.m = 2 }, // INC DE
    0x14: (cpu) => { cpu.incR(D); cpu.m = 1 }, // INC D
    0x15: (cpu) => { cpu.decR(D); cpu.m = 1 }, // DEC D
    0x16: (cpu) => { cpu.reg.D = cpu.bus.next8(); cpu.m = 2 }, // LD D, u8
    0x17: (cpu) => { cpu.rla(); cpu.m = 1 }, // RLA
    0x18: (cpu) => { cpu.jr(true) }, // JR i8
    0x19: (cpu) => { cpu.add16(cpu.reg.DE); cpu.m = 2 }, // ADD HL, DE
    0x1A: (cpu) => { cpu.reg.A = cpu.reg._DE_; cpu.m = 2 }, // LD A, (DE)
    0x1B: (cpu) => { cpu.reg.DE--; cpu.m = 2 }, // DEC DE
    0x1C: (cpu) => { cpu.incR(E); cpu.m = 1 }, // INC E
    0x1D: (cpu) => { cpu.decR(E); cpu.m = 1 }, // DEC E
    0x1E: (cpu) => { cpu.reg.E = cpu.bus.next8(); cpu.m = 2 }, // LD E, u8
    0x1F: (cpu) => { cpu.rra(); cpu.m = 1 }, // RRA
    0x20: (cpu) => { cpu.jr(!cpu.flags.zero) }, // JR NZ, i8
    0x21: (cpu) => { cpu.reg.HL = cpu.bus.next16(); cpu.m = 3 }, // LD DE, u16
    0x22: (cpu) => { cpu.reg._HL_ = cpu.reg.A; cpu.reg.HL++; cpu.m = 2 }, // LD (HL+), A
    0x23: (cpu) => { cpu.reg.HL++; cpu.m = 2 }, // INC HL
    0x24: (cpu) => { cpu.incR(H); cpu.m = 1 }, // INC H
    0x25: (cpu) => { cpu.decR(H); cpu.m = 1 }, // DEC H
    0x26: (cpu) => { cpu.reg.H = cpu.bus.next8(); cpu.m = 2 }, // LD H, u8
    0x27: (cpu) => {
        if (!cpu.flags.negative) {
            if ((cpu.flags.carry) || cpu.reg.A > 0x99) {
                cpu.reg.A = (cpu.reg.A + 0x60) & 0xFF;
                cpu.flags.carry = true;
            }
            if ((cpu.flags.halfCarry) || (cpu.reg.A & 0xF) > 0x09) {
                cpu.reg.A = (cpu.reg.A + 0x6) & 0xFF;
                cpu.flags.halfCarry = false;
            }
        } else {
            if (cpu.flags.carry) cpu.reg.A = (cpu.reg.A - 0x60) & 0xFF;
            if (cpu.flags.halfCarry) cpu.reg.A = (cpu.reg.A - 0x6) & 0xFF;
        }
        cpu.flags.zero = (cpu.reg.A === 0);
        cpu.flags.halfCarry = false;
        cpu.m = 1;
    }, // DAA
    0x28: (cpu) => { cpu.jr(cpu.flags.zero) }, // JR Z, i8
    0x29: (cpu) => { cpu.add16(cpu.reg.HL); cpu.m = 2 }, // ADD HL, HL
    0x2A: (cpu) => { cpu.reg.A = cpu.reg._HL_; cpu.reg.HL++; cpu.m = 2 }, // LD A, (HL+)
    0x2B: (cpu) => { cpu.reg.HL--; cpu.m = 2 }, // DEC HL
    0x2C: (cpu) => { cpu.incR(L); cpu.m = 1 }, // INC L
    0x2D: (cpu) => { cpu.decR(L); cpu.m = 1 }, // DEC L
    0x2E: (cpu) => { cpu.reg.L = cpu.bus.next8(); cpu.m = 2 }, // LD L, u8
    0x2F: (cpu) => { cpu.reg.A = cpu.reg.A ^ 0xFF; cpu.flags.negative = true; cpu.flags.halfCarry = true; cpu.m = 1; },// CPL
    0x30: (cpu) => { cpu.jr(!cpu.flags.carry) }, // JR NC, i8
    0x31: (cpu) => { cpu.reg.SP = cpu.bus.next16(); cpu.m = 3 }, // LD SP, u16
    0x32: (cpu) => { cpu.reg._HL_ = cpu.reg.A; cpu.reg.HL--; cpu.m = 2 }, // LD (HL-),  A
    0x33: (cpu) => { cpu.reg.SP++; cpu.m = 2 }, // INC SP
    0x34: (cpu) => { cpu.incR(_HL_); cpu.m = 3 }, // INC (HL)
    0x35: (cpu) => { cpu.decR(_HL_); cpu.m = 3 }, // DEC (HL)
    0x36: (cpu) => { cpu.reg._HL_ = cpu.bus.next8(); cpu.m = 3 },
    0x37: (cpu) => { cpu.flags.carry = true; cpu.flags.negative = false; cpu.flags.halfCarry = false; },
    0x38: (cpu) => { cpu.jr(cpu.flags.carry) }, // ADD 
    0x39: (cpu) => { cpu.add16(cpu.reg.SP); cpu.m = 2 }, // ADD HL, SP
    0x3A: (cpu) => { cpu.reg.A = cpu.reg._HL_; cpu.reg.HL--; cpu.m = 2 }, // LD A, (HL-)
    0x3B: (cpu) => { cpu.reg.SP--; cpu.m = 2 }, // DEC SP
    0x3C: (cpu) => { cpu.incR(A); cpu.m = 1 }, // INC A
    0x3D: (cpu) => { cpu.decR(A); cpu.m = 1 }, // DEC A
    0x3E: (cpu) => { cpu.reg.A = cpu.bus.next8(); cpu.m = 2 },
    0x3F: (cpu) => { cpu.flags.carry = !cpu.flags.carry; cpu.flags.negative = false; cpu.flags.halfCarry = false; cpu.m = 1 }, // SCF
    0x40: (cpu) => { cpu.reg.B = cpu.reg.B; cpu.m = 1 },
    0x41: (cpu) => { cpu.reg.B = cpu.reg.C; cpu.m = 1 },
    0x42: (cpu) => { cpu.reg.B = cpu.reg.D; cpu.m = 1 },
    0x43: (cpu) => { cpu.reg.B = cpu.reg.E; cpu.m = 1 },
    0x44: (cpu) => { cpu.reg.B = cpu.reg.H; cpu.m = 1 },
    0x45: (cpu) => { cpu.reg.B = cpu.reg.L; cpu.m = 1 },
    0x46: (cpu) => { cpu.reg.B = cpu.reg._HL_; cpu.m = 2 },
    0x47: (cpu) => { cpu.reg.B = cpu.reg.A; cpu.m = 1 },
    0x48: (cpu) => { cpu.reg.C = cpu.reg.B; cpu.m = 1 },
    0x49: (cpu) => { cpu.reg.C = cpu.reg.C; cpu.m = 1 },
    0x4A: (cpu) => { cpu.reg.C = cpu.reg.D; cpu.m = 1 },
    0x4B: (cpu) => { cpu.reg.C = cpu.reg.E; cpu.m = 1 },
    0x4C: (cpu) => { cpu.reg.C = cpu.reg.H; cpu.m = 1 },
    0x4D: (cpu) => { cpu.reg.C = cpu.reg.L; cpu.m = 1 },
    0x4E: (cpu) => { cpu.reg.C = cpu.reg._HL_; cpu.m = 2 },
    0x4F: (cpu) => { cpu.reg.C = cpu.reg.A; cpu.m = 1 },
    0x50: (cpu) => { cpu.reg.D = cpu.reg.B; cpu.m = 1 },
    0x51: (cpu) => { cpu.reg.D = cpu.reg.C; cpu.m = 1 },
    0x52: (cpu) => { cpu.reg.D = cpu.reg.D; cpu.m = 1 },
    0x53: (cpu) => { cpu.reg.D = cpu.reg.E; cpu.m = 1 },
    0x54: (cpu) => { cpu.reg.D = cpu.reg.H; cpu.m = 1 },
    0x55: (cpu) => { cpu.reg.D = cpu.reg.L; cpu.m = 1 },
    0x56: (cpu) => { cpu.reg.D = cpu.reg._HL_; cpu.m = 2 },
    0x57: (cpu) => { cpu.reg.D = cpu.reg.A; cpu.m = 1 },
    0x58: (cpu) => { cpu.reg.E = cpu.reg.B; cpu.m = 1 },
    0x59: (cpu) => { cpu.reg.E = cpu.reg.C; cpu.m = 1 },
    0x5A: (cpu) => { cpu.reg.E = cpu.reg.D; cpu.m = 1 },
    0x5B: (cpu) => { cpu.reg.E = cpu.reg.E; cpu.m = 1 },
    0x5C: (cpu) => { cpu.reg.E = cpu.reg.H; cpu.m = 1 },
    0x5D: (cpu) => { cpu.reg.E = cpu.reg.L; cpu.m = 1 },
    0x5E: (cpu) => { cpu.reg.E = cpu.reg._HL_; cpu.m = 2 },
    0x5F: (cpu) => { cpu.reg.E = cpu.reg.A; cpu.m = 1 },
    0x60: (cpu) => { cpu.reg.H = cpu.reg.B; cpu.m = 1 },
    0x61: (cpu) => { cpu.reg.H = cpu.reg.C; cpu.m = 1 },
    0x62: (cpu) => { cpu.reg.H = cpu.reg.D; cpu.m = 1 },
    0x63: (cpu) => { cpu.reg.H = cpu.reg.E; cpu.m = 1 },
    0x64: (cpu) => { cpu.reg.H = cpu.reg.H; cpu.m = 1 },
    0x65: (cpu) => { cpu.reg.H = cpu.reg.L; cpu.m = 1 },
    0x66: (cpu) => { cpu.reg.H = cpu.reg._HL_; cpu.m = 2 },
    0x67: (cpu) => { cpu.reg.H = cpu.reg.A; cpu.m = 1 },
    0x68: (cpu) => { cpu.reg.L = cpu.reg.B; cpu.m = 1 },
    0x69: (cpu) => { cpu.reg.L = cpu.reg.C; cpu.m = 1 },
    0x6A: (cpu) => { cpu.reg.L = cpu.reg.D; cpu.m = 1 },
    0x6B: (cpu) => { cpu.reg.L = cpu.reg.E; cpu.m = 1 },
    0x6C: (cpu) => { cpu.reg.L = cpu.reg.H; cpu.m = 1 },
    0x6D: (cpu) => { cpu.reg.L = cpu.reg.L; cpu.m = 1 },
    0x6E: (cpu) => { cpu.reg.L = cpu.reg._HL_; cpu.m = 2 },
    0x6F: (cpu) => { cpu.reg.L = cpu.reg.A; cpu.m = 1 },
    0x70: (cpu) => { cpu.reg._HL_ = cpu.reg.B; cpu.m = 1 },
    0x71: (cpu) => { cpu.reg._HL_ = cpu.reg.C; cpu.m = 1 },
    0x72: (cpu) => { cpu.reg._HL_ = cpu.reg.D; cpu.m = 1 },
    0x73: (cpu) => { cpu.reg._HL_ = cpu.reg.E; cpu.m = 1 },
    0x74: (cpu) => { cpu.reg._HL_ = cpu.reg.H; cpu.m = 1 },
    0x75: (cpu) => { cpu.reg._HL_ = cpu.reg.L; cpu.m = 1 },
    0x76: (cpu) => { cpu.m = 1 }, // HALT
    0x77: (cpu) => { cpu.reg._HL_ = cpu.reg.A; cpu.m = 1 },
    0x78: (cpu) => { cpu.reg.A = cpu.reg.B; cpu.m = 1 },
    0x79: (cpu) => { cpu.reg.A = cpu.reg.C; cpu.m = 1 },
    0x7A: (cpu) => { cpu.reg.A = cpu.reg.D; cpu.m = 1 },
    0x7B: (cpu) => { cpu.reg.A = cpu.reg.E; cpu.m = 1 },
    0x7C: (cpu) => { cpu.reg.A = cpu.reg.H; cpu.m = 1 },
    0x7D: (cpu) => { cpu.reg.A = cpu.reg.L; cpu.m = 1 },
    0x7E: (cpu) => { cpu.reg.A = cpu.reg._HL_; cpu.m = 2 },
    0x7F: (cpu) => { cpu.reg.A = cpu.reg.A; cpu.m = 1 },
    0x80: (cpu) => { cpu.add(cpu.reg.B); cpu.m = 1 },
    0x81: (cpu) => { cpu.add(cpu.reg.C); cpu.m = 1 },
    0x82: (cpu) => { cpu.add(cpu.reg.D); cpu.m = 1 },
    0x83: (cpu) => { cpu.add(cpu.reg.E); cpu.m = 1 },
    0x84: (cpu) => { cpu.add(cpu.reg.H); cpu.m = 1 },
    0x85: (cpu) => { cpu.add(cpu.reg.L); cpu.m = 1 },
    0x86: (cpu) => { cpu.add(cpu.reg._HL_); cpu.m = 2 },
    0x87: (cpu) => { cpu.add(cpu.reg.A); cpu.m = 1 },
    0x88: (cpu) => { cpu.adc(cpu.reg.B); cpu.m = 1 },
    0x89: (cpu) => { cpu.adc(cpu.reg.C); cpu.m = 1 },
    0x8A: (cpu) => { cpu.adc(cpu.reg.D); cpu.m = 1 },
    0x8B: (cpu) => { cpu.adc(cpu.reg.E); cpu.m = 1 },
    0x8C: (cpu) => { cpu.adc(cpu.reg.H); cpu.m = 1 },
    0x8D: (cpu) => { cpu.adc(cpu.reg.L); cpu.m = 1 },
    0x8E: (cpu) => { cpu.adc(cpu.reg._HL_); cpu.m = 2 },
    0x8F: (cpu) => { cpu.adc(cpu.reg.A); cpu.m = 1 },
    0x90: (cpu) => { cpu.sub(cpu.reg.B); cpu.m = 1 },
    0x91: (cpu) => { cpu.sub(cpu.reg.C); cpu.m = 1 },
    0x92: (cpu) => { cpu.sub(cpu.reg.D); cpu.m = 1 },
    0x93: (cpu) => { cpu.sub(cpu.reg.E); cpu.m = 1 },
    0x94: (cpu) => { cpu.sub(cpu.reg.H); cpu.m = 1 },
    0x95: (cpu) => { cpu.sub(cpu.reg.L); cpu.m = 1 },
    0x96: (cpu) => { cpu.sub(cpu.reg._HL_); cpu.m = 2 },
    0x97: (cpu) => { cpu.sub(cpu.reg.A); cpu.m = 1 },
    0x98: (cpu) => { cpu.sbc(cpu.reg.B); cpu.m = 1 },
    0x99: (cpu) => { cpu.sbc(cpu.reg.C); cpu.m = 1 },
    0x9A: (cpu) => { cpu.sbc(cpu.reg.D); cpu.m = 1 },
    0x9B: (cpu) => { cpu.sbc(cpu.reg.E); cpu.m = 1 },
    0x9C: (cpu) => { cpu.sbc(cpu.reg.H); cpu.m = 1 },
    0x9D: (cpu) => { cpu.sbc(cpu.reg.L); cpu.m = 1 },
    0x9E: (cpu) => { cpu.sbc(cpu.reg._HL_); cpu.m = 1 },
    0x9F: (cpu) => { cpu.sbc(cpu.reg.A); cpu.m = 1 },
    0xA0: (cpu) => { cpu.and(cpu.reg.B); cpu.m = 1 },
    0xA1: (cpu) => { cpu.and(cpu.reg.C); cpu.m = 1 },
    0xA2: (cpu) => { cpu.and(cpu.reg.D); cpu.m = 1 },
    0xA3: (cpu) => { cpu.and(cpu.reg.E); cpu.m = 1 },
    0xA4: (cpu) => { cpu.and(cpu.reg.H); cpu.m = 1 },
    0xA5: (cpu) => { cpu.and(cpu.reg.L); cpu.m = 1 },
    0xA6: (cpu) => { cpu.and(cpu.reg._HL_); cpu.m = 2 },
    0xA7: (cpu) => { cpu.and(cpu.reg.A); cpu.m = 1 },
    0xA8: (cpu) => { cpu.xor(cpu.reg.B); cpu.m = 1 },
    0xA9: (cpu) => { cpu.xor(cpu.reg.C); cpu.m = 1 },
    0xAA: (cpu) => { cpu.xor(cpu.reg.D); cpu.m = 1 },
    0xAB: (cpu) => { cpu.xor(cpu.reg.E); cpu.m = 1 },
    0xAC: (cpu) => { cpu.xor(cpu.reg.H); cpu.m = 1 },
    0xAD: (cpu) => { cpu.xor(cpu.reg.L); cpu.m = 1 },
    0xAE: (cpu) => { cpu.xor(cpu.reg._HL_); cpu.m = 2 },
    0xAF: (cpu) => { cpu.xor(cpu.reg.A); cpu.m = 1 },
    0xB0: (cpu) => { cpu.or(cpu.reg.B); cpu.m = 1 },
    0xB1: (cpu) => { cpu.or(cpu.reg.C); cpu.m = 1 },
    0xB2: (cpu) => { cpu.or(cpu.reg.D); cpu.m = 1 },
    0xB3: (cpu) => { cpu.or(cpu.reg.E); cpu.m = 1 },
    0xB4: (cpu) => { cpu.or(cpu.reg.H); cpu.m = 1 },
    0xB5: (cpu) => { cpu.or(cpu.reg.L); cpu.m = 1 },
    0xB6: (cpu) => { cpu.or(cpu.reg._HL_); cpu.m = 2 },
    0xB7: (cpu) => { cpu.or(cpu.reg.A); cpu.m = 1 },
    0xB8: (cpu) => { cpu.cp(cpu.reg.B); cpu.m = 1 },
    0xB9: (cpu) => { cpu.cp(cpu.reg.C); cpu.m = 1 },
    0xBA: (cpu) => { cpu.cp(cpu.reg.D); cpu.m = 1 },
    0xBB: (cpu) => { cpu.cp(cpu.reg.E); cpu.m = 1 },
    0xBC: (cpu) => { cpu.cp(cpu.reg.H); cpu.m = 1 },
    0xBD: (cpu) => { cpu.cp(cpu.reg.L); cpu.m = 1 },
    0xBE: (cpu) => { cpu.cp(cpu.reg._HL_); cpu.m = 2 },
    0xBF: (cpu) => { cpu.cp(cpu.reg.A); cpu.m = 1 },
    0xC0: (cpu) => { cpu.retCond(!cpu.flags.zero) }, // RET NZ
    0xC1: (cpu) => { cpu.reg.BC = cpu.pop16(); cpu.m = 3 }, // POP BC
    0xC2: (cpu) => { cpu.jp(!cpu.flags.zero) }, // JP NZ, u16
    0xC3: (cpu) => { cpu.reg.PC = cpu.bus.next16(), cpu.m = 3 }, // JMP u16
    0xC4: (cpu) => { cpu.call(!cpu.flags.zero) }, // CALL NZ, u16
    0xC5: (cpu) => { cpu.push16(cpu.reg.BC); cpu.m = 4 }, // PUSH BC
    0xC6: (cpu) => { cpu.add(cpu.bus.next8()); cpu.m = 2 }, //  ADD A ,u8
    0xC7: (cpu) => { cpu.push16(cpu.reg.PC); cpu.reg.PC = 0x0000; cpu.m = 4; }, // RST 00
    0xC8: (cpu) => { cpu.retCond(cpu.flags.zero) }, // RET Z
    0xC9: (cpu) => { cpu.reg.PC = cpu.pop16(); cpu.m = 4; }, // RET
    0xCA: (cpu) => { cpu.jp(cpu.flags.zero) }, // JP Z, u16
    0xCC: (cpu) => { cpu.call(cpu.flags.zero) }, // CALL Z
    0xCD: (cpu) => { cpu.call(true) }, // CALL u16
    0xCE: (cpu) => { cpu.adc(cpu.bus.next8()); cpu.m = 2 }, // ADC, u8
    0xCF: (cpu) => { cpu.push16(cpu.reg.PC); cpu.reg.PC = 0x0008; cpu.m = 4; }, // RST 08
    0xD0: (cpu) => { cpu.retCond(!cpu.flags.carry) }, // RET NC
    0xD1: (cpu) => { cpu.reg.DE = cpu.pop16(); cpu.m = 3 }, // POP DE
    0XD2: (cpu) => { cpu.jp(!cpu.flags.carry) }, // JP NC, u16
    0xD4: (cpu) => { cpu.call(!cpu.flags.carry) }, // CALL NC, u16
    0xD5: (cpu) => { cpu.push16(cpu.reg.DE); cpu.m = 4 }, // PUSH DE
    0xD6: (cpu) => { cpu.sub(cpu.bus.next8()); cpu.m = 2 }, // SUB, u8
    0xD7: (cpu) => { cpu.push16(cpu.reg.PC); cpu.reg.PC = 0x0010; cpu.m = 4; }, // RST 10
    0xD8: (cpu) => { cpu.retCond(cpu.flags.carry) }, // RET C
    0xD9: (cpu) => { cpu.reg.PC = cpu.pop16(); cpu.m = 4; cpu.ime = true; }, // RETI (enable flags later)
    0xDA: (cpu) => { cpu.jp(cpu.flags.carry) }, // JP C
    0xDE: (cpu) => { cpu.sbc(cpu.bus.next8()); cpu.m = 2; }, // SBC A
    0xDC: (cpu) => { cpu.call(cpu.flags.carry) }, // CALL C, u16
    0xDF: (cpu) => { cpu.push16(cpu.reg.PC); cpu.reg.PC = 0x0018; cpu.m = 4; }, // RST 18
    0xE0: (cpu) => { cpu.bus.write8(0xFF00 + cpu.bus.next8(), cpu.reg.A); cpu.m = 3 }, // LD (FF00 + u8), A
    0xE1: (cpu) => { cpu.reg.HL = cpu.pop16(); cpu.m = 3 }, // POP HL
    0xE2: (cpu) => { cpu.bus.write8(0xFF00 + cpu.reg.C, cpu.reg.A); cpu.m = 2 }, // LD (C), A
    0xE5: (cpu) => { cpu.push16(cpu.reg.HL); cpu.m = 4 }, // PUSH HL
    0xE6: (cpu) => { cpu.and(cpu.bus.next8()); cpu.m = 2 }, // AND, u8
    0xE7: (cpu) => { cpu.push16(cpu.reg.PC); cpu.reg.PC = 0x0020; cpu.m = 4; }, // RST 20
    0xE8: (cpu) => {
        let s8 = cpu.bus.next8() << 24 >> 24;
        let tmp0 = (cpu.reg.SP + s8);
        let tmp1 = cpu.reg.SP ^ s8 ^ tmp0;
        cpu.flags.zero = false;
        cpu.flags.negative = false;
        cpu.flags.halfCarry = ((tmp1 & 0x10) === 0x10);
        cpu.flags.carry = ((tmp1 & 0x100) === 0x100);
        cpu.reg.SP = tmp0 & 0xFFFF;
        cpu.m = 4;
    },
    0xE9: (cpu) => { cpu.reg.PC = cpu.reg.HL; cpu.m = 1 }, // JP HL
    0xEA: (cpu) => { cpu.bus.write8(cpu.bus.next16(), cpu.reg.A); cpu.m = 4 }, // LD (u16), A
    0xEE: (cpu) => { cpu.xor(cpu.bus.next8()); cpu.m = 2 }, // XOR A, U8
    0xEF: (cpu) => { cpu.push16(cpu.reg.PC); cpu.reg.PC = 0x0028; cpu.m = 4; }, // RST 28
    0xF0: (cpu) => { cpu.reg.A = cpu.bus.read8(0xFF00 + cpu.bus.next8()); cpu.m = 3 },
    0xF1: (cpu) => { cpu.reg.AF = cpu.pop16(); cpu.m = 3 }, // POP AF
    0xF2: (cpu) => { cpu.reg.A = cpu.bus.read8(0xFF00 + cpu.reg.C); cpu.m = 2; }, // LD A (0xFF00 + C)
    0xF3: (cpu) => { cpu.ime = false; cpu.m = 1 }, // DI
    0xF5: (cpu) => { cpu.push16(cpu.reg.AF); cpu.m = 4 }, // PUSH AF
    0xF6: (cpu) => { cpu.or(cpu.bus.next8()); cpu.m = 2 }, // OR, u8
    0xF7: (cpu) => { cpu.push16(cpu.reg.PC); cpu.reg.PC = 0x0030; cpu.m = 4; }, // RST 30
    0xF8: (cpu) => {
        let s8 = cpu.bus.next8() << 24 >> 24;
        let tmp0 = (cpu.reg.SP + s8);
        let tmp1 = cpu.reg.SP ^ s8 ^ tmp0;
        cpu.reg.HL = tmp0 & 0xFFFF;
        cpu.flags.zero = false;
        cpu.flags.negative = false;
        cpu.flags.halfCarry = ((tmp1 & 0x10) === 0x10);
        cpu.flags.carry = ((tmp1 & 0x100) === 0x100);
        cpu.m = 3;
    },
    0xF9: (cpu) => { cpu.reg.SP = cpu.reg.HL; cpu.m = 2 }, // LD SP, HL
    0xFA: (cpu) => { cpu.reg.A = cpu.bus.read8(cpu.bus.next16()); cpu.m = 4 },
    0xFB: (cpu) => { cpu.ime = true; cpu.m = 1 }, // EI
    0xFE: (cpu) => { cpu.cp(cpu.bus.next8()); cpu.m = 2 }, // CP A, u8
    0xFF: (cpu) => { cpu.push16(cpu.reg.PC); cpu.reg.PC = 0x0038; cpu.m = 4; }, // RST 38
    0xCB: (cpu) => {
        cpu.OC = cpu.bus.next8();
        let cbInst = cbInstructions[cpu.OC];
        if (cbInst === undefined)
            console.log("CB Instruction not implemented: " + cpu.OC.toString(16))
        cbInst(cpu);
    },
};

export default instructions;
