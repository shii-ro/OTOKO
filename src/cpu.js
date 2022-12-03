import instructions from "./instructions.js";
import updateDebug from "./script.js";

class CPU {
    constructor() {
        this.m = 0; // M Cycles;
        this.OC = 0x00;
        this.debug = false;
        this.totalCycles = 0;
        this.ime = false;
    };

    init(mmu, bus, io) {
        this.mmu = mmu;
        this.bus = bus;
        this.io = io.register;
        this.reg.bus = bus; // really ?
    }

    reg = {
        A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, H: 0, L: 0, SP: 0, PC: 0,

        get AF() { return this.A << 8 | this.F & 0xF0 }, set AF(u16) { [this.F, this.A] = [(u16 & 0xF0), (u16 >> 8)] },
        get BC() { return this.B << 8 | this.C }, set BC(u16) { [this.C, this.B] = [(u16 & 0xFF), (u16 >> 8)] },
        get DE() { return this.D << 8 | this.E }, set DE(u16) { [this.E, this.D] = [(u16 & 0xFF), (u16 >> 8)] },
        get HL() { return this.H << 8 | this.L }, set HL(u16) { [this.L, this.H] = [(u16 & 0xFF), (u16 >> 8)] },

        get _AF_() { return this.bus.read8(this.AF) }, set _AF_(u8) { this.bus.write8(this.AF, u8) },
        get _BC_() { return this.bus.read8(this.BC) }, set _BC_(u8) { this.bus.write8(this.BC, u8) },
        get _DE_() { return this.bus.read8(this.DE) }, set _DE_(u8) { this.bus.write8(this.DE, u8) },
        get _HL_() { return this.bus.read8(this.HL); }, set _HL_(u8) { this.bus.write8(this.HL, u8) },
    };

    decR = (register) => {
        let tmp = this.reg[register] - 1;
        this.setFlag(ZERO, (tmp & 0xFF) === 0);
        this.setFlag(NEGATIVE, true);
        this.setFlag(HALF_CARRY, (tmp & 0xF) === 0xF);
        this.reg[register] = tmp & 0xFF;
    }

    incR(register) { // Z0H
        let tmp = this.reg[register] + 1;
        this.setFlag(ZERO, (tmp & 0xFF) === 0);
        this.setFlag(NEGATIVE, false);
        this.setFlag(HALF_CARRY, (tmp & 0xF) === 0);
        this.reg[register] = tmp & 0xFF;
    }
    
    setFlag(bit, condition) {
        this.reg.F = (this.reg.F & ~(bit)) | (condition * bit);
    };

    getFlag(bit) {
        return ((this.reg.F & bit) === bit);
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

    tick() {
        this.OC = this.bus.next8();

        if (instructions[this.OC] === undefined) {
            console.log(`PC: ${this.reg.PC.toString(16)} OC: ${this.OC.toString(16)} AF: ${this.reg.AF.toString(16)} BC: ${this.reg.BC.toString(16)} DE: ${this.reg.DE.toString(16)} HL: ${this.reg.HL.toString(16)} SP:  ${this.reg.SP.toString(16)}`);
            console.log("Unimplemented instruction: ", this.OC.toString(16));
            updateDebug();
        };
        instructions[this.OC](this);
        this.intrHandle();
    }

    intrRequest(bit) {
        this.io[0x0F] |= (1 << bit);
    }

    intrHandle() {
        if (this.ime) {
            for (let mask = 1, bit = 0; mask < 0x20; mask <<= 1, bit++) {
                if (this.mmu.hram[0x7F] & mask && this.io[0x0F] & mask) {
                    this.push16(this.reg.PC);
                    this.reg.PC = 0x40 + (bit * 0x8);

                    this.io[0x0F] &= ~(mask);
                    this.ime = false;
                    return;
                }
            }
        }
    }
};
// instructions

CPU.prototype.jr = function (condition) {
    let offset = this.bus.next8();
    if (condition) {
        this.reg.PC = (this.reg.PC + (offset << 24 >> 24)) & 0xFFFF;
        this.m = 3;
    } else this.m = 2;
}

CPU.prototype.jp = function (condition) {
    let newPC = this.bus.next16();
    if (condition) {
        this.reg.PC = newPC;
        this.m = 4;
    }
    else this.m = 3;
}

CPU.prototype.call = function (condition) {
    let newPC = this.bus.next16();
    if (condition) {
        this.push16(this.reg.PC);
        this.reg.PC = newPC;
        this.m = 6;
    } else this.m = 3;
}


CPU.prototype.retCond = function (condition) {
    if (condition) {
        this.reg.PC = this.pop16();
        this.m = 5;
    }
    else this.m = 2
}

CPU.prototype.add = function (u8) { // Z0HC
    let tmp = this.reg.A + u8;
    this.setFlag(ZERO, ((tmp & 0xFF) === 0));
    this.setFlag(NEGATIVE, false);
    this.setFlag(HALF_CARRY, (this.reg.A & 0xF) + (u8 & 0xF) > 0xF);
    this.setFlag(CARRY, tmp > 0xFF);
    this.reg.A = tmp & 0xFF;
}

CPU.prototype.add16 = function (u16) { // 0HC
    let tmp = this.reg.HL + u16;
    this.setFlag(NEGATIVE, false);
    this.setFlag(HALF_CARRY, ((this.reg.HL & 0xfff) + (u16 & 0xfff)) > 0xfff);
    this.setFlag(CARRY, tmp > 0xFFFF);
    this.reg.HL = tmp & 0xFFFF;
}

CPU.prototype.adc = function (u8) { // Z0HC
    let tmp = this.reg.A + u8 + this.getFlag(CARRY);
    this.setFlag(ZERO, ((tmp & 0xFF) === 0));
    this.setFlag(NEGATIVE, false);
    this.setFlag(HALF_CARRY, (this.reg.A & 0xF) + (u8 & 0xF) + this.getFlag(CARRY) > 0xF);
    this.setFlag(CARRY, tmp > 0xFF);
    this.reg.A = tmp & 0xFF;
}

CPU.prototype.and = function (u8) { // Z010
    let tmp = this.reg.A & u8;
    this.setFlag(ZERO, tmp === 0x00);
    this.setFlag(NEGATIVE, false);
    this.setFlag(HALF_CARRY, true);
    this.setFlag(CARRY, false);
    this.reg.A = tmp & 0xFF;
}

CPU.prototype.xor = function (u8) { // Z000
    this.reg.A = (this.reg.A ^ u8) & 0xFF;
    this.reg.F = (this.reg.A === 0) ? 0x80 : 0x00;
}

CPU.prototype.or = function (u8) { // Z000
    this.reg.A = (this.reg.A | u8) & 0xFF;
    this.reg.F = (this.reg.A === 0) ? 0x80 : 0x00;
}

CPU.prototype.sub = function (u8) { // Z1HC
    let tmp = this.reg.A - u8;
    this.setFlag(ZERO, (tmp & 0xFF) === 0);
    this.setFlag(NEGATIVE, true);
    this.setFlag(HALF_CARRY, (((this.reg.A & 0xf) - (u8 & 0xf)) & 0x10) == 0x10);
    this.setFlag(CARRY, u8 > this.reg.A); // check this line later
    this.reg.A = tmp & 0xFF;
}

CPU.prototype.sbc = function (u8) { // Z1HC
    let tmp = this.reg.A - u8 - this.getFlag(CARRY);
    this.setFlag(ZERO, (tmp & 0xFF) === 0);
    this.setFlag(NEGATIVE, true);
    this.setFlag(HALF_CARRY, ((this.reg.A & 0xf) - (u8 & 0xf) - this.getFlag(CARRY)) < 0);
    this.setFlag(CARRY, (u8 + this.getFlag(CARRY)) > this.reg.A); // check this line later
    this.reg.A = tmp & 0xFF;
}



CPU.prototype.cp = function (u8) { // Z1HC
    let tmp = this.reg.A - u8;
    this.setFlag(ZERO, (tmp & 0xFF) === 0);
    this.setFlag(NEGATIVE, true);
    this.setFlag(HALF_CARRY, (((this.reg.A & 0xf) - (u8 & 0xf)) & 0x10) === 0x10);
    this.setFlag(CARRY, u8 > this.reg.A); // check this line later
}

CPU.prototype.rla = function (u8) { // 000C
    let carry = (this.reg.A >> 7) & 0x1;
    this.reg.A = (this.reg.A << 1 | this.getFlag(CARRY)) & 0xFF;

    this.setFlag(ZERO, false);
    this.setFlag(HALF_CARRY, false);
    this.setFlag(NEGATIVE, false);
    this.setFlag(CARRY, carry);
}

CPU.prototype.rlca = function (u8) { // 000C
    let carry = (this.reg.A >> 7) & 0x1;
    this.reg.A = (this.reg.A << 1 | carry) & 0xFF;

    this.setFlag(ZERO, false);
    this.setFlag(HALF_CARRY, false);
    this.setFlag(NEGATIVE, false);
    this.setFlag(CARRY, carry);
}

CPU.prototype.rrca = function (u8) { // 000C
    let carry = this.reg.A & 0x1;
    this.reg.A = ((this.reg.A >> 1 | carry * 0x80)) & 0xFF;

    this.setFlag(ZERO, false);
    this.setFlag(HALF_CARRY, false);
    this.setFlag(NEGATIVE, false);
    this.setFlag(CARRY, carry);
}

CPU.prototype.rra = function (u8) { // 000C
    let carry = this.reg.A & 0x1;
    this.reg.A = ((this.reg.A >> 1 | (this.getFlag(CARRY)) * 0x80)) & 0xFF;

    this.setFlag(ZERO, false);
    this.setFlag(HALF_CARRY, false);
    this.setFlag(NEGATIVE, false);
    this.setFlag(CARRY, carry);
}

// CB instructions
CPU.prototype.cbBit = function (bitPos, u8) {
    let bit = (u8 >> bitPos) & 0x1;
    this.setFlag(ZERO, !bit);
    this.setFlag(NEGATIVE, false);
    this.setFlag(HALF_CARRY, true);
}

CPU.prototype.cbRr = function (register) {
    let carry = this.reg[register] & 0x1;
    this.reg[register] = ((this.reg[register] >> 1 | (this.getFlag(CARRY)) << 7)) & 0xFF;

    this.setFlag(ZERO, this.reg[register] === 0x00);
    this.setFlag(HALF_CARRY, false);
    this.setFlag(NEGATIVE, false);
    this.setFlag(CARRY, carry);
}

CPU.prototype.cbRrc = function (register) {
    let carry = this.reg[register] & 0x1;
    this.reg[register] = ((this.reg[register] >> 1 | carry << 7)) & 0xFF;

    this.setFlag(ZERO, this.reg[register] === 0x00);
    this.setFlag(HALF_CARRY, false);
    this.setFlag(NEGATIVE, false);
    this.setFlag(CARRY, carry);
}

CPU.prototype.cbRlc = function (register) {
    let carry = (this.reg[register] >> 7) & 0x1;
    this.reg[register] = (this.reg[register] << 1 | carry) & 0xFF;

    this.setFlag(ZERO, this.reg[register] === 0x00);
    this.setFlag(HALF_CARRY, false);
    this.setFlag(NEGATIVE, false);
    this.setFlag(CARRY, carry);
}

CPU.prototype.cbRl = function (register) {
    let carry = (this.reg[register] >> 7) & 0x1;
    this.reg[register] = (this.reg[register] << 1 | this.getFlag(CARRY)) & 0xFF;

    this.setFlag(ZERO, this.reg[register] === 0x00);
    this.setFlag(HALF_CARRY, false);
    this.setFlag(NEGATIVE, false);
    this.setFlag(CARRY, carry);
}

CPU.prototype.cbSla = function (register) {
    let carry = (this.reg[register] >> 7) & 0x1;
    this.reg[register] = (this.reg[register] << 1) & 0xFF;

    this.setFlag(ZERO, this.reg[register] === 0x00);
    this.setFlag(HALF_CARRY, false);
    this.setFlag(NEGATIVE, false);
    this.setFlag(CARRY, carry);
}

CPU.prototype.cbSra = function (register) {
    let carry = this.reg[register] & 0x1;
    let b7 = this.reg[register] & 0x80;
    this.reg[register] = ((this.reg[register] >> 1) | b7) & 0xFF;

    this.setFlag(ZERO, this.reg[register] === 0x00);
    this.setFlag(HALF_CARRY, false);
    this.setFlag(NEGATIVE, false);
    this.setFlag(CARRY, carry);
}


CPU.prototype.cbSrl = function (register) {
    let tmp = this.reg[register] >> 1;

    this.setFlag(ZERO, (tmp & 0xFF) === 0x00);
    this.setFlag(HALF_CARRY, false);
    this.setFlag(NEGATIVE, false);
    this.setFlag(CARRY, this.reg[register] & 0x1);
    this.reg[register] = tmp & 0xFF;
}

CPU.prototype.cbSwap = function (register) {
    this.reg[register] = (this.reg[register] & 0xF0) >> 4 | (this.reg[register] & 0x0F) << 4;
    this.reg.F = (this.reg[register] === 0) ? 0x80 : 0x00
}

CPU.prototype.cbSet = function (bit, register) {
    this.reg[register] |= (1 << bit);
}

CPU.prototype.cbRes = function (bit, register) {
    this.reg[register] &= ~(1 << bit);
}

export { CPU };