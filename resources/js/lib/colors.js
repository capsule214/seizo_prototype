export const COLOR_PALETTE = [
    null,
    '#3b82f6',
    '#22c55e',
    '#f97316',
    '#a855f7',
    '#000000',
    '#ffffff',
];

export function getColor(index) {
    return COLOR_PALETTE[index] ?? '#cccccc';
}
