export default function SpreadsheetGridGroupLines({
    layoutGroups,
    visRowStart,
    visRowEnd,
    cellSize,
    totalCols,
    colW,
}) {
    const lines = [];
    for (const g of layoutGroups) {
        const y = g.startRow * cellSize;
        if (y < visRowStart * cellSize || y > (visRowEnd + 1) * cellSize) continue;
        lines.push(
            <div key={`gl${g.id}`} style={{
                position: 'absolute', left: 0, top: y,
                width: totalCols * colW, height: 1, background: '#9ca3af', zIndex: 1, pointerEvents: 'none',
            }} />
        );
        if (g.locationRowIdx >= 0) {
            const locY = (g.startRow + g.locationRowIdx) * cellSize;
            if (locY >= visRowStart * cellSize && locY <= (visRowEnd + 1) * cellSize) {
                lines.push(
                    <div key={`gl-loc${g.id}`} style={{
                        position: 'absolute', left: 0, top: locY,
                        width: totalCols * colW, height: 1, background: '#93c5fd', zIndex: 1, pointerEvents: 'none',
                    }} />
                );
            }
        }
    }
    return lines;
}
