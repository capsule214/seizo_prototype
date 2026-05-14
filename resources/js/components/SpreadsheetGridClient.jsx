import { useState, useEffect, useCallback } from 'react';
import SpreadsheetGrid from './SpreadsheetGrid';
import DisplaySettingsDialog from './DisplaySettingsDialog';

export default function SpreadsheetGridClient() {
    const [tab, setTab] = useState('device');
    const [serials, setSerials] = useState([]);
    const [workers, setWorkers] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [displaySettings, setDisplaySettings] = useState({ selectedKisyuIds: [], selectedWorkerIds: [] });
    const [showSettings, setShowSettings] = useState(false);
    const [loading, setLoading] = useState(true);
    const [jumpTarget, setJumpTarget] = useState(null);

    useEffect(() => {
        Promise.all([
            fetch('/api/serial').then(r => r.json()),
            fetch('/api/worker').then(r => r.json()),
            fetch('/api/task').then(r => r.json()),
            fetch('/api/display-settings').then(r => r.json()),
        ]).then(([s, w, t, ds]) => {
            setSerials(s);
            setWorkers(w);
            setTasks(t);
            setDisplaySettings(ds);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    async function saveDisplaySettings(settings) {
        setDisplaySettings(settings);
        setShowSettings(false);
        await fetch('/api/display-settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings),
        });
    }

    const handleJumpToOtherTab = useCallback((plan, targetMode) => {
        setTab(targetMode);
        setJumpTarget({ plan, targetMode });
    }, []);

    const handleJumpHandled = useCallback(() => setJumpTarget(null), []);

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: 16, color: '#6b7280' }}>
                読み込み中...
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            {/* タブバー */}
            <div style={{ display: 'flex', alignItems: 'center', background: '#fff', borderBottom: '2px solid #e5e7eb', padding: '0 12px', flexShrink: 0 }}>
                {[['device', '装置'], ['worker', '担当者']].map(([key, label]) => (
                    <button
                        key={key}
                        onClick={() => setTab(key)}
                        style={{
                            padding: '8px 20px', border: 'none', background: 'none', cursor: 'pointer',
                            fontWeight: tab === key ? 700 : 400, fontSize: 14,
                            borderBottom: tab === key ? '2px solid #2563eb' : '2px solid transparent',
                            marginBottom: -2, color: tab === key ? '#2563eb' : '#374151',
                        }}
                    >{label}</button>
                ))}
                <div style={{ flex: 1 }} />
                <button
                    onClick={() => setShowSettings(true)}
                    style={{ padding: '6px 14px', border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 13 }}
                >表示設定</button>
            </div>

            {/* グリッド */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
                {tab === 'device' && (
                    <SpreadsheetGrid
                        key="device"
                        mode="device"
                        serials={serials}
                        workers={workers}
                        tasks={tasks}
                        displaySettings={displaySettings}
                        onJumpToOtherTab={handleJumpToOtherTab}
                        jumpTarget={tab === 'device' ? jumpTarget : null}
                        onJumpHandled={handleJumpHandled}
                    />
                )}
                {tab === 'worker' && (
                    <SpreadsheetGrid
                        key="worker"
                        mode="worker"
                        serials={serials}
                        workers={workers}
                        tasks={tasks}
                        displaySettings={displaySettings}
                        onJumpToOtherTab={handleJumpToOtherTab}
                        jumpTarget={tab === 'worker' ? jumpTarget : null}
                        onJumpHandled={handleJumpHandled}
                    />
                )}
            </div>

            {showSettings && (
                <DisplaySettingsDialog
                    serials={serials}
                    workers={workers}
                    settings={displaySettings}
                    onSave={saveDisplaySettings}
                    onClose={() => setShowSettings(false)}
                />
            )}
        </div>
    );
}
