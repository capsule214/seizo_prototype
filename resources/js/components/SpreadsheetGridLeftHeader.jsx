import { CELL_SIZE } from '../lib/spreadsheet';

export default function SpreadsheetGridLeftHeader({
    layoutGroups,
    scrollTop,
    containerH,
    leftHdrW,
    mode,
    onGroupClick,
}) {
    const items = [];
    for (const g of layoutGroups) {
        const gTop = g.startRow * CELL_SIZE;
        if (gTop + g.numRows * CELL_SIZE <= scrollTop || gTop >= scrollTop + containerH) continue;

        const hasLocRow = g.locationRowIdx >= 0;
        const mainH = hasLocRow ? g.locationRowIdx * CELL_SIZE : g.numRows * CELL_SIZE;
        const mainY = gTop - scrollTop;

        items.push(
            <div key={g.id} style={{
                position: 'absolute', left: 0, top: mainY, width: leftHdrW, height: mainH,
                borderBottom: hasLocRow ? '1px solid #93c5fd' : '1px solid #9ca3af',
                borderRight: '1px solid #d1d5db', background: '#f9fafb', boxSizing: 'border-box',
                display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 4px', overflow: 'hidden',
                cursor: mode === 'device' ? 'pointer' : 'default',
            }}
            data-device-header={mode === 'device' ? '1' : undefined}
            onClick={(e) => {
                if (mode === 'device') onGroupClick?.(g, e);
            }}>
                {mode === 'device' ? (
                    <>
                        <div style={{ fontSize: 11, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.label1}</div>
                        <div style={{ fontSize: 10, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.label2}</div>
                    </>
                ) : mode === 'worker' ? (
                    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
                        <div style={{ width: 80, borderRight: '1px solid #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 4px', boxSizing: 'border-box' }}>
                            {g.teamName || '-'}
                        </div>
                        <div style={{ width: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 4px', boxSizing: 'border-box' }}>
                            {g.label1}
                        </div>
                    </div>
                ) : (
                    <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>{g.label1}</div>
                )}
            </div>
        );

        if (hasLocRow) {
            const locY = (gTop + g.locationRowIdx * CELL_SIZE) - scrollTop;
            const locH = (g.locationNumRows || 1) * CELL_SIZE;
            items.push(
                <div key={`${g.id}-loc`} style={{
                    position: 'absolute', left: 0, top: locY, width: leftHdrW, height: locH,
                    borderBottom: '1px solid #9ca3af', borderRight: '1px solid #d1d5db',
                    background: '#dbeafe', boxSizing: 'border-box',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, color: '#1d4ed8', fontWeight: 700, letterSpacing: '0.05em',
                }}>
                    場所
                </div>
            );
        }
    }
    return items;
}
