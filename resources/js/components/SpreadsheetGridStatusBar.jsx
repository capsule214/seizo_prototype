export default function SpreadsheetGridStatusBar({
    groupCount,
    mode,
    totalRows,
    dayCount,
    planCount,
    selectedCount,
    copiedCount,
}) {
    return (
        <div style={{ padding: '3px 10px', background: '#f9fafb', borderTop: '1px solid #e5e7eb', fontSize: 11, color: '#6b7280', display: 'flex', gap: 12, flexShrink: 0 }}>
            <span>{groupCount} {mode === 'device' ? '装置' : mode === 'location' ? '場所' : '担当者'} / {totalRows} 行 × {dayCount} 日</span>
            <span>予定 {planCount} 件</span>
            {selectedCount > 0 && <span style={{ color: '#2563eb' }}>{selectedCount}件選択中</span>}
            {copiedCount > 0 && <span style={{ color: '#059669' }}>{copiedCount}件コピー済み</span>}
        </div>
    );
}
