<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use SQLite3;

class DisplaySettingsController extends Controller
{
    private function getDb(): SQLite3
    {
        $path = database_path('database.sqlite');
        return new SQLite3($path);
    }

    public function index()
    {
        $db  = $this->getDb();
        $row = $db->querySingle("SELECT value FROM display_settings WHERE key='main'", true);
        $db->close();

        if (!$row) {
            return response()->json(['selectedKisyuIds' => [], 'selectedWorkerIds' => []]);
        }

        return response()->json(json_decode($row['value'], true));
    }

    public function update(Request $request)
    {
        $payload = json_encode($request->all());
        $db      = $this->getDb();

        $stmt = $db->prepare(
            "INSERT INTO display_settings (worker_id, key, value) VALUES (0, 'main', :v)
             ON CONFLICT(key) DO UPDATE SET value=excluded.value"
        );
        $stmt->bindValue(':v', $payload, SQLITE3_TEXT);
        $stmt->execute();
        $db->close();

        return response()->json(json_decode($payload, true));
    }
}
