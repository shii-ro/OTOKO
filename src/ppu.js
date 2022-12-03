const SCREEN_WIDTH = 160;
const SCREEN_HEIGHT = 144;

const regLCDC = 0x40;
const regSTAT = 0x41;
const regSCY = 0x42;
const regSCX = 0x43;
const regLY = 0x44;
const regLYC = 0x45;
const regBGP = 0x47;
const COLORS = [[0xe6, 0xf8, 0xda, 0xFF], [0x99, 0xc8, 0x86, 0xFF], [0x43, 0x79, 0x69, 0xFF], [0x05, 0x1f, 0x2a, 0xFF]];


const LCDC = {
    LCDEnabled: 0x80,
    windowTileMapArea: 0x40,
    windowEnabled: 0x20,
    BGWindowTileDataArea: 0x10,
    BGTileMapArea: 0x8,
    OBJSize: 0x4,
    OBJEnable: 0x2,
    BGWindowEnable: 0x1
}

const STAT = {
    coincidenceINTR: 0x40,
    mode2INTR: 0x20,
    mode1INTR: 0x10,
    mode0INTR: 0x8,
    coincidenceFlag: 0x4,
    modeFlag: 0x3
}

class PPU {
    constructor() {
        this.statModes =
            this.scanlineCounter = 0;
        this.palette = [0x00, 0x00, 0x00, 0x00];
        this.width = SCREEN_WIDTH;
        this.height = SCREEN_HEIGHT;
        this.vram = new Uint8Array(0x2000);
        this.decoded = new Array(0x100).fill(0).map(() => new Array(0x100).fill(0));
        this.tile_i8 = new Int8Array(1);
        this.tile_u8 = new Uint8Array(1);
    }

    init(io, cpu) {
        this.cpu = cpu;
        this.io = io.register;
        this.screen = document.getElementById('renderer');
        this.ctx = this.screen.getContext('2d');
        this.imageData = this.ctx.createImageData(160, 144);
        this.fillDecodedArray();
    }

    fillDecodedArray() {
        for (let h = 0; h < 0x100; h++) {
            for (let l = 0; l < 0x100; l++) {
                let u16 = [0, 0, 0, 0, 0, 0, 0, 0];
                let tilerow16 = this.getTileRow2BPP(h, l);
                for (let i = 0; i < 8; i++) {
                    u16[i] = tilerow16 & 0x3;
                    tilerow16 >>= 2;
                }
                this.decoded[h][l] = u16;
            }
        }
    }

    write8(address, value) {
        this.vram[address & 0x1FFF] = value & 0xFF;
    }

    read8(address) {
        return this.vram[address & 0x1FFF] & 0xFF;
    }

    tick(mCycles) {
        // if ((this.io[regLCDC] & LCDC.LCDEnabled) !== LCDC.LCDEnabled) {
        //     this.scanlineCounter = 0;
        //     this.LY = 0;
        // }

        if ((this.io[regLCDC] & LCDC.LCDEnabled) === LCDC.LCDEnabled) {
            this.scanlineCounter += mCycles;

            if (this.scanlineCounter >= 114) {
                this.scanlineCounter -= 114;
                this.drawScanline(this.io[regLY]);
                this.io[regLY] = this.io[regLY] + 1;
            }

            if (this.io[regLY] >= 144) {
                if (this.io[regLY] === 144) {
                    // VBLANK INTERRUPT
                    this.cpu.intrRequest(0);
                }
                else if (this.io[regLY] > 153) {
                    this.io[regLY] = 0x00;
                    this.ctx.putImageData(this.imageData, 0, 0);
                }
            }
        }
    }

    getTileRow2BPP(rowH, rowL) {
        let tiledata = 0;

        tiledata = rowL | (rowH << 8);

        tiledata = (tiledata & 0xF00F) | ((tiledata & 0x0F00) >> 4) | ((tiledata & 0x00F0) << 4);
        tiledata = (tiledata & 0xC3C3) | ((tiledata & 0x3030) >> 2) | ((tiledata & 0x0C0C) << 2);
        tiledata = (tiledata & 0x9999) | ((tiledata & 0x4444) >> 1) | ((tiledata & 0x2222) << 1);

        tiledata = ((tiledata >> 2) & 0x3333) | ((tiledata & 0x3333) << 2);
        tiledata = ((tiledata >> 4) & 0x0F0F) | ((tiledata & 0x0F0F) << 4);
        tiledata = ((tiledata >> 8) & 0x00FF) | ((tiledata & 0x00FF) << 8);

        return tiledata;
    }

    updatePalette(value) {
        this.palette[0] = (value & 0x3);
        this.palette[1] = ((value >> 2) & 0x3);
        this.palette[2] = ((value >> 4) & 0x3);
        this.palette[3] = ((value >> 6) & 0x3);
    }

    drawScanline(scanline) {
        let bgTileDataArea = ((this.io[regLCDC] & LCDC.BGWindowTileDataArea) === LCDC.BGWindowTileDataArea) ? 0x0000 : 0x0800;
        let bgTileMapArea = ((this.io[regLCDC] & LCDC.BGTileMapArea) === LCDC.BGTileMapArea) ? 0x1C00 : 0x1800;
        let basePointer = ((this.io[regLCDC] & LCDC.BGWindowTileDataArea) === LCDC.BGWindowTileDataArea) ? 0x0000 : 0x0800;


        let tile_no = 0;
        let tiledata_l = 0;
        let tiledata_h = 0;
        let tiledata = 0;
        let tile_y = Math.floor(((scanline + this.io[regSCY]) & 0xFF) / 8) * 32; // i lost so much time debugging...
        let y_pos = 2 * ((scanline + this.io[regSCY]) % 8);
        let pixel = 0;
        let tile_n = (bgTileDataArea) ? this.tile_i8 : this.tile_u8;
        let offset;

        for (let square = 0; square < 20; square++) {
            tile_n[0] = this.vram[bgTileMapArea + (tile_y + square)];
            let offset = (tile_n[0] * 0x10);
            // if (bgTileDataArea) {
            //     console.log(`Map address: ${(bgTileMapArea + (tile_y + square)).toString(16)} Data address: ${((basePointer + offset) + y_pos).toString(16)}`);
            //     // console.log((bgTileMapArea + (tile_y + square)).toString(16), tile_n[0].toString(16), (basepointer + (tile_n[0] * 0x10)).toString(16), this.vram[0x1800].toString(16));
            // }

            tiledata_l = this.vram[(basePointer + offset) + bgTileDataArea + y_pos];
            tiledata_h = this.vram[(basePointer + offset) + bgTileDataArea + y_pos + 1];
            tiledata = this.decoded[tiledata_h][tiledata_l];

            for (let x = 0; x < 8; x++) {
                pixel = tiledata[x];
                let point = (((square * 8) + x) + (scanline * 160)) * 4;
                let color = COLORS[this.palette[pixel]];

                this.imageData.data[point + 0] = color[0];        // R value
                this.imageData.data[point + 1] = color[1];       // G value
                this.imageData.data[point + 2] = color[2];      // B value
                this.imageData.data[point + 3] = 0xFF;          // A value
            }
        }
    }
}

export {PPU};