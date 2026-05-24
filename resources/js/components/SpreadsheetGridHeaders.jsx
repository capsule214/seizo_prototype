import { HDR_H, SLOT_COUNT, SLOT_LABELS, TODAY_STR } from '../lib/spreadsheet';

export default function SpreadsheetGridHeaders({
    viewMode,
    colW,
    dateColumns,
    scrollLeft,
    containerW,
}) {
    const rows = [];
    const dayW = viewMode === 'day' ? colW : colW * SLOT_COUNT;
    const DOW_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

    const yearSpans = [];
    const monthSpans = [];
    const weekSpans = [];

    let curYear = null, curMonth = null, curWeek = null;
    let yearStart = 0, monthStart = 0, weekStart = 0;

    for (let d = 0; d < dateColumns.length; d++) {
        const dc = dateColumns[d];
        if (dc.year !== curYear) {
            if (curYear !== null) yearSpans.push({ year: curYear, x: yearStart * dayW, w: (d - yearStart) * dayW });
            curYear = dc.year; yearStart = d;
        }
        if (dc.month !== curMonth || dc.year !== (dateColumns[d - 1]?.year)) {
            if (curMonth !== null) monthSpans.push({ month: curMonth, x: monthStart * dayW, w: (d - monthStart) * dayW });
            curMonth = dc.month; monthStart = d;
        }
        if (dc.week !== curWeek) {
            if (curWeek !== null) weekSpans.push({ week: curWeek, x: weekStart * dayW, w: (d - weekStart) * dayW });
            curWeek = dc.week; weekStart = d;
        }
    }

    if (curYear !== null) yearSpans.push({ year: curYear, x: yearStart * dayW, w: (dateColumns.length - yearStart) * dayW });
    if (curMonth !== null) monthSpans.push({ month: curMonth, x: monthStart * dayW, w: (dateColumns.length - monthStart) * dayW });
    if (curWeek !== null) weekSpans.push({ week: curWeek, x: weekStart * dayW, w: (dateColumns.length - weekStart) * dayW });

    const commonStyle = {
        position: 'absolute',
        height: HDR_H,
        borderRight: '1px solid #d1d5db',
        borderBottom: '1px solid #d1d5db',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 10,
        overflow: 'hidden',
        background: '#f3f4f6',
        boxSizing: 'border-box',
    };

    if (viewMode === 'slot') {
        rows.push(...weekSpans.filter(s => s.x + s.w > scrollLeft && s.x < scrollLeft + containerW).map((s) => {
            const weekStartDay = Math.floor(s.x / dayW);
            const weekStart = dateColumns[weekStartDay];
            const weekLabel = weekStart ? `${weekStart.year}年${String(weekStart.month).padStart(2, '0')}月(第${s.week}週)` : `第${s.week}週`;
            return (
                <div key={`slot-w${s.x}`} style={{ ...commonStyle, left: s.x, width: s.w, top: 0 }}>
                    {weekLabel}
                </div>
            );
        }));

        rows.push(...dateColumns.flatMap((dc, dayIdx) => {
            const x = dayIdx * dayW;
            if (!(x + dayW > scrollLeft && x < scrollLeft + containerW)) {
                return [];
            }
            const isToday = dc.dateStr === TODAY_STR;
            let color = '#374151';
            let bg = '#f3f4f6';
            if (dc.type === 'sunday' || dc.type === 'holiday') color = '#ef4444';
            if (dc.type === 'saturday') color = '#3b82f6';
            if (isToday) { bg = '#ef4444'; color = '#fff'; }

            const dateCell = (
                <div key={`slot-date-${dc.dateStr}`} style={{ ...commonStyle, left: x, width: dayW, top: HDR_H, background: bg, color }}>
                    {String(dc.month).padStart(2, '0')}/{String(dc.day).padStart(2, '0')}
                </div>
            );

            const dowColor = (dc.type === 'sunday' || dc.type === 'holiday') ? '#ef4444'
                : dc.type === 'saturday' ? '#3b82f6'
                    : '#374151';
            const dowCell = (
                <div key={`slot-dow-${dc.dateStr}`} style={{ ...commonStyle, left: x, width: dayW, top: HDR_H * 2, color: dowColor }}>
                    {DOW_LABELS[dc.dow]}
                </div>
            );

            const slotGroupLabels = ['AM', 'PM', '残業'];
            const slotCells = slotGroupLabels.map((label, gi) => (
                <div
                    key={`slot-group-${dc.dateStr}-${gi}`}
                    style={{ ...commonStyle, left: x + gi * colW * 2, width: colW * 2, top: HDR_H * 3, fontSize: 9 }}
                >
                    {label}
                </div>
            ));

            return [dateCell, dowCell, ...slotCells];
        }));

        return rows;
    }

    rows.push(...monthSpans.filter(s => s.x + s.w > scrollLeft && s.x < scrollLeft + containerW).map(s => {
        const monthStart = dateColumns[Math.floor(s.x / dayW)];
        return (
            <div key={`m-top-${s.x}`} style={{ ...commonStyle, left: s.x, width: s.w, top: 0 }}>
                {monthStart ? `${monthStart.year}年${String(monthStart.month).padStart(2, '0')}月` : ''}
            </div>
        );
    }));

    rows.push(...weekSpans.filter(s => s.x + s.w > scrollLeft && s.x < scrollLeft + containerW).map(s => (
        <div key={`w${s.x}`} style={{ ...commonStyle, left: s.x, width: s.w, top: HDR_H }}>
            {`${String(dateColumns[Math.floor(s.x / dayW)]?.month ?? '').padStart(2, '0')}月(第${s.week}週)`}
        </div>
    )));

    rows.push(...dateColumns.filter((_, i) => {
        const x = i * dayW;
        return x + dayW > scrollLeft && x < scrollLeft + containerW;
    }).flatMap((dc) => {
        const dayIdx = dateColumns.indexOf(dc);
        const x = dayIdx * dayW;
        const isToday = dc.dateStr === TODAY_STR;
        let color = '#374151', bg = '#f3f4f6';
        if (dc.type === 'sunday' || dc.type === 'holiday') color = '#ef4444';
        if (dc.type === 'saturday') color = '#3b82f6';
        if (isToday) { bg = '#ef4444'; color = '#fff'; }
        if (viewMode === 'day') {
            const dowColor = (dc.type === 'sunday' || dc.type === 'holiday') ? '#ef4444'
                : dc.type === 'saturday' ? '#3b82f6'
                    : '#374151';
            return [
                <div key={`${dc.dateStr}-day`} style={{ ...commonStyle, left: x, width: dayW, top: HDR_H * 2, background: bg, color }}>
                    {String(dc.day).padStart(2, '0')}
                </div>,
                <div key={`${dc.dateStr}-dow`} style={{ ...commonStyle, left: x, width: dayW, top: HDR_H * 3, color: dowColor }}>
                    {DOW_LABELS[dc.dow]}
                </div>
            ];
        }
        return SLOT_LABELS.map((label, si) => (
            <div key={`${dc.dateStr}-${si}`} style={{ ...commonStyle, left: x + si * colW, width: colW, top: HDR_H * 3, background: si === 0 ? bg : '#f3f4f6', color: si === 0 ? color : '#374151', fontSize: 9 }}>
                {si === 0 ? dc.day : label}
            </div>
        ));
    }));

    return rows;
}
