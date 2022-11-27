const SCREEN_WIDTH = 160;
const SCREEN_HEIGHT = 144;

const regLCDC = 0x40;
const regSCY = 0x42;
const regSCX = 0x43;
const regLY = 0x44;
const regLYC = 0x45;
const regBGP = 0x47;
const COLORS = [[0xe6, 0xf8, 0xda, 0xFF], [0x99, 0xc8, 0x86, 0xFF], [0x43, 0x79, 0x69, 0xFF], [0x05, 0x1f, 0x2a, 0xFF]];

class PPU {
    constructor() {
        this.scanlineCounter = 0;
        this.palette = [0x00, 0x00, 0x00, 0x00];
        this.width = SCREEN_WIDTH;
        this.height = SCREEN_HEIGHT;
        this.vram = new Uint8Array(0x2000);
    }

    init(io) {
        this.io = io;
        this.screen = document.getElementById('renderer');
        this.ctx = this.screen.getContext('2d');
        this.imageData = this.ctx.createImageData(160, 144);
        this.framebuffer = new Uint32Array(this.imageData.buffer);
    }

    LCDC = {
        /// switching to set// getters later
        LCDEnabled: () => (this.io.read8(regLCDC) & 0x80) === 0x80,
        windowTileMapArea: () => (this.io.read8(regLCDC) & 0x40) === 0x40 ? 0x1C00 : 0x1800,
        windowEnabled: () => (this.io.read8(regLCDC) & 0x20) === 0x20,
        BGWindowTileDataArea: () => (this.io.read8(regLCDC) & 0x10) === 0x10 ? 0x0000 : 0x0000,
        BGTileMapArea: () => (this.io.read8(regLCDC) & 0x8) === 0x8 ? 0x1C00 : 0x1800,
        OBJSize: () => (this.io.read8(regLCDC) & 0x4) === 0x4,
        OBJEnable: () => (this.io.read8(regLCDC) & 0x2) === 0x2,
        BGWindowEnable: () => (this.io.read8(regLCDC) & 0x1) === 0x1
    };

    set LY(value) {
        this.io.write8(regLY, value & 0xFF);
    }
    get LY() {
        return this.io.read8(regLY) & 0xFF;
    }

    get SCY() { return this.io.read8(regSCY); } set SCY(u8) { this.io.write8(regSCY, u8); }
    get SCX() { return this.io.read8(regSCX); } set SCX(u8) { this.io.write8(regSCX, u8); }

    write8(address, value) {
        this.vram[address & 0x1FFF] = value & 0xFF;
    }

    read8(address) {
        return this.vram[address & 0x1FFF] & 0xFF;
    }

    tick(mCycles) {
        if (this.LCDC.LCDEnabled()) {
            this.scanlineCounter += mCycles;

            if (this.scanlineCounter >= 114) {
                this.scanlineCounter -= 114;
                this.drawScanline(this.LY);
                this.LY = this.LY + 1;
            }

            if (this.LY >= 144) {
                if (this.LY === 144) {
                    // VBLANK INTERRUPT
                }
                else if (this.LY > 153) {
                    this.LY = 0x00;   
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
        let bgTileDataArea = this.LCDC.BGWindowTileDataArea();
        let bgTileMapArea = this.LCDC.BGTileMapArea();

        let tile_no = 0;
        let tiledata_l = 0;
        let tiledata_h = 0;
        let tiledata = 0;
        let tile_y = Math.floor(((scanline + this.io.read8(regSCY)) & 0xFF) / 8) * 32; // i lost so much time debugging...
        let y_pos = 2 * ((scanline + this.io.read8(regSCY)) % 8);
        let pixel = 0;

        for (let square = 0; square < 20; square++) {
            tile_no = this.vram[bgTileMapArea + (tile_y + square)];
            tiledata_l = this.vram[bgTileDataArea + (tile_no * 0x10) + y_pos];
            tiledata_h = this.vram[bgTileDataArea + (tile_no * 0x10) + y_pos + 1];

            tiledata = this.getTileRow2BPP(tiledata_h, tiledata_l);

            for (let x = 0; x < 8; x++) {
                pixel = tiledata & 0x3;
                tiledata = tiledata >> 2;

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