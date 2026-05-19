export default function SpreadsheetGridCells({
    visColStart,
    visColEnd,
    visRowStart,
    visRowEnd,
    colW,
    cellSize,
    selectedCell,
    locationRowAbsSet,
    suppressNextCellClickRef,
    onSelectCell,
    onCellRightClick,
    getColBg,
}) {
    const cells = [];
    for (let col = visColStart; col <= visColEnd; col++) {
        const x = col * colW;
        const baseBg = getColBg(col);
        for (let row = visRowStart; row <= visRowEnd; row++) {
            const y = row * cellSize;
            const isSel = selectedCell && selectedCell.col === col && selectedCell.row === row;
            const isLocRow = locationRowAbsSet.has(row);
            const cellBg = isLocRow ? (baseBg === '#e5e7eb' ? '#cfe2f3' : '#dbeafe') : baseBg;
            cells.push(
                <div
                    key={`c${col}-${row}`}
                    style={{
                        position: 'absolute', left: x, top: y, width: colW, height: cellSize,
                        background: cellBg,
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
                        onSelectCell(col, row);
                    }}
                    onContextMenu={e => onCellRightClick(e, col, row)}
                />
            );
        }
    }
    return cells;
}
