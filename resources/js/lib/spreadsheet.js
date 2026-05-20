export const CELL_SIZE = 20;
export const HDR_H = 20;
export const TOTAL_HDR_H = HDR_H * 4;
export const MIN_ROWS = 3;
export const MIN_ROWS_LOCATION = 1;
export const BUFFER_ROWS = 12;
export const DEV_HDR_W = 202;
export const ASGN_HDR_W = 80;
export const HANDLE_W = 5;

export const TIME_SLOTS = [
    { label: 'AM1', start: '08:30', end: '10:30' },
    { label: 'AM2', start: '10:40', end: '12:25' },
    { label: 'PM1', start: '13:05', end: '15:05' },
    { label: 'PM2', start: '15:15', end: '17:15' },
    { label: '残業1', start: '17:25', end: '19:25' },
    { label: '残業2', start: '19:25', end: '21:25' },
];
export const SLOT_COUNT = TIME_SLOTS.length;
export const SLOT_LABELS = TIME_SLOTS.map(s => s.label);

export const TODAY_STR = new Date().toISOString().slice(0, 10);

export function parseApiDate(s) {
    if (!s) return null;
    return s.includes('T') ? new Date(s) : new Date(s + 'T00:00:00');
}

export function dateToStr(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function addDays(dateStr, n) {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + n);
    return dateToStr(d);
}

export function daysBetween(a, b) {
    const da = new Date(a + 'T00:00:00');
    const db = new Date(b + 'T00:00:00');
    return Math.round((db - da) / 86400000);
}

export function getWeekNumber(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const jan1 = new Date(d.getFullYear(), 0, 1);
    const diff = Math.floor((d - jan1) / 86400000);
    return Math.ceil((diff + jan1.getDay() + 1) / 7);
}

export function colToDateStr(startDate, col, viewMode) {
    if (viewMode === 'day') return addDays(startDate, col);
    return addDays(startDate, Math.floor(col / SLOT_COUNT));
}

function toHm(date) {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function dateToCol(startDate, dateStr, viewMode, hm = '08:30') {
    const days = daysBetween(startDate, dateStr.slice(0, 10));
    if (viewMode === 'day') return days;
    const slotIdx = TIME_SLOTS.findIndex(s => s.start === hm);
    return days * SLOT_COUNT + Math.max(0, slotIdx);
}

export function planToStartCol(plan, startDate, viewMode) {
    const d = parseApiDate(plan.startDate);
    if (!d) return 0;
    return dateToCol(startDate, dateToStr(d), viewMode, toHm(d));
}

export function planToEndCol(plan, startDate, viewMode) {
    const d = parseApiDate(plan.endDate);
    if (!d) return 0;
    const dateStr = dateToStr(d);
    const hm = toHm(d);
    if (viewMode === 'day') return dateToCol(startDate, dateStr, viewMode, hm);
    const endSlot = TIME_SLOTS.findIndex(s => s.end === hm);
    const days = daysBetween(startDate, dateStr);
    return days * SLOT_COUNT + Math.max(0, endSlot);
}

export function colToDateTime(startDate, col, type, viewMode) {
    if (viewMode === 'day') return addDays(startDate, col) + 'T08:00:00';
    const dayIdx = Math.floor(col / SLOT_COUNT);
    const slotIdx = col % SLOT_COUNT;
    const dateStr = addDays(startDate, dayIdx);
    if (type === 'start') return `${dateStr}T${TIME_SLOTS[slotIdx].start}:00`;
    return `${dateStr}T${TIME_SLOTS[slotIdx].end}:00`;
}

export function layoutPlans(plans, groupKey, groups, viewMode, startDate, minRows = MIN_ROWS, locationPlans = null) {
    const groupMap = {};
    for (const g of groups) {
        groupMap[g.id] = { ...g, rows: Array.from({ length: minRows }, () => null), plans: [] };
    }

    const sorted = [...plans].sort((a, b) => parseApiDate(a.startDate) - parseApiDate(b.startDate));
    for (const plan of sorted) {
        const gid = groupKey === 'device' ? plan.serialId : groupKey === 'worker' ? plan.workerId : plan.locationId;
        const grp = groupMap[gid];
        if (!grp) continue;

        const startCol = planToStartCol(plan, startDate, viewMode);
        const endCol = planToEndCol(plan, startDate, viewMode);

        let rowIdx = -1;
        for (let r = 0; r < grp.rows.length; r++) {
            if (grp.rows[r] === null || grp.rows[r] <= startCol) {
                rowIdx = r;
                break;
            }
        }
        if (rowIdx === -1) {
            rowIdx = grp.rows.length;
            grp.rows.push(null);
        }
        grp.rows[rowIdx] = endCol + 1;
        grp.plans.push({ ...plan, rowIdx });
    }

    let locLayoutMap = null;
    if (locationPlans !== null) {
        locLayoutMap = {};
        for (const g of groups) locLayoutMap[g.id] = { rows: [], plans: [] };

        const sortedLoc = [...locationPlans].sort((a, b) => parseApiDate(a.startDate) - parseApiDate(b.startDate));
        for (const plan of sortedLoc) {
            const loc = locLayoutMap[plan.serialId];
            if (!loc) continue;
            const startCol = planToStartCol(plan, startDate, viewMode);
            const endCol = planToEndCol(plan, startDate, viewMode);
            let rowIdx = -1;
            for (let r = 0; r < loc.rows.length; r++) {
                if (loc.rows[r] === null || loc.rows[r] <= startCol) { rowIdx = r; break; }
            }
            if (rowIdx === -1) { rowIdx = loc.rows.length; loc.rows.push(null); }
            loc.rows[rowIdx] = endCol + 1;
            loc.plans.push({ ...plan, rowIdx });
        }
    }

    let startRow = 0;
    const result = [];
    for (const g of groups) {
        const grp = groupMap[g.id];
        const locLayout = locLayoutMap ? locLayoutMap[g.id] : null;
        const locationNumRows = locLayout ? Math.max(1, locLayout.rows.length || 1) : 0;

        if (!grp) {
            const nr = minRows + locationNumRows;
            result.push({
                ...g, startRow, numRows: nr, plans: [],
                locationRowIdx: locationNumRows > 0 ? minRows : -1,
                locationNumRows,
                locationPlans: locLayout ? locLayout.plans : [],
            });
            startRow += nr;
            continue;
        }
        const numRows = Math.max(minRows, grp.rows.length);
        const totalNr = numRows + locationNumRows;
        result.push({
            ...grp, startRow, numRows: totalNr,
            locationRowIdx: locationNumRows > 0 ? numRows : -1,
            locationNumRows,
            locationPlans: locLayout ? locLayout.plans : [],
        });
        startRow += totalNr;
    }
    return { groups: result, totalRows: startRow };
}

export function computeGaps(fetchedRanges, from, to) {
    let gaps = [{ from, to }];
    for (const r of fetchedRanges) {
        gaps = gaps.flatMap(g => {
            if (r.to < g.from || r.from > g.to) return [g];
            const result = [];
            if (g.from < r.from) result.push({ from: g.from, to: addDays(r.from, -1) });
            if (g.to > r.to) result.push({ from: addDays(r.to, 1), to: g.to });
            return result;
        });
    }
    return gaps;
}
