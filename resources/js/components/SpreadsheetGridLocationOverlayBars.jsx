import { CELL_SIZE } from '../lib/spreadsheet';

export default function SpreadsheetGridLocationOverlayBars({
    extraLocationRow,
    layoutGroups,
    startDate,
    viewMode,
    planToStartCol,
    planToEndCol,
    visRowStart,
    visRowEnd,
    colW,
    totalCols,
    scrollLeft,
    containerW,
}) {
    if (!extraLocationRow) return [];
    const bars = [];

    for (const g of layoutGroups) {
        if (g.locationRowIdx < 0 || !g.locationPlans?.length) continue;
        for (const plan of g.locationPlans) {
            const startCol = planToStartCol(plan, startDate, viewMode);
            const endCol = planToEndCol(plan, startDate, viewMode);
            const absRow = g.startRow + g.locationRowIdx + plan.rowIdx;

            if (absRow < visRowStart || absRow > visRowEnd) continue;

            const x = startCol * colW;
            if (x >= totalCols * colW) continue;
            const w = Math.min(Math.max(colW, (endCol - startCol + 1) * colW), totalCols * colW - x);
            const y = absRow * CELL_SIZE;

            if (x + w < scrollLeft || x > scrollLeft + containerW) continue;

            const pad = 3;
            const locLabelLeft = Math.max(x + pad, 0);
            const locLabelWidth = Math.max(0, Math.min(x + w - pad - locLabelLeft, totalCols * colW - locLabelLeft));

            bars.push(
                <div
                    key={`loc-ov-${plan.planId}`}
                    title={plan.locationName}
                    style={{
                        position: 'absolute', left: x, top: y, width: w, height: CELL_SIZE,
                        background: '#93c5fd', border: '1px solid #3b82f6',
                        boxSizing: 'border-box', zIndex: 2, pointerEvents: 'none',
                    }}
                />
            );
            bars.push(
                <div
                    key={`loc-ov-lbl-${plan.planId}`}
                    style={{
                        position: 'absolute', left: locLabelLeft, top: y,
                        width: locLabelWidth, height: CELL_SIZE,
                        display: 'flex', alignItems: 'center', overflow: 'hidden', whiteSpace: 'nowrap',
                        fontSize: 9, color: '#1e3a5f', pointerEvents: 'none', zIndex: 3, userSelect: 'none',
                    }}
                >
                    {plan.locationName}
                </div>
            );
        }
    }
    return bars;
}
