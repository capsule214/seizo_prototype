export default function GridTabPane({ active, children }) {
    return (
        <div style={{
            position: 'absolute',
            inset: 0,
            visibility: active ? 'visible' : 'hidden',
            pointerEvents: active ? 'auto' : 'none',
        }}>
            {children}
        </div>
    );
}
