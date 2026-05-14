import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { getDateType } from '../lib/holidays';
import { getColor } from '../lib/colors';
import ContextMenu from './ContextMenu';
import BarTooltip from './BarTooltip';
import ScheduleDialog from './ScheduleDialog';

const CELL_SIZE = 20;
const HDR_H = 20;
const TOTAL_HDR_H = HDR_H * 4;
const MIN_ROWS = 3;
const BUFFER_ROWS = 12;
const DEV_HDR_W = 202;
const ASGN_HDR_W = 80;
const SLOT_COUNT = 6;
const HANDLE_W = 5;

const SLOT_HOURS = [8, 10, 13, 15, 17, 19];
const SLOT_END_HOURS = [10, 12, 15, 17, 19, 21];
const SLOT_LABELS = ['AM1', 'AM2', 'PM1', 'PM2', '残業1', '残業2'];

const TODAY_STR = new Date().toISOString().slice(0, 10);

function parseApiDate(s) {
    if (!s) return null;
    return s.includes('T') ? new Date(s) : new Date(s + 'T00:00:00');
}

function dateToStr(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function addDays(dateStr, n) {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + n);
    return dateToStr(d);
}

function daysBetween(a, b) {
    const da = new Date(a + 'T00:00:00');
    const db = new Date(b + 'T00:00:00');
    return Math.round((db - da) / 86400000);
}

function getWeekNumber(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const jan1 = new Date(d.getFullYear(), 0, 1);
    const diff = Math.floor((d - jan1) / 86400000);
    return Math.ceil((diff + jan1.getDay() + 1) / 7);
}

function colToDateStr(startDate, col, viewMode) {
    if (viewMode === 'day') {
        return addDays(startDate, col);
    } else {
        return addDays(startDate, Math.floor(col / SLOT_COUNT));
    }
}

function dateToCol(startDate, dateStr, viewMode, hour = 8) {
    const days = daysBetween(startDate, dateStr.slice(0, 10));
    if (viewMode === 'day') return days;
    const slotIdx = SLOT_HOURS.findIndex(h => h === hour);
    return days * SLOT_COUNT + Math.max(0, slotIdx);
}

function planToStartCol(plan, startDate, viewMode) {
    const d = parseApiDate(plan.startDate);
    if (!d) return 0;
    const dateStr = dateToStr(d);
    const h = d.getHours();
    return dateToCol(startDate, dateStr, viewMode, h);
}

function planToEndCol(plan, startDate, viewMode) {
    const d = parseApiDate(plan.endDate);
    if (!d) return 0;
    const dateStr = dateToStr(d);
    const h = d.getHours();
    if (viewMode === 'day') {
        return dateToCol(startDate, dateStr, viewMode, h);
    } else {
        const endSlot = SLOT_END_HOURS.findIndex(eh => eh === h);
        const days = daysBetween(startDate, dateStr);
        return days * SLOT_COUNT + Math.max(0, endSlot);
    }
}

function colToDateTime(startDate, col, type, viewMode) {
    if (viewMode === 'day') {
        const dateStr = addDays(startDate, col);
        return dateStr + 'T08:00:00';
    } else {
        const dayIdx = Math.floor(col / SLOT_COUNT);
        const slotIdx = col % SLOT_COUNT;
        const dateStr = addDays(startDate, dayIdx);
        if (type === 'start') {
            return `${dateStr}T${String(SLOT_HOURS[slotIdx]).padStart(2,'0')}:00:00`;
        } else {
            return `${dateStr}T${String(SLOT_END_HOURS[slotIdx]).padStart(2,'0')}:00:00`;
        }
    }
}

function layoutPlans(plans, groupKey, groups, viewMode, startDate) {
    const groupMap = {};
    for (const g of groups) {
        groupMap[g.id] = { ...g, rows: Array.from({ length: MIN_ROWS }, () => null), plans: [] };
    }

    const sorted = [...plans].sort((a, b) => {
        const as = parseApiDate(a.startDate), bs = parseApiDate(b.startDate);
        return as - bs;
    });

    for (const plan of sorted) {
        const gid = groupKey === 'device' ? plan.serialId : plan.workerId;
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

    let startRow = 0;
    const result = [];
    for (const g of groups) {
        const grp = groupMap[g.id];
        if (!grp) { result.push({ ...g, startRow, numRows: MIN_ROWS, plans: [] }); startRow += MIN_ROWS; continue; }
        const numRows = Math.max(MIN_ROWS, grp.rows.length);
        result.push({ ...grp, startRow, numRows });
        startRow += numRows;
    }
    return { groups: result, totalRows: startRow };
}

function computeGaps(fetchedRanges, from, to) {
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

export default function SpreadsheetGrid({
    mode, serials, workers, tasks, displaySettings,
    onJumpToOtherTab, jumpTarget, onJumpHandled, onJumpError,
    onRangeChange,
}) {
    const today = new Date();
    const [startDate, setStartDate] = useState(() => {
        const d = new Date(today.getFullYear(), today.getMonth(), 1);
        return dateToStr(d);
    });
    const [displayMonths, setDisplayMonths] = useState(4);
    const [deviceCount, setDeviceCount] = useState(1000);
    const [viewMode, setViewMode] = useState('day');
    const [plans, setPlans] = useState([]);
    const [contextMenu, setContextMenu] = useState(null);
    const [tooltip, setTooltip] = useState(null);
    const [scheduleDialog, setScheduleDialog] = useState(null);
    const [selected, setSelected] = useState(new Set());
    const [selectedCell, setSelectedCell] = useState(null);
    const [copied, setCopied] = useState([]);
    const [sonar, setSonar] = useState(null);

    const fetchedRangesRef = useRef([]);
    const containerRef = useRef(null);
    const scrollRef = useRef(null);
    const [scrollTop, setScrollTop] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [containerH, setContainerH] = useState(600);
    const [containerW, setContainerW] = useState(1200);

    const dragRef = useRef(null);
    const [rectSelect, setRectSelect] = useState(null); // {absX1,absY1,absX2,absY2} in content coords
    const suppressNextCellClickRef = useRef(false);
    const layoutGroupsRef = useRef([]);
    const jumpAttemptsRef = useRef(0);
    const prevJumpTargetRef = useRef(null);

    const leftHdrW = mode === 'device' ? DEV_HDR_W : ASGN_HDR_W;

    const endDate = useMemo(() => addDays(startDate, displayMonths * 30), [startDate, displayMonths]);

    // 表示範囲を親へ通知（ジャンプ前チェックに使用）
    useEffect(() => {
        onRangeChange?.({ startDate, endDate });
    }, [startDate, endDate]);

    const totalCols = useMemo(() => {
        const days = daysBetween(startDate, endDate);
        return viewMode === 'day' ? days : days * SLOT_COUNT;
    }, [startDate, endDate, viewMode]);

    const filteredGroups = useMemo(() => {
        const { selectedKisyuIds = [], selectedWorkerIds = [] } = displaySettings;
        if (mode === 'device') {
            let s = serials;
            if (selectedKisyuIds.length > 0) {
                s = s.filter(ser => selectedKisyuIds.includes(String(ser.kisyuId)));
            }
            s = [...s].sort((a, b) => {
                if (a.sortNo !== b.sortNo) return a.sortNo - b.sortNo;
                return a.serialNo.localeCompare(b.serialNo, 'ja', { numeric: true });
            });
            return s.slice(0, deviceCount).map(ser => ({
                id: ser.serialId,
                label1: ser.kisyuName,
                label2: ser.serialNo,
                kisyuId: ser.kisyuId,
            }));
        } else {
            let w = workers;
            if (selectedWorkerIds.length > 0) {
                w = w.filter(wr => selectedWorkerIds.includes(String(wr.workerId)));
            }
            return w.map(wr => ({ id: wr.workerId, label1: wr.workerName, label2: '', teamName: wr.teamName }));
        }
    }, [mode, serials, workers, displaySettings, deviceCount]);

    const { groups: layoutGroups, totalRows } = useMemo(() => {
        const groupKey = mode === 'device' ? 'device' : 'worker';
        return layoutPlans(plans.filter(p => !p.deleted), groupKey, filteredGroups, viewMode, startDate);
    }, [plans, filteredGroups, mode, viewMode, startDate]);

    // 矩形選択のクロージャ内から常に最新レイアウトを参照できるようにする
    layoutGroupsRef.current = layoutGroups;

    const totalH = totalRows * CELL_SIZE;
    const colW = CELL_SIZE;

    useEffect(() => {
        const obs = new ResizeObserver(entries => {
            for (const e of entries) {
                setContainerH(e.contentRect.height);
                setContainerW(e.contentRect.width);
            }
        });
        if (containerRef.current) obs.observe(containerRef.current);
        return () => obs.disconnect();
    }, []);

    async function fetchPlans(from, to) {
        const gaps = computeGaps(fetchedRangesRef.current, from, to);
        for (const gap of gaps) {
            try {
                const res = await fetch(`/api/plan?from=${gap.from}&to=${gap.to}`);
                const data = await res.json();
                setPlans(prev => {
                    const existingIds = new Set(prev.map(p => p.planId));
                    const newPlans = data.filter(p => !existingIds.has(p.planId));
                    return [...prev, ...newPlans];
                });
                fetchedRangesRef.current.push(gap);
            } catch (e) {
                console.error('fetchPlans error', e);
            }
        }
    }

    useEffect(() => {
        fetchPlans(startDate, endDate);
    }, [startDate, endDate]);

    useEffect(() => {
        if (!scrollRef.current) return;
        const today = TODAY_STR;
        const col = dateToCol(startDate, today, viewMode, 8);
        const x = col * colW - containerW / 2 + leftHdrW;
        scrollRef.current.scrollLeft = Math.max(0, x);
    }, []);

    const onScroll = useCallback(e => {
        setScrollTop(e.currentTarget.scrollTop);
        setScrollLeft(e.currentTarget.scrollLeft);
        const visibleFrom = colToDateStr(startDate, Math.floor(e.currentTarget.scrollLeft / colW), viewMode);
        const visibleTo = colToDateStr(startDate, Math.ceil((e.currentTarget.scrollLeft + containerW) / colW), viewMode);
        if (visibleFrom >= startDate && visibleTo <= endDate) {
            fetchPlans(visibleFrom, visibleTo);
        }
    }, [startDate, endDate, colW, containerW, viewMode]);

    const visRowStart = Math.max(0, Math.floor(scrollTop / CELL_SIZE) - BUFFER_ROWS);
    const visRowEnd   = Math.min(totalRows - 1, Math.ceil((scrollTop + containerH) / CELL_SIZE) + BUFFER_ROWS);
    const visColStart = Math.max(0, Math.floor(scrollLeft / colW) - 2);
    const visColEnd   = Math.min(totalCols - 1, Math.ceil((scrollLeft + containerW) / colW) + 2);

    function getGroupAtRow(rowIdx) {
        for (const g of layoutGroups) {
            if (rowIdx >= g.startRow && rowIdx < g.startRow + g.numRows) return g;
        }
        return null;
    }

    function getGroupAtY(y) {
        const row = Math.floor(y / CELL_SIZE);
        return getGroupAtRow(row);
    }

    function getPlanBar(plan) {
        const startCol = planToStartCol(plan, startDate, viewMode);
        const endCol = planToEndCol(plan, startDate, viewMode);
        const g = layoutGroups.find(g => g.plans?.some(p => p.planId === plan.planId));
        if (!g) return null;
        const pp = g.plans.find(p => p.planId === plan.planId);
        if (!pp) return null;
        return { startCol, endCol, rowIdx: pp.rowIdx, groupStartRow: g.startRow };
    }

    function handleContentPointerDown(e) {
        if (e.button !== 0) return;
        const scrollEl = scrollRef.current;
        const scrollRect = scrollEl.getBoundingClientRect();

        // ヘッダー領域（sticky部分）のクリックは無視
        if (e.clientY < scrollRect.top + TOTAL_HDR_H) return;

        const startCX = e.clientX;
        const startCY = e.clientY;

        // クライアント座標 → セルコンテンツ内の絶対座標
        const toAbs = (cx, cy) => ({
            x: cx - scrollRect.left + scrollEl.scrollLeft,
            y: cy - scrollRect.top - TOTAL_HDR_H + scrollEl.scrollTop,
        });

        let dragging = false;
        let lastCX = startCX;
        let lastCY = startCY;

        const onMove = (e2) => {
            const dx = e2.clientX - startCX;
            const dy = e2.clientY - startCY;
            if (!dragging && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
                dragging = true;
            }
            lastCX = e2.clientX;
            lastCY = e2.clientY;
            if (dragging) {
                const s = toAbs(startCX, startCY);
                const en = toAbs(e2.clientX, e2.clientY);
                setRectSelect({ x1: s.x, y1: s.y, x2: en.x, y2: en.y });
            }
        };

        const onUp = () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            if (!dragging) { setRectSelect(null); return; }

            // 次の click イベント（セルの onClick）を抑制
            suppressNextCellClickRef.current = true;
            setTimeout(() => { suppressNextCellClickRef.current = false; }, 0);

            const s = toAbs(startCX, startCY);
            const en = toAbs(lastCX, lastCY);
            const selX1 = Math.min(s.x, en.x);
            const selX2 = Math.max(s.x, en.x);
            const selY1 = Math.min(s.y, en.y);
            const selY2 = Math.max(s.y, en.y);

            const newSelected = new Set();
            for (const g of layoutGroupsRef.current) {
                if (!g.plans) continue;
                for (const p of g.plans) {
                    const sc = planToStartCol(p, startDate, viewMode);
                    const ec = planToEndCol(p, startDate, viewMode);
                    const absRow = g.startRow + p.rowIdx;
                    const bx1 = sc * colW;
                    const bx2 = (ec + 1) * colW;
                    const by1 = absRow * CELL_SIZE;
                    const by2 = (absRow + 1) * CELL_SIZE;
                    if (bx1 < selX2 && bx2 > selX1 && by1 < selY2 && by2 > selY1) {
                        newSelected.add(p.planId);
                    }
                }
            }

            setSelected(newSelected);
            setSelectedCell(null);
            setRectSelect(null);
        };

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
    }

    function handleBarPointerDown(e, plan, type) {
        e.stopPropagation();
        if (e.button !== 0) return;

        // 選択処理を pointerdown で行う（preventDefault を外したので click も生きるが、こちらで完結させる）
        setSelectedCell(null);
        if (e.ctrlKey || e.metaKey) {
            setSelected(prev => {
                const s = new Set(prev);
                s.has(plan.planId) ? s.delete(plan.planId) : s.add(plan.planId);
                return s;
            });
        } else {
            // 既に複数選択に含まれている場合はそのままにしてドラッグできるようにする
            setSelected(prev => prev.has(plan.planId) ? prev : new Set([plan.planId]));
        }

        const bar = getPlanBar(plan);
        if (!bar) return;

        const startX = e.clientX;
        const startY = e.clientY;

        // selectedRef を使ってポインターキャプチャ後も最新の選択状態を参照できるようにする
        const capturedSelected = selected.has(plan.planId) ? selected : new Set([plan.planId]);
        const dragPlans = [...capturedSelected].map(id => plans.find(p => p.planId === id)).filter(Boolean);
        if (!dragPlans.some(p => p.planId === plan.planId)) dragPlans.push(plan);

        dragRef.current = {
            type,
            plan,
            dragPlans,
            startX, startY,
            deltaCol: 0, deltaRow: 0,
            active: false,
        };

        const onMove = (e2) => {
            if (!dragRef.current) return;
            const dx = e2.clientX - startX;
            const dy = e2.clientY - startY;
            const dc = Math.round(dx / colW);
            const dr = Math.round(dy / CELL_SIZE);
            if (!dragRef.current.active && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
                dragRef.current.active = true;
            }
            dragRef.current.deltaCol = dc;
            dragRef.current.deltaRow = dr;
            containerRef.current && (containerRef.current._dragState = { ...dragRef.current });
            containerRef.current?.dispatchEvent(new CustomEvent('dragupdate'));
        };

        const onUp = async () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            if (!dragRef.current || !dragRef.current.active) { dragRef.current = null; return; }
            await commitDrag(dragRef.current);
            dragRef.current = null;
            setGhostDrag(null);
        };

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
    }

    async function commitDrag(drag) {
        const { type, plan, dragPlans, deltaCol, deltaRow, initStartCol, initEndCol, initGroupStartRow } = drag;

        for (const dp of dragPlans) {
            const dpBar = getPlanBar(dp);
            if (!dpBar) continue;

            let newStartCol = dpBar.startCol;
            let newEndCol = dpBar.endCol;

            if (type === 'move') {
                newStartCol = dpBar.startCol + deltaCol;
                newEndCol = dpBar.endCol + deltaCol;
            } else if (type === 'resize-left') {
                newStartCol = Math.min(dpBar.endCol, dpBar.startCol + deltaCol);
            } else {
                newEndCol = Math.max(dpBar.startCol, dpBar.endCol + deltaCol);
            }

            newStartCol = Math.max(0, Math.min(newStartCol, totalCols - 1));
            newEndCol = Math.max(newStartCol, Math.min(newEndCol, totalCols - 1));

            const newStartDate = colToDateTime(startDate, newStartCol, 'start', viewMode);
            const newEndDate = colToDateTime(startDate, newEndCol, 'end', viewMode);

            let newSerialId = dp.serialId;
            let newWorkerId = dp.workerId;

            if (type === 'move' && deltaRow !== 0) {
                const newAbsRow = dpBar.groupStartRow + dpBar.rowIdx + deltaRow;
                const newGroup = getGroupAtRow(newAbsRow);
                if (newGroup) {
                    if (mode === 'device') newSerialId = newGroup.id;
                    else newWorkerId = newGroup.id;
                }
            }

            try {
                const res = await fetch(`/api/plan/${dp.planId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        serialId: newSerialId,
                        taskId: dp.taskId,
                        workerId: newWorkerId,
                        startDate: newStartDate,
                        endDate: newEndDate,
                    }),
                });
                const updated = await res.json();
                setPlans(prev => prev.map(p => p.planId === dp.planId ? { ...p, ...updated } : p));
            } catch (err) {
                console.error('commitDrag error', err);
            }
        }
    }

    const [ghostDrag, setGhostDrag] = useState(null);

    useEffect(() => {
        const handler = () => {
            if (containerRef.current?._dragState) {
                setGhostDrag({ ...containerRef.current._dragState });
            }
        };
        containerRef.current?.addEventListener('dragupdate', handler);
        return () => containerRef.current?.removeEventListener('dragupdate', handler);
    }, []);

    function handleCellRightClick(e, col, row) {
        e.preventDefault();
        const g = getGroupAtRow(row);
        const colDate = colToDateStr(startDate, col, viewMode);
        const items = [
            {
                label: '予定を追加',
                onClick: () => {
                    const dateStr = colToDateTime(startDate, col, 'start', viewMode);
                    const endStr = colToDateTime(startDate, col + (viewMode === 'slot' ? 5 : 0), 'end', viewMode);
                    setScheduleDialog({
                        plan: null,
                        initialData: {
                            serialId: mode === 'device' ? g?.id : null,
                            workerId: mode === 'worker' ? g?.id : null,
                            startDate: dateStr,
                            endDate: endStr,
                        }
                    });
                }
            },
            ...(copied.length > 0 ? [{
                label: `貼り付け（${copied.length}件）`,
                onClick: () => pastePlans(col),
            }] : []),
        ];
        setContextMenu({ x: e.clientX, y: e.clientY, items });
    }

    function handleBarRightClick(e, plan) {
        e.preventDefault();
        e.stopPropagation();
        const isMulti = selected.size > 1 && selected.has(plan.planId);
        const n = isMulti ? selected.size : 1;
        const items = [
            { label: '詳細', onClick: () => setTooltip({ plan, x: e.clientX, y: e.clientY }) },
            { label: '編集', onClick: () => setScheduleDialog({ plan }) },
            { label: isMulti ? `${n}件コピー` : 'コピー', onClick: () => {
                const toCopy = isMulti ? [...selected].map(id => plans.find(p => p.planId === id)).filter(Boolean) : [plan];
                setCopied(toCopy);
            }},
            'separator',
            { label: isMulti ? `${n}件削除` : '削除', danger: true, onClick: () => {
                const toDelete = isMulti ? [...selected] : [plan.planId];
                deletePlans(toDelete);
            }},
            'separator',
            {
                label: mode === 'device' ? '担当者予定を表示' : '装置予定を表示',
                onClick: () => onJumpToOtherTab && onJumpToOtherTab(plan, mode === 'device' ? 'worker' : 'device'),
            },
        ];
        setContextMenu({ x: e.clientX, y: e.clientY, items });
    }

    async function deletePlans(ids) {
        try {
            await fetch('/api/plan', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: ids.map(String) }),
            });
            setPlans(prev => prev.filter(p => !ids.includes(p.planId)));
            setSelected(prev => { const s = new Set(prev); ids.forEach(id => s.delete(id)); return s; });
        } catch (err) {
            console.error('deletePlans error', err);
        }
    }

    async function pastePlans(targetCol) {
        if (!copied.length) return;
        const firstStartCol = planToStartCol(copied[0], startDate, viewMode);
        const offset = targetCol - firstStartCol;
        for (const p of copied) {
            const sc = planToStartCol(p, startDate, viewMode) + offset;
            const ec = planToEndCol(p, startDate, viewMode) + offset;
            const newStart = colToDateTime(startDate, Math.max(0, sc), 'start', viewMode);
            const newEnd = colToDateTime(startDate, Math.max(0, ec), 'end', viewMode);
            try {
                const res = await fetch('/api/plan', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ serialId: p.serialId, taskId: p.taskId, workerId: p.workerId, startDate: newStart, endDate: newEnd }),
                });
                const newPlan = await res.json();
                setPlans(prev => [...prev, newPlan]);
            } catch (err) {
                console.error('pastePlans error', err);
            }
        }
    }

    async function savePlan(data) {
        const dialog = scheduleDialog;
        setScheduleDialog(null);
        const payload = {
            serialId: data.serialId || (mode === 'device' ? dialog.initialData?.serialId : serials[0]?.serialId),
            taskId: data.taskId,
            workerId: data.workerId,
            startDate: data.startDate,
            endDate: data.endDate,
        };
        if (dialog.plan) {
            const res = await fetch(`/api/plan/${dialog.plan.planId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const updated = await res.json();
            setPlans(prev => prev.map(p => p.planId === dialog.plan.planId ? { ...p, ...updated } : p));
        } else {
            const res = await fetch('/api/plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const newPlan = await res.json();
            setPlans(prev => [...prev, newPlan]);
        }
    }

    useEffect(() => {
        const handleKey = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
                const sel = [...selected].map(id => plans.find(p => p.planId === id)).filter(Boolean);
                if (sel.length) setCopied(sel);
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
                if (copied.length) {
                    const col = Math.floor(scrollLeft / colW);
                    pastePlans(col);
                }
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [selected, plans, copied, scrollLeft, colW]);

    useEffect(() => {
        if (!jumpTarget) {
            jumpAttemptsRef.current = 0;
            prevJumpTargetRef.current = null;
            return;
        }
        const { plan, targetMode } = jumpTarget;
        if (targetMode !== mode) return;

        // jumpTarget が切り替わったら試行カウントをリセット
        if (jumpTarget !== prevJumpTargetRef.current) {
            jumpAttemptsRef.current = 0;
            prevJumpTargetRef.current = jumpTarget;
        }

        // planId で直接検索
        let targetGroup = null;
        let targetPlanRow = null;
        for (const g of layoutGroups) {
            const pp = g.plans?.find(p => p.planId === plan.planId);
            if (pp) { targetGroup = g; targetPlanRow = pp; break; }
        }

        if (!targetGroup) {
            jumpAttemptsRef.current += 1;
            // 2回目以降（初回フェッチ完了後）も見つからなければエラー
            if (jumpAttemptsRef.current >= 2) {
                onJumpError?.();
                onJumpHandled?.();
                jumpAttemptsRef.current = 0;
            }
            return;
        }

        jumpAttemptsRef.current = 0;

        const col = planToStartCol(plan, startDate, viewMode);
        const absRow = targetGroup.startRow + targetPlanRow.rowIdx;

        // バーを画面中央に来るようにスクロール
        const newScrollLeft = Math.max(0, col * colW - (containerW - leftHdrW) / 2);
        const newScrollTop  = Math.max(0, absRow * CELL_SIZE - (containerH - TOTAL_HDR_H) / 2);

        // 書き込み後に実際の値を読み返す（コンテンツ末尾付近でクランプされる場合がある）
        let actualScrollLeft = newScrollLeft;
        let actualScrollTop  = newScrollTop;
        if (scrollRef.current) {
            scrollRef.current.scrollLeft = newScrollLeft;
            scrollRef.current.scrollTop  = newScrollTop;
            actualScrollLeft = scrollRef.current.scrollLeft;
            actualScrollTop  = scrollRef.current.scrollTop;
        }

        // ソナー位置はクランプ後の実際のスクロール値で算出
        const barX = col * colW - actualScrollLeft + leftHdrW + colW / 2;
        const barY = absRow * CELL_SIZE - actualScrollTop + TOTAL_HDR_H + CELL_SIZE / 2;

        setSonar({ x: barX, y: barY, key: Date.now() });
        setTimeout(() => setSonar(null), 2200);
        onJumpHandled?.();
    }, [jumpTarget, layoutGroups]);

    async function handleSeedApply() {
        fetchedRangesRef.current = [];
        setPlans([]);
        await fetch('/api/seed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ count: deviceCount, baseDate: startDate, months: displayMonths }),
        });
        await fetchPlans(startDate, endDate);
    }

    const dateColumns = useMemo(() => {
        const cols = [];
        const days = daysBetween(startDate, endDate);
        for (let d = 0; d < days; d++) {
            const ds = addDays(startDate, d);
            const dt = new Date(ds + 'T00:00:00');
            cols.push({ dateStr: ds, day: dt.getDate(), dow: dt.getDay(), month: dt.getMonth() + 1, year: dt.getFullYear(), week: getWeekNumber(ds), type: getDateType(ds) });
        }
        return cols;
    }, [startDate, endDate]);

    function getColBg(col) {
        const dayIdx = viewMode === 'day' ? col : Math.floor(col / SLOT_COUNT);
        const dc = dateColumns[dayIdx];
        if (!dc) return '#f9fafb';
        return (dc.type === 'holiday' || dc.type === 'sunday' || dc.type === 'saturday') ? '#e5e7eb' : '#f9fafb';
    }

    function renderHeaders() {
        const rows = [];
        const dayW = viewMode === 'day' ? colW : colW * SLOT_COUNT;

        let yearSpans = [];
        let monthSpans = [];
        let weekSpans = [];

        let curYear = null, curMonth = null, curWeek = null;
        let yearStart = 0, monthStart = 0, weekStart = 0;

        for (let d = 0; d < dateColumns.length; d++) {
            const dc = dateColumns[d];
            const x = d * dayW;
            if (dc.year !== curYear) {
                if (curYear !== null) yearSpans.push({ year: curYear, x: yearStart * dayW, w: (d - yearStart) * dayW });
                curYear = dc.year; yearStart = d;
            }
            if (dc.month !== curMonth || dc.year !== (dateColumns[d-1]?.year)) {
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

        const commonStyle = { position: 'absolute', height: HDR_H, borderRight: '1px solid #d1d5db', borderBottom: '1px solid #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, overflow: 'hidden', background: '#f3f4f6', boxSizing: 'border-box' };

        return [
            yearSpans.filter(s => s.x + s.w > scrollLeft && s.x < scrollLeft + containerW).map(s => (
                <div key={`y${s.year}`} style={{ ...commonStyle, left: s.x, width: s.w, top: 0 }}>{s.year}年</div>
            )),
            monthSpans.filter(s => s.x + s.w > scrollLeft && s.x < scrollLeft + containerW).map(s => (
                <div key={`m${s.x}`} style={{ ...commonStyle, left: s.x, width: s.w, top: HDR_H }}>{s.month}月</div>
            )),
            weekSpans.filter(s => s.x + s.w > scrollLeft && s.x < scrollLeft + containerW).map(s => (
                <div key={`w${s.x}`} style={{ ...commonStyle, left: s.x, width: s.w, top: HDR_H * 2 }}>第{s.week}週</div>
            )),
            dateColumns.filter((_, i) => {
                const x = i * dayW;
                return x + dayW > scrollLeft && x < scrollLeft + containerW;
            }).map((dc, i) => {
                const dayIdx = dateColumns.indexOf(dc);
                const x = dayIdx * dayW;
                const isToday = dc.dateStr === TODAY_STR;
                let color = '#374151', bg = '#f3f4f6';
                if (dc.type === 'sunday' || dc.type === 'holiday') color = '#ef4444';
                if (dc.type === 'saturday') color = '#3b82f6';
                if (isToday) { bg = '#ef4444'; color = '#fff'; }
                if (viewMode === 'day') {
                    return (
                        <div key={dc.dateStr} style={{ ...commonStyle, left: x, width: dayW, top: HDR_H * 3, background: bg, color }}>
                            {dc.day}
                        </div>
                    );
                } else {
                    return SLOT_LABELS.map((label, si) => (
                        <div key={`${dc.dateStr}-${si}`} style={{ ...commonStyle, left: x + si * colW, width: colW, top: HDR_H * 3, background: si === 0 ? bg : '#f3f4f6', color: si === 0 ? color : '#374151', fontSize: 9 }}>
                            {si === 0 ? dc.day : label}
                        </div>
                    ));
                }
            }),
        ];
    }

    function renderCells() {
        const cells = [];
        for (let col = visColStart; col <= visColEnd; col++) {
            const x = col * colW;
            const baseBg = getColBg(col);
            for (let row = visRowStart; row <= visRowEnd; row++) {
                const y = row * CELL_SIZE;
                const isSel = selectedCell && selectedCell.col === col && selectedCell.row === row;
                cells.push(
                    <div
                        key={`c${col}-${row}`}
                        style={{
                            position: 'absolute', left: x, top: y, width: colW, height: CELL_SIZE,
                            background: isSel ? '#bfdbfe' : baseBg,
                            borderRight: '1px solid #e5e7eb',
                            borderBottom: '1px solid #e5e7eb',
                            outline: isSel ? '2px solid #2563eb' : 'none',
                            outlineOffset: '-1px',
                            zIndex: isSel ? 3 : 0,
                            boxSizing: 'border-box',
                            cursor: 'cell',
                        }}
                        onClick={e => {
                            if (suppressNextCellClickRef.current) return;
                            e.stopPropagation();
                            setSelectedCell({ col, row });
                            setSelected(new Set());
                        }}
                        onContextMenu={e => handleCellRightClick(e, col, row)}
                    />
                );
            }
        }
        return cells;
    }

    function renderGroupLines() {
        return layoutGroups.filter(g => {
            const y = g.startRow * CELL_SIZE;
            return y >= visRowStart * CELL_SIZE && y <= visRowEnd * CELL_SIZE;
        }).map(g => (
            <div key={`gl${g.id}`} style={{
                position: 'absolute', left: 0, top: g.startRow * CELL_SIZE,
                width: totalCols * colW, height: 1, background: '#9ca3af', zIndex: 1, pointerEvents: 'none',
            }} />
        ));
    }

    function renderBars() {
        const bars = [];
        for (const g of layoutGroups) {
            if (!g.plans) continue;
            for (const plan of g.plans) {
                const startCol = planToStartCol(plan, startDate, viewMode);
                const endCol = planToEndCol(plan, startDate, viewMode);
                const x = startCol * colW;
                const w = Math.max(colW, (endCol - startCol + 1) * colW);
                const absRow = g.startRow + plan.rowIdx;
                const y = absRow * CELL_SIZE + 2;
                const h = CELL_SIZE - 4;

                if (x + w < scrollLeft || x > scrollLeft + containerW) continue;
                if (absRow < visRowStart || absRow > visRowEnd) continue;

                const bg = getColor(plan.taskBackColor);
                const fg = getColor(plan.taskFontColor);
                const isSel = selected.has(plan.planId);

                const isDragging = dragRef.current?.dragPlans?.some(p => p.planId === plan.planId);
                const ghost = ghostDrag && isDragging;
                let ghostX = x, ghostY = y;
                if (ghost) {
                    if (ghostDrag.type === 'move') {
                        ghostX = x + ghostDrag.deltaCol * colW;
                        ghostY = y + ghostDrag.deltaRow * CELL_SIZE;
                    } else if (ghostDrag.type === 'resize-left') {
                        ghostX = x + ghostDrag.deltaCol * colW;
                    }
                }

                const rightLabel = mode === 'device' ? plan.workerName : plan.serialNo;
                const barLabel = plan.taskName;

                bars.push(
                    <div
                        key={plan.planId}
                        style={{
                            position: 'absolute', left: ghost ? ghostX : x, top: ghost ? ghostY : y,
                            width: w, height: h, background: bg, color: fg,
                            borderRadius: 3, display: 'flex', alignItems: 'center',
                            border: '1px solid rgba(0,0,0,0.15)',
                            boxShadow: isSel
                                ? 'inset 0 0 0 2px #1d4ed8, 0 0 0 2px #93c5fd'
                                : 'none',
                            boxSizing: 'border-box', zIndex: isSel ? 4 : ghost ? 10 : 2,
                            opacity: ghost ? 0.5 : 1, cursor: 'grab', fontSize: 10, overflow: 'hidden',
                            userSelect: 'none',
                        }}
                        onPointerDown={e => { if (e.button === 0) handleBarPointerDown(e, plan, 'move'); }}
                        onContextMenu={e => handleBarRightClick(e, plan)}
                    >
                        <div
                            style={{ width: HANDLE_W, height: '100%', cursor: 'ew-resize', flexShrink: 0, zIndex: 3 }}
                            onPointerDown={e => { e.stopPropagation(); handleBarPointerDown(e, plan, 'resize-left'); }}
                        />
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 2px' }}>{barLabel}</span>
                        <span style={{ fontSize: 9, opacity: 0.8, flexShrink: 0, paddingRight: 2 }}>{rightLabel}</span>
                        <div
                            style={{ width: HANDLE_W, height: '100%', cursor: 'ew-resize', flexShrink: 0, zIndex: 3 }}
                            onPointerDown={e => { e.stopPropagation(); handleBarPointerDown(e, plan, 'resize-right'); }}
                        />
                    </div>
                );
            }
        }
        return bars;
    }

    function renderLeftHeader() {
        return layoutGroups.filter(g => {
            const y = g.startRow * CELL_SIZE;
            return y + g.numRows * CELL_SIZE > scrollTop && y < scrollTop + containerH;
        }).map(g => {
            const y = g.startRow * CELL_SIZE - scrollTop;
            const h = g.numRows * CELL_SIZE;
            return (
                <div key={g.id} style={{
                    position: 'absolute', left: 0, top: y, width: leftHdrW, height: h,
                    borderBottom: '1px solid #9ca3af', borderRight: '1px solid #d1d5db',
                    background: '#f9fafb', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center',
                    padding: '0 4px', overflow: 'hidden',
                }}>
                    {mode === 'device' ? (
                        <>
                            <div style={{ fontSize: 11, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.label1}</div>
                            <div style={{ fontSize: 10, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.label2}</div>
                        </>
                    ) : (
                        <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.label1}</div>
                    )}
                </div>
            );
        });
    }

    const planCount = plans.filter(p => !p.deleted).length;
    const groupCount = filteredGroups.length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {/* ツールバー */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', background: '#fff', borderBottom: '1px solid #e5e7eb', flexShrink: 0, flexWrap: 'wrap' }}>
                <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    style={{ fontSize: 12, padding: '3px 6px', border: '1px solid #d1d5db', borderRadius: 4 }}
                />
                {[['◀◀', -2], ['◀', -1], ['▶', 1], ['▶▶', 2]].map(([label, months]) => (
                    <button key={label} onClick={() => {
                        const d = new Date(startDate + 'T00:00:00');
                        d.setMonth(d.getMonth() + months);
                        setStartDate(dateToStr(d));
                    }} style={{ padding: '3px 8px', border: '1px solid #d1d5db', borderRadius: 4, background: '#fff', cursor: 'pointer', fontSize: 12 }}>{label}</button>
                ))}
                <select value={displayMonths} onChange={e => setDisplayMonths(Number(e.target.value))} style={{ fontSize: 12, padding: '3px 6px', border: '1px solid #d1d5db', borderRadius: 4 }}>
                    {Array.from({ length: 24 }, (_, i) => i + 1).map(n => (
                        <option key={n} value={n}>{n}ヶ月</option>
                    ))}
                </select>
                <select value={deviceCount} onChange={e => setDeviceCount(Number(e.target.value))} style={{ fontSize: 12, padding: '3px 6px', border: '1px solid #d1d5db', borderRadius: 4 }}>
                    {[100, 200, 500, 1000, 2000, 5000].map(n => (
                        <option key={n} value={n}>{n}件</option>
                    ))}
                </select>
                <button onClick={handleSeedApply} style={{ padding: '3px 10px', border: '1px solid #d1d5db', borderRadius: 4, background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>適用</button>
                <div style={{ width: 1, height: 20, background: '#e5e7eb', margin: '0 2px' }} />
                <button onClick={() => setViewMode('day')} style={{ padding: '3px 8px', border: `1px solid ${viewMode === 'day' ? '#2563eb' : '#d1d5db'}`, borderRadius: 4, background: viewMode === 'day' ? '#eff6ff' : '#fff', color: viewMode === 'day' ? '#2563eb' : '#374151', cursor: 'pointer', fontSize: 12 }}>日単位</button>
                <button onClick={() => setViewMode('slot')} style={{ padding: '3px 8px', border: `1px solid ${viewMode === 'slot' ? '#2563eb' : '#d1d5db'}`, borderRadius: 4, background: viewMode === 'slot' ? '#eff6ff' : '#fff', color: viewMode === 'slot' ? '#2563eb' : '#374151', cursor: 'pointer', fontSize: 12 }}>時間割</button>
            </div>

            {/* グリッド本体 */}
            <div ref={containerRef} style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
                {/* 左固定ヘッダー上部コーナー */}
                <div style={{ position: 'absolute', left: 0, top: 0, width: leftHdrW, height: TOTAL_HDR_H, background: '#f3f4f6', borderRight: '1px solid #d1d5db', borderBottom: '1px solid #9ca3af', zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600 }}>
                    {mode === 'device' ? '装置' : '担当者'}
                </div>

                {/* 左固定列（行）*/}
                <div style={{ position: 'absolute', left: 0, top: TOTAL_HDR_H, width: leftHdrW, height: containerH - TOTAL_HDR_H, overflow: 'hidden', zIndex: 10, background: '#f9fafb', borderRight: '1px solid #d1d5db' }}>
                    <div style={{ position: 'relative', height: totalH }}>
                        {renderLeftHeader()}
                    </div>
                </div>

                {/* スクロール領域 */}
                <div
                    ref={scrollRef}
                    style={{ position: 'absolute', left: leftHdrW, top: 0, right: 0, bottom: 0, overflow: 'scroll' }}
                    onScroll={onScroll}
                    onClick={e => {
                        if (e.target === scrollRef.current) {
                            setSelected(new Set());
                            setSelectedCell(null);
                        }
                    }}
                >
                    <div style={{ width: totalCols * colW, height: TOTAL_HDR_H + totalH, position: 'relative' }}>
                        {/* ヘッダー (sticky) */}
                        <div style={{ position: 'sticky', top: 0, height: TOTAL_HDR_H, zIndex: 15, background: '#f3f4f6' }}>
                            <div style={{ position: 'relative', height: TOTAL_HDR_H, width: totalCols * colW }}>
                                {renderHeaders()}
                            </div>
                        </div>
                        {/* セル + バー */}
                        <div
                            style={{ position: 'relative', height: totalH }}
                            onPointerDown={handleContentPointerDown}
                        >
                            {renderCells()}
                            {renderGroupLines()}
                            {renderBars()}
                            {/* 矩形選択オーバーレイ */}
                            {rectSelect && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: Math.min(rectSelect.x1, rectSelect.x2),
                                        top: Math.min(rectSelect.y1, rectSelect.y2),
                                        width: Math.abs(rectSelect.x2 - rectSelect.x1),
                                        height: Math.abs(rectSelect.y2 - rectSelect.y1),
                                        background: 'rgba(37,99,235,0.08)',
                                        border: '1.5px solid rgba(37,99,235,0.7)',
                                        borderRadius: 2,
                                        pointerEvents: 'none',
                                        zIndex: 30,
                                        boxSizing: 'border-box',
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* ソナーエフェクト */}
                {sonar && [0, 380, 760].map((delay, i) => (
                    <div key={`${sonar.key}-${i}`} style={{
                        position: 'absolute', left: sonar.x, top: sonar.y,
                        width: 20, height: 20, marginLeft: -10, marginTop: -10,
                        borderRadius: '50%', border: '3px solid #2563eb',
                        animation: `sonar-ring 1100ms ${delay}ms ease-out forwards`,
                        zIndex: 100, pointerEvents: 'none',
                        transformOrigin: 'center',
                    }} />
                ))}
            </div>

            {/* ステータスバー */}
            <div style={{ padding: '3px 10px', background: '#f9fafb', borderTop: '1px solid #e5e7eb', fontSize: 11, color: '#6b7280', display: 'flex', gap: 12, flexShrink: 0 }}>
                <span>{groupCount} {mode === 'device' ? '装置' : '担当者'} / {totalRows} 行 × {daysBetween(startDate, endDate)} 日</span>
                <span>予定 {planCount} 件</span>
                {selected.size > 0 && <span style={{ color: '#2563eb' }}>{selected.size}件選択中</span>}
                {copied.length > 0 && <span style={{ color: '#059669' }}>{copied.length}件コピー済み</span>}
            </div>

            {contextMenu && <ContextMenu x={contextMenu.x} y={contextMenu.y} items={contextMenu.items} onClose={() => setContextMenu(null)} />}
            {tooltip && <BarTooltip plan={tooltip.plan} anchorX={tooltip.x} anchorY={tooltip.y} onClose={() => setTooltip(null)} />}
            {scheduleDialog && (
                <ScheduleDialog
                    plan={scheduleDialog.plan}
                    serials={serials}
                    tasks={tasks}
                    workers={workers}
                    gridMode={mode}
                    onSave={savePlan}
                    onClose={() => setScheduleDialog(null)}
                />
            )}
        </div>
    );
}
