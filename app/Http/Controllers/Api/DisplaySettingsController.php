<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DisplaySettingsController extends Controller
{
    private const KEY = 'main';
    private const WORKER_ID = 0;

    public function index()
    {
        $value = DB::table('display_settings')
            ->where('key', self::KEY)
            ->value('value');

        if ($value === null) {
            return response()->json([
                'selectedKisyuIds' => [],
                'selectedTeamNames' => [],
                'selectedWorkerIds' => [],
                'showLocationInDevice' => false,
            ]);
        }

        return response()->json(json_decode($value, true));
    }

    public function update(Request $request)
    {
        $payload = $request->only(['selectedKisyuIds', 'selectedTeamNames', 'selectedWorkerIds', 'showLocationInDevice']);
        $json    = json_encode($payload);

        DB::table('display_settings')->upsert(
            [['worker_id' => self::WORKER_ID, 'key' => self::KEY, 'value' => $json]],
            ['key'],
            ['value']
        );

        return response()->json($payload);
    }
}
