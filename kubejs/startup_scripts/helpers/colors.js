global.colors = {}

function HEXtoDEC(hex) {
    let cleanHex = hex.startsWith('#') ? hex.substring(1) : hex
    let rgb = cleanHex.padStart(6, '0')
    let withAlpha = rgb + 'FF'
    return parseInt(withAlpha, 16)
}
global.colors.HEXtoDEC = HEXtoDEC

function RGBtoHEX(r, g, b) {
    // Ensure values are within valid range (0-255)
    let r1 = Math.max(0, Math.min(255, Math.round(r)));
    let g1 = Math.max(0, Math.min(255, Math.round(g)));
    let b1 = Math.max(0, Math.min(255, Math.round(b)));

    // Convert each component to hex and pad with zero if needed
    let rHex = r1.toString(16).padStart(2, '0');
    let gHex = g1.toString(16).padStart(2, '0');
    let bHex = b1.toString(16).padStart(2, '0');

    return rHex + gHex + bHex;
}
global.colors.RGBtoHEX = RGBtoHEX

function HEXtoColor(hex) {
    let digits
    let n = hex.length
    if (hex.startsWith("#")) {
        digits = hex.substring(1, Math.min(hex.length, 7))
    } else {
        digits = hex
    }
    if (digits.length === 3) {
        let r = digits.substring(0, 1)
        let g = digits.substring(1, 2)
        let b = digits.substring(2, 3)
        digits = r + r + g + g + b + b
    }
    let hstr = "0x" + digits
    let c
    try {
        c = decodeColor(hstr)
    } catch (nfe) {
        c = null
    }
    return c
}
global.colors.HEXtoColor = HEXtoColor

function decodeColor(hstr) {
    let hex = hstr.startsWith("0x") ? hstr.substring(2) : hstr
    let num = parseInt(hex, 16)
    return {
        getRed: () => (num >> 16) & 0xFF,
        getGreen: () => (num >> 8) & 0xFF,
        getBlue: () => num & 0xFF
    }
}
global.colors.decodeColor = decodeColor

function HEXtoRGB(hex) {
    let color = HEXtoColor(hex)
    let r = color.getRed()
    let g = color.getGreen()
    let b = color.getBlue()
    return RGBtoHSB(r, g, b)
}
global.colors.HEXtoRGB = HEXtoRGB

function RGBtoHSB(r, g, b) {
    r /= 255
    g /= 255
    b /= 255

    let max = Math.max(r, g, b)
    let min = Math.min(r, g, b)
    let delta = max - min

    let h = 0
    let s = 0
    let v = max

    if (delta !== 0) {
        s = delta / max

        if (r === max) {
            h = (g - b) / delta
        } else if (g === max) {
            h = 2 + (b - r) / delta
        } else {
            h = 4 + (r - g) / delta
        }

        h *= 60
        if (h < 0) h += 360
    }

    return [h, s, v]
}
global.colors.RGBtoHSB = RGBtoHSB

function INTtoRGB(color) {
    let res = new Array(4)
    res[0] = (color >> 24 & 0xff) / 255
    res[1] = (color >> 16 & 0xff) / 255
    res[2] = (color >> 8 & 0xff) / 255
    res[3] = (color & 0xff) / 255
    return res
}
global.colors.INTtoRGB = INTtoRGB

function HEXtoHSV(hex) {
    let color = HEXtoColor(hex);
    let r = color.getRed() / 255;
    let g = color.getGreen() / 255;
    let b = color.getBlue() / 255;

    let min = Math.min(r, g, b);
    let max = Math.max(r, g, b);
    let delta = max - min;

    let h, s, v;

    // Value (brightness)
    v = max * 100; // Convert to percentage 0-100

    // Saturation
    if (max !== 0) {
        s = (delta / max) * 100; // Convert to percentage 0-100
    } else {
        s = 0;
        h = 0;
        return [Math.round(h), Math.round(s), Math.round(v)];
    }

    // Hue
    if (delta === 0) {
        h = 0;
    } else if (r === max) {
        h = ((g - b) / delta) * 60; // between yellow & magenta
    } else if (g === max) {
        h = (2 + (b - r) / delta) * 60; // between cyan & yellow
    } else {
        h = (4 + (r - g) / delta) * 60; // between magenta & cyan
    }

    if (h < 0) h += 360;

    return [Math.round(h), Math.round(s), Math.round(v)];
}
global.colors.HEXtoHSV = HEXtoHSV

function getHue(hex) {
    let hsv = HEXtoHSV(hex)
    return hsv[0]
}
global.colors.getHue = getHue

function getSaturation(hex) {
    let hsv = HEXtoHSV(hex)
    return hsv[1]
}
global.colors.getSaturation = getSaturation

function getValue(hex) {
    let hsv = HEXtoHSV(hex)
    return hsv[2]
}
global.colors.getValue = getValue

function RGBtoDEC(r, g, b) {
    let rs = Math.round(r * 256).toString(16)
    let gs = Math.round(g * 256).toString(16)
    let bs = Math.round(b * 256).toString(16)
    return rs + gs + bs
}
global.colors.RGBtoDEC = RGBtoDEC

function HSVtoHEX(h, s, v) {
    let R, G, B
    h /= 360
    s /= 100
    v /= 100

    if (s === 0) {
        R = v * 255
        G = v * 255
        B = v * 255
    } else {
        let var_h = h * 6
        if (var_h === 6) var_h = 0 // H must be < 1

        let var_i = Math.floor(var_h)
        let var_1 = v * (1 - s)
        let var_2 = v * (1 - s * (var_h - var_i))
        let var_3 = v * (1 - s * (1 - (var_h - var_i)))

        let var_r, var_g, var_b

        if (var_i === 0) {
            var_r = v
            var_g = var_3
            var_b = var_1
        } else if (var_i === 1) {
            var_r = var_2
            var_g = v
            var_b = var_1
        } else if (var_i === 2) {
            var_r = var_1
            var_g = v
            var_b = var_3
        } else if (var_i === 3) {
            var_r = var_1
            var_g = var_2
            var_b = v
        } else if (var_i === 4) {
            var_r = var_3
            var_g = var_1
            var_b = v
        } else {
            var_r = v
            var_g = var_1
            var_b = var_2
        }

        R = var_r * 255 // RGB results from 0 to 255
        G = var_g * 255
        B = var_b * 255
    }

    let rs = Math.round(R).toString(16)
    let gs = Math.round(G).toString(16)
    let bs = Math.round(B).toString(16)

    if (rs.length === 1) rs = "0" + rs
    if (gs.length === 1) gs = "0" + gs
    if (bs.length === 1) bs = "0" + bs

    return rs + gs + bs
}
global.colors.HSVtoHEX = HSVtoHEX

function hueShift(hex, factor, isHighlight) {
    let h = getHue(hex)
    let s = getSaturation(hex)
    let v = getValue(hex)

    let h2 = 0
    let s2 = 0
    let v2 = 0

    if (isHighlight) {
        if (h >= 0 && h < 60) {
            h2 = h + (4 * factor)
            s2 = s - (5 * factor)
            v2 = v + (10 * factor)
        } else if (h >= 60 && h < 120) {
            h2 = h - (4 * factor)
            s2 = s - (5 * factor)
            v2 = v + (10 * factor)
        } else if (h >= 120 && h < 180) {
            h2 = h + (8 * factor)
            s2 = s - (2 * factor)
            v2 = v + (20 * factor)
        } else if (h >= 180 && h < 240) {
            h2 = h - (8 * factor)
            s2 = s - (2 * factor)
            v2 = v + (20 * factor)
        } else if (h >= 240 && h < 300) {
            h2 = h + (8 * factor)
            s2 = s - (2 * factor)
            v2 = v + (20 * factor)
        } else if (h >= 300 && h <= 360) {
            h2 = h + (8 * factor)
            s2 = s - (2 * factor)
            v2 = v + (20 * factor)
        }
    } else {
        if (h >= 0 && h < 60) {
            h2 = h - (4 * factor)
            s2 = s + (5 * factor)
            v2 = v - (15 * factor)
        } else if (h >= 60 && h < 120) {
            h2 = h + (4 * factor)
            s2 = s + (5 * factor)
            v2 = v - (15 * factor)
        } else if (h >= 120 && h < 180) {
            h2 = h - (8 * factor)
            s2 = s + (2 * factor)
            v2 = v - (10 * factor)
        } else if (h >= 180 && h < 240) {
            h2 = h + (8 * factor)
            s2 = s + (2 * factor)
            v2 = v - (10 * factor)
        } else if (h >= 240 && h < 300) {
            h2 = h - (8 * factor)
            s2 = s + (2 * factor)
            v2 = v - (10 * factor)
        } else if (h >= 300 && h <= 360) {
            h2 = h - (8 * factor)
            s2 = s + (2 * factor)
            v2 = v - (10 * factor)
        }
    }

    if (h2 < 0 || h2 > 360) h2 = ((h2 + 360) % 360)

    if (s2 < 0) s2 = 0
    if (s2 > 100) s2 = 100

    if (v2 < 0) v2 = 0
    if (v2 > 100) v2 = 100

    return HSVtoHEX(h2, s2, v2)
}
global.colors.hueShift = hueShift