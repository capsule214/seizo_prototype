const cache = new Map();

function nthMonday(year, month, n) {
    const d = new Date(year, month - 1, 1);
    const dow = d.getDay();
    const first = dow === 1 ? 1 : (8 - dow) % 7 + 1;
    return first + (n - 1) * 7;
}

function shunbun(year) {
    return Math.floor(20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
}

function shubun(year) {
    return Math.floor(23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
}

function computeHolidays(year) {
    const h = new Set();
    const add = (m, d) => h.add(`${year}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`);

    add(1, 1);
    add(2, 11);
    add(2, 23);
    add(4, 29);
    add(5, 3);
    add(5, 4);
    add(5, 5);
    add(8, 11);
    add(11, 3);
    add(11, 23);

    add(1, nthMonday(year, 1, 2));
    add(7, nthMonday(year, 7, 3));
    add(9, nthMonday(year, 9, 3));
    add(10, nthMonday(year, 10, 2));

    add(3, shunbun(year));
    add(9, shubun(year));

    const snapshot = Array.from(h);
    for (const ds of snapshot) {
        const d = new Date(ds);
        if (d.getDay() === 0) {
            const next = new Date(d);
            next.setDate(next.getDate() + 1);
            while (h.has(fmt(next))) next.setDate(next.getDate() + 1);
            h.add(fmt(next));
        }
    }

    const sorted = Array.from(h).sort();
    for (let i = 1; i < sorted.length - 1; i++) {
        const prev = new Date(sorted[i - 1]);
        const curr = new Date(sorted[i]);
        const next = new Date(sorted[i + 1]);
        if (curr.getDay() !== 0 && curr.getDay() !== 6) {
            const prevDiff = (curr - prev) / 86400000;
            const nextDiff = (next - curr) / 86400000;
            if (prevDiff === 1 && nextDiff === 1) h.add(sorted[i]);
        }
    }

    return h;
}

function fmt(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export function isHoliday(dateStr) {
    const year = parseInt(dateStr.slice(0, 4));
    if (!cache.has(year)) cache.set(year, computeHolidays(year));
    return cache.get(year).has(dateStr.slice(0, 10));
}

export function getDateType(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const dow = d.getDay();
    if (isHoliday(dateStr)) return 'holiday';
    if (dow === 0) return 'sunday';
    if (dow === 6) return 'saturday';
    return 'weekday';
}
