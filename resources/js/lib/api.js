/**
 * Sanctum SPA 認証対応の fetch ラッパー
 * - GET /sanctum/csrf-cookie で XSRF-TOKEN Cookie を取得
 * - 以降のリクエストに X-XSRF-TOKEN ヘッダーを自動付与
 */

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
    return null;
}

let csrfInitialized = false;

export async function initCsrf() {
    if (csrfInitialized) return;
    await fetch('/sanctum/csrf-cookie', { credentials: 'include' });
    csrfInitialized = true;
}

export async function apiFetch(path, options = {}) {
    const xsrf = getCookie('XSRF-TOKEN');
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(xsrf ? { 'X-XSRF-TOKEN': xsrf } : {}),
        ...(options.headers ?? {}),
    };
    return fetch(`/api${path}`, {
        ...options,
        credentials: 'include',
        headers,
    });
}
