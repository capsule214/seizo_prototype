import { useState, useEffect } from 'react';
import DatePicker from './DatePicker';

const TIME_SLOTS = [
    { label: 'AM1',  startH: 8,  startM: 0, endH: 10, endM: 0 },
    { label: 'AM2',  startH: 10, startM: 0, endH: 12, endM: 0 },
    { label: 'PM1',  startH: 13, startM: 0, endH: 15, endM: 0 },
    { label: 'PM2',  startH: 15, startM: 0, endH: 17, endM: 0 },
    { label: '残業1', startH: 17, startM: 0, endH: 19, endM: 0 },
    { label: '残業2', startH: 19, startM: 0, endH: 21, endM: 0 },
];

function toDateStr(dateStr, h, m) {
    const d = dateStr.slice(0, 10);
    return `${d}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`;
}

function parseDate(s) {
    if (!s) return { date: '', h: 8, m: 0 };
    const d = s.slice(0, 10);
    if (s.includes('T')) {
        const parts = s.slice(11).split(':');
        return { date: d, h: parseInt(parts[0]), m: parseInt(parts[1]) };
    }
    return { date: d, h: 8, m: 0 };
}

export default function ScheduleDialog({ plan, serials, tasks, workers, gridMode, onSave, onClose }) {
    const init = plan || {};
    const sd = parseDate(init.startDate || '');
    const ed = parseDate(init.endDate || '');

    const [startDate, setStartDate] = useState(sd.date || new Date().toISOString().slice(0, 10));
    const [startH, setStartH] = useState(sd.h || 8);
    const [endDate, setEndDate] = useState(ed.date || new Date().toISOString().slice(0, 10));
    const [endH, setEndH] = useState(ed.h || 21);
    const [serialId, setSerialId] = useState(init.serialId || (serials[0]?.serialId ?? ''));
    const [taskId, setTaskId] = useState(init.taskId || (tasks[0]?.taskId ?? ''));
    const [workerId, setWorkerId] = useState(init.workerId || (workers[0]?.workerId ?? ''));
    const [error, setError] = useState('');

    function slotForH(h, type) {
        for (const s of TIME_SLOTS) {
            if (type === 'start' && s.startH === h) return s;
            if (type === 'end' && s.endH === h) return s;
        }
        return null;
    }

    function handleSave() {
        const sd2 = toDateStr(startDate, startH, 0);
        const ed2 = toDateStr(endDate, endH, 0);
        if (sd2 > ed2) { setError('開始日時が終了日時より後になっています'); return; }
        setError('');
        onSave({ serialId: Number(serialId), taskId: Number(taskId), workerId: Number(workerId), startDate: sd2, endDate: ed2 });
    }

    const serial = serials.find(s => s.serialId == serialId);
    const rangeStart = startDate <= endDate ? startDate : endDate;
    const rangeEnd   = startDate <= endDate ? endDate : startDate;

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 10000, display: 'flex',
                alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)',
            }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div style={{
                background: '#fff', borderRadius: 10, padding: 24, width: 600,
                maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            }}>
                <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>
                    {plan ? '予定を編集' : '予定を追加'}
                </h2>

                <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
                    <div>
                        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>開始日</div>
                        <DatePicker
                            value={startDate}
                            onChange={setStartDate}
                            rangeStart={rangeStart}
                            rangeEnd={rangeEnd}
                        />
                        <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                            {TIME_SLOTS.map(s => (
                                <button
                                    key={s.label}
                                    onClick={() => setStartH(s.startH)}
                                    style={{
                                        padding: '3px 7px', fontSize: 11, borderRadius: 4,
                                        border: `1px solid ${startH === s.startH ? '#2563eb' : '#d1d5db'}`,
                                        background: startH === s.startH ? '#2563eb' : '#fff',
                                        color: startH === s.startH ? '#fff' : '#374151',
                                        cursor: 'pointer',
                                    }}
                                >{s.label}</button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>終了日</div>
                        <DatePicker
                            value={endDate}
                            onChange={setEndDate}
                            rangeStart={rangeStart}
                            rangeEnd={rangeEnd}
                        />
                        <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                            {TIME_SLOTS.map(s => (
                                <button
                                    key={s.label}
                                    onClick={() => setEndH(s.endH)}
                                    style={{
                                        padding: '3px 7px', fontSize: 11, borderRadius: 4,
                                        border: `1px solid ${endH === s.endH ? '#2563eb' : '#d1d5db'}`,
                                        background: endH === s.endH ? '#2563eb' : '#fff',
                                        color: endH === s.endH ? '#fff' : '#374151',
                                        cursor: 'pointer',
                                    }}
                                >{s.label}</button>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                        <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 3 }}>装置</label>
                        {gridMode === 'device' ? (
                            <input
                                readOnly
                                value={serial ? `${serial.kisyuName} / ${serial.serialNo}` : ''}
                                style={{ width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, background: '#f9fafb' }}
                            />
                        ) : (
                            <select
                                value={serialId}
                                onChange={e => setSerialId(e.target.value)}
                                style={{ width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }}
                            >
                                {serials.map(s => (
                                    <option key={s.serialId} value={s.serialId}>{s.kisyuName} / {s.serialNo}</option>
                                ))}
                            </select>
                        )}
                    </div>
                    <div>
                        <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 3 }}>工程</label>
                        <select
                            value={taskId}
                            onChange={e => setTaskId(e.target.value)}
                            style={{ width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }}
                        >
                            {tasks.map(t => (
                                <option key={t.taskId} value={t.taskId}>{t.taskName}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 3 }}>担当者</label>
                        <select
                            value={workerId}
                            onChange={e => setWorkerId(e.target.value)}
                            style={{ width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }}
                        >
                            {workers.map(w => (
                                <option key={w.workerId} value={w.workerId}>{w.workerName}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {error && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 8 }}>{error}</div>}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
                    <button onClick={onClose} style={{ padding: '7px 18px', border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 13 }}>キャンセル</button>
                    <button onClick={handleSave} style={{ padding: '7px 18px', border: 'none', borderRadius: 6, background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>保存</button>
                </div>
            </div>
        </div>
    );
}
