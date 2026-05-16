<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    /** ログイン（ID: admin, Password: 12345） */
    public function login(Request $request)
    {
        $request->validate([
            'loginId'  => 'required|string',
            'password' => 'required|string',
        ]);

        // email フィールドにログインIDを格納している
        $credentials = [
            'email'    => $request->input('loginId'),
            'password' => $request->input('password'),
        ];

        if (!Auth::attempt($credentials, remember: false)) {
            return response()->json(['message' => 'IDまたはパスワードが正しくありません'], 401);
        }

        $request->session()->regenerate();

        return response()->json(['user' => Auth::user()->only('name', 'email')]);
    }

    /** ログアウト */
    public function logout(Request $request)
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'ログアウトしました']);
    }

    /** 現在のログインユーザー確認 */
    public function me(Request $request)
    {
        return response()->json(['user' => $request->user()->only('name', 'email')]);
    }
}
