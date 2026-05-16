import { useState, useRef, useEffect } from 'react';
import VirtualList from './VirtualList';

export default function DisplaySettingsDialog({ serials, workers, settings, onSave, onClose }) {
    const [tab, setTab] = useState('kisyu');
    const [selectedKisyuIds, setSelectedKisyuIds] = useState(
        settings.selectedKisyuIds?.length ? settings.selectedKisyuIds.map(String) : []
    );
    const [selectedWorkerIds, setSelectedWorkerIds] = useState(
        settings.selectedWorkerIds?.length ? settings.selectedWorkerIds.map(String) : []
    );
    const [showLocationInDevice, setShowLocationInDevice] = useState(
        !!settings.showLocationInDevice
    );
    const [kisyuFilter, setKisyuFilter] = useState('');
    const [workerFilter, setWorkerFilter] = useState('');
    const [listHeight, setListHeight] = useState(300);
    const listContainerRef = useRef(null);

    useEffect(() => {
        const obs = new ResizeObserver(entries => {
            for (const e of entries) setListHeight(e.contentRect.height);
        });
        if (listContainerRef.current) obs.observe(listContainerRef.current);
        return () => obs.disconnect();
    }, []);

    const kisyuGroups = serials.reduce((acc, s) => {
        const k = String(s.kisyuId);
        if (!acc[k]) acc[k] = { kisyuId: k, kisyuName: s.kisyuName, count: 0 };
        acc[k].count++;
        return acc;
    }, {});
    const kisyuList = Object.values(kisyuGroups).filter(k => k.kisyuName.includes(kisyuFilter));

    const workerList = workers.filter(w => w.workerName.includes(workerFilter));

    function toggleKisyu(id) {
        const sid = String(id);
        setSelectedKisyuIds(prev =>
            prev.includes(sid) ? prev.filter(x => x !== sid) : [...prev, sid]
        );
    }

    function toggleWorker(id) {
        const sid = String(id);
        setSelectedWorkerIds(prev =>
            prev.includes(sid) ? prev.filter(x => x !== sid) : [...prev, sid]
        );
    }

    function handleSave() {
        onSave({ selectedKisyuIds, selectedWorkerIds, showLocationInDevice });
    }

    return (
        <div
            style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div style={{ background: '#fff', borderRadius: 10, padding: 24, width: 440, maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
                <h2 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>表示設定</h2>
                <div style={{ display: 'flex', gap: 0, marginBottom: 8, borderBottom: '2px solid #e5e7eb' }}>
                    {[['kisyu', '機種'], ['worker', '担当者']].map(([key, label]) => (
                        <button
                            key={key}
                            onClick={() => setTab(key)}
                            style={{
                                padding: '6px 16px', border: 'none', background: 'none', cursor: 'pointer',
                                fontWeight: tab === key ? 700 : 400, fontSize: 13,
                                borderBottom: tab === key ? '2px solid #2563eb' : '2px solid transparent',
                                marginBottom: -2, color: tab === key ? '#2563eb' : '#374151',
                            }}
                        >{label}</button>
                    ))}
                </div>

                {tab === 'kisyu' && (
                    <>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, cursor: 'pointer', userSelect: 'none' }}>
                            <input
                                type="checkbox"
                                checked={showLocationInDevice}
                                onChange={e => setShowLocationInDevice(e.target.checked)}
                            />
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#1d4ed8' }}>場所予定も表示</span>
                            <span style={{ fontSize: 11, color: '#6b7280' }}>（装置タブの各装置下端に場所予定行を追加）</span>
                        </label>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                            <input
                                placeholder="機種名で絞り込み"
                                value={kisyuFilter}
                                onChange={e => setKisyuFilter(e.target.value)}
                                style={{ flex: 1, padding: '5px 8px', border: '1px solid #d1d5db', borderRadius: 5, fontSize: 13 }}
                            />
                            <button onClick={() => setSelectedKisyuIds(kisyuList.map(k => k.kisyuId))} style={{ fontSize: 12, padding: '4px 10px', border: '1px solid #d1d5db', borderRadius: 4, cursor: 'pointer', background: '#f9fafb' }}>全選択</button>
                            <button onClick={() => setSelectedKisyuIds([])} style={{ fontSize: 12, padding: '4px 10px', border: '1px solid #d1d5db', borderRadius: 4, cursor: 'pointer', background: '#f9fafb' }}>全解除</button>
                        </div>
                        <div ref={listContainerRef} style={{ flex: 1, minHeight: 200 }}>
                            <VirtualList
                                items={kisyuList.map(k => ({ ...k, id: k.kisyuId }))}
                                height={listHeight || 300}
                                renderItem={item => (
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px', cursor: 'pointer', height: 36 }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedKisyuIds.includes(item.kisyuId)}
                                            onChange={() => toggleKisyu(item.kisyuId)}
                                        />
                                        <span style={{ fontSize: 13, flex: 1 }}>{item.kisyuName}</span>
                                        <span style={{ fontSize: 11, color: '#9ca3af' }}>{item.count}台</span>
                                    </label>
                                )}
                            />
                        </div>
                    </>
                )}

                {tab === 'worker' && (
                    <>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                            <input
                                placeholder="担当者名で絞り込み"
                                value={workerFilter}
                                onChange={e => setWorkerFilter(e.target.value)}
                                style={{ flex: 1, padding: '5px 8px', border: '1px solid #d1d5db', borderRadius: 5, fontSize: 13 }}
                            />
                            <button onClick={() => setSelectedWorkerIds(workerList.map(w => String(w.workerId)))} style={{ fontSize: 12, padding: '4px 10px', border: '1px solid #d1d5db', borderRadius: 4, cursor: 'pointer', background: '#f9fafb' }}>全選択</button>
                            <button onClick={() => setSelectedWorkerIds([])} style={{ fontSize: 12, padding: '4px 10px', border: '1px solid #d1d5db', borderRadius: 4, cursor: 'pointer', background: '#f9fafb' }}>全解除</button>
                        </div>
                        <div ref={listContainerRef} style={{ flex: 1, minHeight: 200 }}>
                            <VirtualList
                                items={workerList.map(w => ({ ...w, id: w.workerId }))}
                                height={listHeight || 300}
                                renderItem={item => (
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px', cursor: 'pointer', height: 36 }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedWorkerIds.includes(String(item.workerId))}
                                            onChange={() => toggleWorker(item.workerId)}
                                        />
                                        <span style={{ fontSize: 13 }}>{item.workerName}</span>
                                        {item.teamName && <span style={{ fontSize: 11, color: '#9ca3af' }}>{item.teamName}</span>}
                                    </label>
                                )}
                            />
                        </div>
                    </>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16, paddingTop: 12, borderTop: '1px solid #e5e7eb' }}>
                    <button onClick={onClose} style={{ padding: '7px 18px', border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 13 }}>キャンセル</button>
                    <button onClick={handleSave} style={{ padding: '7px 18px', border: 'none', borderRadius: 6, background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>保存</button>
                </div>
            </div>
        </div>
    );
}
