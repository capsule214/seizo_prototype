import { useState, useEffect, useCallback, useRef } from 'react';
import SpreadsheetGrid from './SpreadsheetGrid';
import DisplaySettingsDialog from './DisplaySettingsDialog';
import { apiFetch } from '../lib/api';
import GridNavBar from './GridNavBar';
import GridTabBar from './GridTabBar';
import GridTabPane from './GridTabPane';
import AlertToast from './AlertToast';

export default function SpreadsheetGridClient({ user, onLogout }) {
    const [tab, setTab] = useState('device');
    const [serials, setSerials] = useState([]);
    const [workers, setWorkers] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [locations, setLocations] = useState([]);
    const [displaySettings, setDisplaySettings] = useState({ selectedKisyuIds: [], selectedWorkerIds: [] });
    const [showSettings, setShowSettings] = useState(false);
    const [loading, setLoading] = useState(true);
    const [jumpTarget, setJumpTarget] = useState(null);
    const [alertMessage, setAlertMessage] = useState(null);

    // 各タブの現在の表示期間（SpreadsheetGrid から onRangeChange で随時更新）
    const deviceRangeRef = useRef(null);
    const workerRangeRef = useRef(null);

    // 各グリッドへの imperative ハンドル（保存・キャンセル用）
    const deviceGridRef   = useRef(null);
    const workerGridRef   = useRef(null);
    const locationGridRef = useRef(null);
    const [isDirty, setIsDirty] = useState(false);

    const locationRangeRef = useRef(null);
    const alertTimerRef = useRef(null);
    const prevTabRef = useRef('device');

    useEffect(() => {
        Promise.all([
            apiFetch('/serial').then(r => r.json()),
            apiFetch('/worker').then(r => r.json()),
            apiFetch('/task').then(r => r.json()),
            apiFetch('/display-settings').then(r => r.json()),
            apiFetch('/location').then(r => r.json()),
        ]).then(([s, w, t, ds, loc]) => {
            setSerials(s);
            setWorkers(w);
            setTasks(t);
            setDisplaySettings(ds);
            setLocations(loc);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    async function handleLogout() {
        await apiFetch('/logout', { method: 'POST' });
        onLogout();
    }

    function showAlert(msg) {
        setAlertMessage(msg);
        clearTimeout(alertTimerRef.current);
        alertTimerRef.current = setTimeout(() => setAlertMessage(null), 4000);
    }

    async function handleSave() {
        await Promise.all([
            deviceGridRef.current?.saveChanges(),
            workerGridRef.current?.saveChanges(),
            locationGridRef.current?.saveChanges(),
        ]);
        setIsDirty(false);
    }

    async function handleCancel() {
        await Promise.all([
            deviceGridRef.current?.cancelChanges(),
            workerGridRef.current?.cancelChanges(),
            locationGridRef.current?.cancelChanges(),
        ]);
        setIsDirty(false);
    }

    async function saveDisplaySettings(settings) {
        setDisplaySettings(settings);
        setShowSettings(false);
        await apiFetch('/display-settings', {
            method: 'PUT',
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
        serials, workers, tasks, locations, displaySettings,
        onJumpToOtherTab: handleJumpToOtherTab,
        onJumpHandled: handleJumpHandled,
        onJumpError: handleJumpError,
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            <GridNavBar
                onOpenSettings={() => setShowSettings(true)}
                userName={user?.name}
                onLogout={handleLogout}
            />
            <GridTabBar
                tab={tab}
                setTab={setTab}
                isDirty={isDirty}
                onSave={handleSave}
                onCancel={handleCancel}
            />

            {/* グリッド — 両タブ常時マウント。visibility で表示/非表示を切り替え */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                <GridTabPane active={tab === 'device'}>
                    <SpreadsheetGrid
                        {...gridProps}
                        ref={deviceGridRef}
                        mode="device"
                        jumpTarget={tab === 'device' ? jumpTarget : null}
                        onRangeChange={r => { deviceRangeRef.current = r; }}
                        onDirtyChange={dirty => setIsDirty(prev => dirty || prev)}
                    />
                </GridTabPane>

                <GridTabPane active={tab === 'worker'}>
                    <SpreadsheetGrid
                        {...gridProps}
                        ref={workerGridRef}
                        mode="worker"
                        jumpTarget={tab === 'worker' ? jumpTarget : null}
                        onRangeChange={r => { workerRangeRef.current = r; }}
                        onDirtyChange={dirty => setIsDirty(prev => dirty || prev)}
                    />
                </GridTabPane>

                <GridTabPane active={tab === 'location'}>
                    <SpreadsheetGrid
                        {...gridProps}
                        ref={locationGridRef}
                        mode="location"
                        jumpTarget={null}
                        onRangeChange={r => { locationRangeRef.current = r; }}
                        onDirtyChange={dirty => setIsDirty(prev => dirty || prev)}
                    />
                </GridTabPane>

                <AlertToast message={alertMessage} onClose={() => setAlertMessage(null)} />
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
