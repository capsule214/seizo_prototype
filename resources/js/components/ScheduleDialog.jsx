import { useState, useEffect, useMemo } from 'react';
import DatePicker from './DatePicker';
import { TIME_SLOTS } from '../lib/spreadsheet';
function toDateStr(dateStr, hm) {
    const d = dateStr.slice(0, 10);
    return `${d}T${hm}:00`;
}

function parseDate(s) {
    if (!s) return { date: '', hm: TIME_SLOTS[0].start };
    const d = s.slice(0, 10);
    if (s.includes('T')) {
        const parts = s.slice(11).split(':');
        return { date: d, hm: `${parts[0]}:${parts[1]}` };
    }
    return { date: d, hm: TIME_SLOTS[0].start };
}

export default function ScheduleDialog({ plan, serials, tasks, workers, locations, gridMode, initialData, onSave, onClose }) {
    const init = plan || {};
    const sd = parseDate(init.startDate || initialData?.startDate || '');
    const ed = parseDate(init.endDate || initialData?.endDate || '');

    // 機種ドロップダウン用：serials から kisyu 一覧を生成（sortNo 順）
    const kisyuList = useMemo(() => {
        const map = new Map();
        for (const s of serials) {
            if (!map.has(s.kisyuId)) map.set(s.kisyuId, { kisyuId: s.kisyuId, kisyuName: s.kisyuName, sortNo: s.sortNo ?? 0 });
        }
        return [...map.values()].sort((a, b) => a.sortNo - b.sortNo || a.kisyuId - b.kisyuId);
    }, [serials]);

    // 初期 kisyuId：編集中プランまたは初期データから解決
    const initKisyuId = (() => {
        const initSerialId = init.serialId || initialData?.serialId;
        if (initSerialId) {
            const found = serials.find(s => s.serialId == initSerialId);
            if (found) return found.kisyuId;
        }
        return kisyuList[0]?.kisyuId ?? '';
    })();

    const [startDate, setStartDate] = useState(sd.date || new Date().toISOString().slice(0, 10));
    const [startHm, setStartHm] = useState(TIME_SLOTS.some(s => s.start === sd.hm) ? sd.hm : TIME_SLOTS[0].start);
    const [endDate, setEndDate] = useState(ed.date || new Date().toISOString().slice(0, 10));
    const [endHm, setEndHm] = useState(TIME_SLOTS.some(s => s.end === ed.hm) ? ed.hm : TIME_SLOTS[TIME_SLOTS.length - 1].end);
    const [serialId, setSerialId] = useState(init.serialId || initialData?.serialId || (serials[0]?.serialId ?? ''));
    const [taskId, setTaskId] = useState(init.taskId || (tasks[0]?.taskId ?? ''));
    const [workerId, setWorkerId] = useState(init.workerId || (workers[0]?.workerId ?? ''));
    const [locationId, setLocationId] = useState(init.locationId || initialData?.locationId || (locations?.[0]?.locationId ?? ''));
    const [kisyuId, setKisyuId] = useState(initKisyuId);
    const [error, setError] = useState('');

    // 機種が変わったら整番を先頭に自動切り替え
    const filteredSerials = useMemo(
        () => serials.filter(s => s.kisyuId == kisyuId),
        [serials, kisyuId],
    );

    function handleKisyuChange(newKisyuId) {
        setKisyuId(newKisyuId);
        const first = serials.find(s => s.kisyuId == newKisyuId);
        if (first) setSerialId(first.serialId);
    }

    function handleSave() {
        const sd2 = toDateStr(startDate, startHm);
        const ed2 = toDateStr(endDate, endHm);
        if (sd2 > ed2) { setError('開始日時が終了日時より後になっています'); return; }
        setError('');
        if (gridMode === 'location') {
            onSave({ locationId: Number(locationId), serialId: Number(serialId), startDate: sd2, endDate: ed2 });
        } else {
            onSave({ serialId: Number(serialId), taskId: Number(taskId), workerId: Number(workerId), startDate: sd2, endDate: ed2 });
        }
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
                                    onClick={() => setStartHm(s.start)}
                                    style={{
                                        padding: '3px 7px', fontSize: 11, borderRadius: 4,
                                        border: `1px solid ${startHm === s.start ? '#2563eb' : '#d1d5db'}`,
                                        background: startHm === s.start ? '#2563eb' : '#fff',
                                        color: startHm === s.start ? '#fff' : '#374151',
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
                                    onClick={() => setEndHm(s.end)}
                                    style={{
                                        padding: '3px 7px', fontSize: 11, borderRadius: 4,
                                        border: `1px solid ${endHm === s.end ? '#2563eb' : '#d1d5db'}`,
                                        background: endHm === s.end ? '#2563eb' : '#fff',
                                        color: endHm === s.end ? '#fff' : '#374151',
                                        cursor: 'pointer',
                                    }}
                                >{s.label}</button>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {gridMode === 'location' ? (
                        <>
                            <div>
                                <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 3 }}>場所</label>
                                <input
                                    readOnly
                                    value={locations?.find(l => l.locationId == locationId)?.locationName || ''}
                                    style={{ width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, background: '#f9fafb' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 3 }}>機種</label>
                                <select
                                    value={kisyuId}
                                    onChange={e => handleKisyuChange(e.target.value)}
                                    style={{ width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }}
                                >
                                    {kisyuList.map(k => (
                                        <option key={k.kisyuId} value={k.kisyuId}>{k.kisyuName}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 3 }}>整番</label>
                                <select
                                    value={serialId}
                                    onChange={e => setSerialId(e.target.value)}
                                    style={{ width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }}
                                >
                                    {filteredSerials.map(s => (
                                        <option key={s.serialId} value={s.serialId}>{s.serialNo}</option>
                                    ))}
                                </select>
                            </div>
                        </>
                    ) : (
                        <>
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
                        </>
                    )}
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
