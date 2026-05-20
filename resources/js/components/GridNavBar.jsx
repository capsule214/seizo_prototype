export default function GridNavBar({
    userName,
    onOpenSettings,
    onLogout,
}) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '8px 12px', flexShrink: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>生産スケジュール</div>
            <div style={{ flex: 1 }} />
            <button onClick={onOpenSettings} style={{ padding: '6px 14px', border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 13 }}>表示設定</button>
            <div style={{ width: 1, height: 20, background: '#e5e7eb', margin: '0 8px' }} />
            <span style={{ fontSize: 12, color: '#6b7280' }}>{userName}</span>
            <button onClick={onLogout} style={{ marginLeft: 8, padding: '6px 14px', border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 13 }}>ログアウト</button>
        </div>
    );
}
