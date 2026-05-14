import { useState, useEffect, useCallback, useRef } from 'react';
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
    const [alertMessage, setAlertMessage] = useState(null);

    // 各タブの現在の表示期間（SpreadsheetGrid から onRangeChange で随時更新）
    const deviceRangeRef = useRef(null);
    const workerRangeRef = useRef(null);

    const alertTimerRef = useRef(null);
    const prevTabRef = useRef('device');

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

    function showAlert(msg) {
        setAlertMessage(msg);
        clearTimeout(alertTimerRef.current);
        alertTimerRef.current = setTimeout(() => setAlertMessage(null), 4000);
    }

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
        const { selectedKisyuIds = [], selectedWorkerIds = [] } = displaySettings;

        // ① 表示設定チェック（機種 / 担当者が表示対象か）
        if (targetMode === 'device') {
            const serial = serials.find(s => s.serialId === plan.serialId);
            if (!serial) {
                showAlert('表示対象データがありませんでした');
                return;
            }
            if (selectedKisyuIds.length > 0 && !selectedKisyuIds.includes(String(serial.kisyuId))) {
                showAlert('表示対象データがありませんでした（表示設定で非表示の機種です）');
                return;
            }
        } else {
            const worker = workers.find(w => w.workerId === plan.workerId);
            if (!worker) {
                showAlert('表示対象データがありませんでした');
                return;
            }
            if (selectedWorkerIds.length > 0 && !selectedWorkerIds.includes(String(worker.workerId))) {
                showAlert('表示対象データがありませんでした（表示設定で非表示の担当者です）');
                return;
            }
        }

        // ② 表示期間チェック（遷移先タブの表示範囲内か）
        const targetRange = targetMode === 'device' ? deviceRangeRef.current : workerRangeRef.current;
        if (targetRange) {
            const planStart = plan.startDate.slice(0, 10);
            const planEnd   = plan.endDate.slice(0, 10);
            // 予定が遷移先の表示期間と重なるか（startDate <= planEnd かつ endDate >= planStart）
            if (planEnd < targetRange.startDate || planStart > targetRange.endDate) {
                showAlert('表示対象データがありませんでした（遷移先の表示期間外です）');
                return;
            }
        }

        prevTabRef.current = tab;
        setTab(targetMode);
        setJumpTarget({ plan, targetMode });
    }, [serials, workers, displaySettings, tab]);

    const handleJumpHandled = useCallback(() => setJumpTarget(null), []);

    const handleJumpError = useCallback(() => {
        setJumpTarget(null);
        setTab(prevTabRef.current);
        showAlert('表示対象データがありませんでした');
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: 16, color: '#6b7280' }}>
                読み込み中...
            </div>
        );
    }

    const gridProps = {
        serials, workers, tasks, displaySettings,
        onJumpToOtherTab: handleJumpToOtherTab,
        onJumpHandled: handleJumpHandled,
        onJumpError: handleJumpError,
    };

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

            {/* グリッド — 両タブ常時マウント。visibility で表示/非表示を切り替え */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                {/* 装置タブ */}
                <div style={{
                    position: 'absolute', inset: 0,
                    visibility: tab === 'device' ? 'visible' : 'hidden',
                    pointerEvents: tab === 'device' ? 'auto' : 'none',
                }}>
                    <SpreadsheetGrid
                        {...gridProps}
                        mode="device"
                        jumpTarget={tab === 'device' ? jumpTarget : null}
                        onRangeChange={r => { deviceRangeRef.current = r; }}
                    />
                </div>

                {/* 担当者タブ */}
                <div style={{
                    position: 'absolute', inset: 0,
                    visibility: tab === 'worker' ? 'visible' : 'hidden',
                    pointerEvents: tab === 'worker' ? 'auto' : 'none',
                }}>
                    <SpreadsheetGrid
                        {...gridProps}
                        mode="worker"
                        jumpTarget={tab === 'worker' ? jumpTarget : null}
                        onRangeChange={r => { workerRangeRef.current = r; }}
                    />
                </div>

                {/* エラーアラート */}
                {alertMessage && (
                    <div style={{
                        position: 'absolute', top: 12, right: 12, zIndex: 9999,
                        background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8,
                        padding: '10px 16px', fontSize: 13, color: '#b91c1c',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                        display: 'flex', alignItems: 'center', gap: 10, maxWidth: 360,
                    }}>
                        <span style={{ fontSize: 16 }}>⚠</span>
                        <span style={{ flex: 1 }}>{alertMessage}</span>
                        <button
                            onClick={() => setAlertMessage(null)}
                            style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 16, color: '#9ca3af', padding: 0 }}
                        >×</button>
                    </div>
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
