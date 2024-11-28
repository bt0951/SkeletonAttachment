"use strict";
exports.promisify = function (e) {
    return function (...r) {
        return new Promise((t, n) => {
            e(...r, (e, r) => {
                if (e) return n(e);
                t(r)
            })
        })
    }
};
exports.equalArray = function (e, r) {
    return e.length === r.length && e.every(e => -1 !== r.indexOf(e))
};

exports.packKey = function (e, r, t, n, o, c) {
    return {
        id: e,
        path: r,
        component: t,
        property: n,
        frame: o,
        value: c
    }
};
exports.indexOf = function (e, r) {
    let t = Object.keys(r);
    for (let n = 0; n < e.length; n++) {
        let o = e[n];
        if (t.every(e => o[e] === r[e])) return n
    }
    return -1
};

function toggleBitMask(mask, on, index) {
    if (on) {
        return (mask || 0) | (1 << index);
    } else {
        return (mask || 0) & (~(1 << index));
    }
}

function getBit(mask, index) {
    return !!((mask || 0) & (1 << index));
}
exports.toggleBitMask = toggleBitMask;
exports.isBitOn = getBit;