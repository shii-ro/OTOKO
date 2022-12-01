// import CPU from './cpu.js';
import { CPU } from "./cpu.js";
import { IO } from "./io.js";
import { MMU } from "./mmu.js";
import { PPU } from "./ppu.js";
import { Bus } from "./bus.js";
import instr_data from "./instruction_data.js";

const cpu = new CPU();
const io = new IO();
const mmu = new MMU();
const ppu = new PPU();
const bus = new Bus();

bus.init(cpu, mmu, ppu);
cpu.init(mmu, bus);
io.init(mmu, cpu, ppu);
mmu.init(io);
ppu.init(io);

function updateDebug() {

    const debug = {
        'PC': cpu.reg.PC.toString(16).toUpperCase(),
        'AF': cpu.reg.AF.toString(16).toUpperCase(),
        'BC': cpu.reg.BC.toString(16).toUpperCase(),
        'DE': cpu.reg.DE.toString(16).toUpperCase(),
        'HL': cpu.reg.HL.toString(16).toUpperCase(),
        'SP': cpu.reg.SP.toString(16).toUpperCase(),
        'OC': cpu.OC.toString(16).toUpperCase()
    }

    for (const prop in debug) { 
        document.getElementById(prop).innerHTML = `${prop}: ${debug[prop]}`;
    }

    document.getElementById("zero").checked = (cpu.reg.F & 0x80) === 0x80;
    document.getElementById("negative").checked = (cpu.reg.F & 0x40) === 0x40;
    document.getElementById("halfcarry").checked = (cpu.reg.F & 0x20) === 0x20;
    document.getElementById("carry").checked = (cpu.reg.F & 0x10) === 0x10;

    // console.log(debug.OC)

    const newLine = `
                     PC: ${debug.PC}&emsp;
                     OC: ${debug.OC}&emsp;
                     &ensp;AF: ${debug.AF}\t
                     BC: ${debug.BC}\t
                     DE: ${debug.DE}\t
                     HL: ${debug.HL}\t
                     SP: ${debug.SP}
                     `;

                    //  const newLine = `
                    //  PC: ${debug.PC}&emsp;
                    //  OC: ${debug.OC}&emsp;
                    //  ${instr_data[cpu.OC](cpu, debug)}
                    //  &ensp;AF: ${debug.AF}\t
                    //  BC: ${debug.BC}\t
                    //  DE: ${debug.DE}\t
                    //  HL: ${debug.HL}\t
                    //  SP: ${debug.SP}
                    //  `;
    document.getElementById("instructions").innerHTML += (newLine + '<br>');
};

function tick() {
    cpu.tick();
    updateDebug();
    console.log(`PC: ${cpu.reg.PC.toString(16)} OC: ${cpu.OC.toString(16)} AF: ${cpu.reg.AF.toString(16)} BC: ${cpu.reg.BC.toString(16)} DE: ${cpu.reg.DE.toString(16)} HL: ${cpu.reg.HL.toString(16)} SP:  ${cpu.reg.SP.toString(16)}`);
}

let running = true;
let debug = false; 

function runFrame() {
    const MAX_CYCLES = 69905;
    let cyclesThisTick = 0;

    while (cyclesThisTick < MAX_CYCLES) {

        if (cpu.debug) {
            // updateDebug();
            console.log(`PC: ${cpu.reg.PC.toString(16)} OC: ${cpu.bus.read8(cpu.reg.PC).toString(16)} AF: ${cpu.reg.AF.toString(16)} BC: ${cpu.reg.BC.toString(16)} DE: ${cpu.reg.DE.toString(16)} HL: ${cpu.reg.HL.toString(16)} SP:  ${cpu.reg.SP.toString(16)}`);
        }
        cpu.tick();
        ppu.tick(cpu.m);
        if (cpu.reg.PC === 0xDEF9 && cpu.OC === 0xC7) {
            // 0xC6B8
            // CC52
            // DEF8
            console.log(`PC: ${cpu.reg.PC.toString(16)} OC: ${cpu.bus.read8(cpu.reg.PC).toString(16)} AF: ${cpu.reg.AF.toString(16)} BC: ${cpu.reg.BC.toString(16)} DE: ${cpu.reg.DE.toString(16)} HL: ${cpu.reg.HL.toString(16)} SP:  ${cpu.reg.SP.toString(16)}`);

            // debug = true;
        }

        cyclesThisTick += cpu.m;

    }
    window.requestAnimationFrame(runFrame);
    // setTimeout(run, 1);
}

function run() {
    runFrame();
}

function loadRom(rom) {
    mmu.rom = new Uint8Array(rom);
    console.log(mmu.rom);
    mmu.loadRom();
}

export { tick, run, loadRom };
export default updateDebug;