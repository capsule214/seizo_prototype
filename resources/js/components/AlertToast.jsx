export default function AlertToast({ message, onClose }) {
    if (!message) return null;
    return (
        <div style={{
            position: 'absolute', top: 12, right: 12, zIndex: 9999,
            background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8,
            padding: '10px 16px', fontSize: 13, color: '#b91c1c',
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            display: 'flex', alignItems: 'center', gap: 10, maxWidth: 360,
        }}>
            <span style={{ fontSize: 16 }}>⚠</span>
            <span style={{ flex: 1 }}>{message}</span>
            <button
                onClick={onClose}
                style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 16, color: '#9ca3af', padding: 0 }}
            >
                ×
            </button>
        </div>
    );
}
