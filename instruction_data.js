const instrCb_data = {
    0x7C: (cpu, data) => `BIT 7, H`,
}

const instr_data = {
    0x00: (cpu, data) => `NOP`,
    0x01: (cpu, data) => `LD (BC), ${data.A}`,
    0x01: (cpu, data) => `LD BC, ${cpu.bus.read16().toString(16)}`,
    0x11: (cpu, data) => `LD DE, ${cpu.bus.read16().toString(16)}`,
    0x21: (cpu, data) => `LD HL, ${cpu.bus.read16().toString(16)}`,
    0x31: (cpu, data) => `LD SP, ${cpu.bus.read16().toString(16)}`,
    0x32: (cpu, data) => `LD (BC), A`,
    0x32: (cpu, data) => `LD (DE), A`,
    0x32: (cpu, data) => `LD (HL+), A`,
    0x32: (cpu, data) => `LD (HL-), A`,
    0x30: (cpu, data) => `INC BC`,
    0xAF: (cpu, data) => `XOR A`,
    0xCB: (cpu, data) => " ",
}
export default instr_data;