// import CPU from './cpu.js';
import { CPU } from "./cpu.js";
import { IO } from "./io.js";
import { MMU } from "./mmu.js";
import { PPU } from "./ppu.js";
import { Bus } from "./bus.js";

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
    console.log(`PC: ${cpu.reg.PC.toString(16)} OC: ${cpu.OC.toString(16)} AF: ${cpu.reg.AF.toString(16)} BC: ${cpu.reg.BC.toString(16)} DE: ${cpu.reg.DE.toString(16)} HL: ${cpu.reg.HL.toString(16)} SP:  ${cpu.reg.SP.toString(16)}`);
    updateDebug();
}

let running = true;
let debug = false;

// function run() {
//     // while (true) {
//     //     cpu.tick();
//     //     ppu.tick(cpu.m);
//     // }
//     cpu.tick();
//     ppu.tick(cpu.m);
//     // setInterval(run
//     // , 0);
//     // console.log(`PC: ${cpu.reg.PC.toString(16)} OC: ${cpu.OC.toString(16)} AF: ${cpu.reg.AF.toString(16)} BC: ${cpu.reg.BC.toString(16)} DE: ${cpu.reg.DE.toString(16)} HL: ${cpu.reg.HL.toString(16)} SP:  ${cpu.reg.SP.toString(16)}`);
// }

function runFrame() {
    const MAX_CYCLES = 69905;
    let cyclesThisTick = 0;

    while (cyclesThisTick < MAX_CYCLES) {
        if (debug) {
            console.log(`PC: ${cpu.reg.PC.toString(16)} OC: ${cpu.OC.toString(16)} AF: ${cpu.reg.AF.toString(16)} BC: ${cpu.reg.BC.toString(16)} DE: ${cpu.reg.DE.toString(16)} HL: ${cpu.reg.HL.toString(16)} SP:  ${cpu.reg.SP.toString(16)}`);
        }
        cpu.tick();
        ppu.tick(cpu.m);
        cyclesThisTick += cpu.m;
        // if (cpu.reg.PC === 0xCC52) {
        //     // 0xC6B8
        //     // CC52
        //     console.log(`PC: ${cpu.reg.PC.toString(16)} OC: ${cpu.OC.toString(16)} AF: ${cpu.reg.AF.toString(16)} BC: ${cpu.reg.BC.toString(16)} DE: ${cpu.reg.DE.toString(16)} HL: ${cpu.reg.HL.toString(16)} SP:  ${cpu.reg.SP.toString(16)}`);

        //     // debug = true;
        // }
    }
    window.requestAnimationFrame(runFrame);
}

function run() {
    window.requestAnimationFrame(runFrame);
}

function loadRom(rom) {
    mmu.rom = new Uint8Array(rom);
    mmu.loadRom();
}
export { tick, run, loadRom };