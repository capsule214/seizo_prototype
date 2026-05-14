import { useState } from 'react';

const TODAY = new Date().toISOString().slice(0, 10);

function fmt(y, m, d) {
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export default function DatePicker({ value, onChange, minDate, maxDate, rangeStart, rangeEnd }) {
    const init = value ? new Date(value + 'T00:00:00') : new Date();
    const [viewYear, setViewYear] = useState(init.getFullYear());
    const [viewMonth, setViewMonth] = useState(init.getMonth() + 1);

    function prevMonth() {
        if (viewMonth === 1) { setViewYear(y => y - 1); setViewMonth(12); }
        else setViewMonth(m => m - 1);
    }
    function nextMonth() {
        if (viewMonth === 12) { setViewYear(y => y + 1); setViewMonth(1); }
        else setViewMonth(m => m + 1);
    }

    const firstDay = new Date(viewYear, viewMonth - 1, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    function dayStr(d) { return fmt(viewYear, viewMonth, d); }

    function cellStyle(d) {
        if (!d) return {};
        const ds = dayStr(d);
        const dow = new Date(ds + 'T00:00:00').getDay();
        const disabled = (minDate && ds < minDate) || (maxDate && ds > maxDate);
        const isSelected = ds === value;
        const isToday = ds === TODAY;
        const inRange = rangeStart && rangeEnd && ds >= rangeStart && ds <= rangeEnd;

        let bg = 'transparent', color = '#111', cursor = 'pointer', opacity = 1;
        if (disabled) { opacity = 0.35; cursor = 'default'; }
        if (dow === 0) color = '#ef4444';
        if (dow === 6) color = '#3b82f6';
        if (inRange) bg = '#bfdbfe';
        if (isToday) { bg = '#ef4444'; color = '#fff'; }
        if (isSelected) { bg = '#2563eb'; color = '#fff'; }

        return { background: bg, color, cursor, opacity, borderRadius: 4, padding: '2px 0' };
    }

    return (
        <div style={{ userSelect: 'none', width: 210 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <button onClick={prevMonth} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '0 6px' }}>◀</button>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{viewYear}年{viewMonth}月</span>
                <button onClick={nextMonth} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '0 6px' }}>▶</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', textAlign: 'center', fontSize: 11, gap: 1 }}>
                {['日','月','火','水','木','金','土'].map((d, i) => (
                    <div key={d} style={{ color: i === 0 ? '#ef4444' : i === 6 ? '#3b82f6' : '#555', fontWeight: 600, padding: '2px 0' }}>{d}</div>
                ))}
                {cells.map((d, i) => (
                    <div
                        key={i}
                        style={cellStyle(d)}
                        onClick={() => {
                            if (!d) return;
                            const ds = dayStr(d);
                            const disabled = (minDate && ds < minDate) || (maxDate && ds > maxDate);
                            if (!disabled) onChange(ds);
                        }}
                    >
                        {d || ''}
                    </div>
                ))}
            </div>
        </div>
    );
}
