import { getColor } from '../lib/colors';
import { CELL_SIZE, HANDLE_W } from '../lib/spreadsheet';

export default function SpreadsheetGridBars({
    layoutGroups,
    startDate,
    viewMode,
    colW,
    totalCols,
    scrollLeft,
    containerW,
    visRowStart,
    visRowEnd,
    selected,
    dragRef,
    ghostDrag,
    mode,
    planToStartCol,
    planToEndCol,
    onBarPointerDown,
    onBarRightClick,
}) {
    const bars = [];
    const labels = [];
    const rowStartXMap = new Map();

    for (const g of layoutGroups) {
        if (!g.plans) continue;
        for (const plan of g.plans) {
            const sx = planToStartCol(plan, startDate, viewMode) * colW;
            const absRow = g.startRow + plan.rowIdx;
            if (!rowStartXMap.has(absRow)) rowStartXMap.set(absRow, []);
            rowStartXMap.get(absRow).push({ startX: sx, planId: plan.planId });
        }
    }
    for (const arr of rowStartXMap.values()) arr.sort((a, b) => a.startX - b.startX);

    const contentRight = totalCols * colW;

    for (const g of layoutGroups) {
        if (!g.plans) continue;
        for (const plan of g.plans) {
            const startCol = planToStartCol(plan, startDate, viewMode);
            const endCol = planToEndCol(plan, startDate, viewMode);

            let drawStartCol = startCol;
            let drawEndCol = endCol;

            const isDragging = dragRef.current?.dragPlans?.some(p => p.planId === plan.planId);
            const ghost = ghostDrag && isDragging;
            if (ghost) {
                if (ghostDrag.type === 'move') {
                    drawStartCol = startCol + ghostDrag.deltaCol;
                    drawEndCol = endCol + ghostDrag.deltaCol;
                } else if (ghostDrag.type === 'resize-left') {
                    drawStartCol = Math.min(endCol, startCol + ghostDrag.deltaCol);
                } else if (ghostDrag.type === 'resize-right') {
                    drawEndCol = Math.max(startCol, endCol + ghostDrag.deltaCol);
                }

                drawStartCol = Math.max(0, Math.min(drawStartCol, totalCols - 1));
                drawEndCol = Math.max(drawStartCol, Math.min(drawEndCol, totalCols - 1));
            }

            const x = drawStartCol * colW;
            if (x >= contentRight) continue;

            const w = Math.min(Math.max(colW, (drawEndCol - drawStartCol + 1) * colW), contentRight - x);
            const absRow = g.startRow + plan.rowIdx;
            const y = absRow * CELL_SIZE;

            if (x + w < scrollLeft || x > scrollLeft + containerW) continue;
            if (absRow < visRowStart || absRow > visRowEnd) continue;

            const bg = getColor(plan.taskBackColor);
            const fg = getColor(plan.taskFontColor);
            const isSel = selected.has(plan.planId);
            const barX = x;
            const barY = ghost && ghostDrag.type === 'move' ? y + ghostDrag.deltaRow * CELL_SIZE : y;

            const rowArr = rowStartXMap.get(absRow) || [];
            const myIdx = rowArr.findIndex(r => r.planId === plan.planId);
            const nextBarX = (myIdx >= 0 && myIdx + 1 < rowArr.length) ? rowArr[myIdx + 1].startX : null;
            const labelLeft = Math.max(barX + HANDLE_W, 0);
            const maxWToNextBar = nextBarX !== null ? Math.max(0, nextBarX - labelLeft) : Infinity;
            const maxWToContent = Math.max(0, contentRight - labelLeft);
            const labelWidth = Math.min(maxWToNextBar, maxWToContent);

            bars.push(
                <div
                    key={plan.planId}
                    style={{
                        position: 'absolute', left: barX, top: barY, width: w, height: CELL_SIZE, background: bg,
                        display: 'flex', alignItems: 'center', border: '1px solid rgba(0,0,0,0.15)',
                        boxShadow: isSel ? 'inset 0 0 0 2px #1d4ed8, 0 0 0 2px #93c5fd' : 'none',
                        boxSizing: 'border-box', zIndex: isSel ? 4 : ghost ? 10 : 2,
                        opacity: ghost ? 0.5 : 1, cursor: 'grab', overflow: 'hidden', userSelect: 'none',
                    }}
                    onPointerDown={e => { if (e.button === 0) onBarPointerDown(e, plan, 'move'); }}
                    onClick={e => e.stopPropagation()}
                    onContextMenu={e => onBarRightClick(e, plan)}
                >
                    <div style={{ width: HANDLE_W, height: '100%', cursor: 'ew-resize', flexShrink: 0, zIndex: 3 }} onPointerDown={e => { e.stopPropagation(); onBarPointerDown(e, plan, 'resize-left'); }} />
                    <div style={{ flex: 1 }} />
                    <div style={{ width: HANDLE_W, height: '100%', cursor: 'ew-resize', flexShrink: 0, zIndex: 3 }} onPointerDown={e => { e.stopPropagation(); onBarPointerDown(e, plan, 'resize-right'); }} />
                </div>
            );

            const label = mode === 'location'
                ? (plan.serialNo ? `${plan.kisyuName} ${plan.serialNo}` : '')
                : (plan.workerName ? `${plan.taskName} ${plan.workerName}` : plan.taskName);

            labels.push(
                <div
                    key={`lbl-${plan.planId}`}
                    style={{
                        position: 'absolute', left: labelLeft, top: barY, width: labelWidth, height: CELL_SIZE,
                        display: 'flex', alignItems: 'center', overflow: 'hidden', whiteSpace: 'nowrap',
                        fontSize: 10, color: fg, pointerEvents: 'none', zIndex: 5, paddingLeft: 2, userSelect: 'none',
                    }}
                >
                    {label}
                </div>
            );
        }
    }

    return [...bars, ...labels];
}
