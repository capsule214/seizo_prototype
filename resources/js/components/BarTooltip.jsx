import { useEffect, useRef, useState } from 'react';
import { getColor } from '../lib/colors';

function fmtDT(s) {
    if (!s) return '';
    const d = s.includes('T') ? new Date(s) : new Date(s + 'T00:00:00');
    return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function dayDiff(start, end) {
    const s = start.includes('T') ? new Date(start) : new Date(start + 'T00:00:00');
    const e = end.includes('T') ? new Date(end) : new Date(end + 'T00:00:00');
    return Math.max(1, Math.round((e - s) / 86400000) + 1);
}

export default function BarTooltip({ plan, anchorX, anchorY, onClose }) {
    const ref = useRef(null);
    const [pos, setPos] = useState({ left: anchorX + 12, top: anchorY + 12 });

    useEffect(() => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        let left = anchorX + 12;
        let top  = anchorY + 12;
        if (left + rect.width > window.innerWidth - 8) left = anchorX - rect.width - 8;
        if (top + rect.height > window.innerHeight - 8) top = anchorY - rect.height - 8;
        setPos({ left, top });
    }, [anchorX, anchorY]);

    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, [onClose]);

    const taskBg = getColor(plan.taskBackColor);
    const taskFg = getColor(plan.taskFontColor);

    return (
        <div
            ref={ref}
            style={{
                position: 'fixed', left: pos.left, top: pos.top, zIndex: 9998,
                background: '#fff', border: '1px solid #d1d5db', borderRadius: 8,
                boxShadow: '0 4px 20px rgba(0,0,0,0.18)', padding: 12, minWidth: 220, fontSize: 13,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span style={{ background: taskBg, color: taskFg, padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>
                    {plan.taskName}
                </span>
            </div>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <tbody>
                    {[
                        ['機種', plan.kisyuName],
                        ['製番', plan.serialNo],
                        ['担当者', plan.workerName],
                        ['開始', fmtDT(plan.startDate)],
                        ['終了', fmtDT(plan.endDate)],
                        ['日数', `${dayDiff(plan.startDate, plan.endDate)}日`],
                    ].map(([k, v]) => (
                        <tr key={k}>
                            <td style={{ color: '#6b7280', padding: '2px 8px 2px 0', whiteSpace: 'nowrap' }}>{k}</td>
                            <td style={{ padding: '2px 0', fontWeight: 500 }}>{v}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <button
                onClick={onClose}
                style={{ position: 'absolute', top: 6, right: 8, border: 'none', background: 'none', cursor: 'pointer', fontSize: 16, color: '#6b7280' }}
            >×</button>
        </div>
    );
}
