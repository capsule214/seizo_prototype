<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KmWorker;

class WorkerController extends Controller
{
    public function index()
    {
        $workers = KmWorker::with('km_team')
            ->get()
            ->sortBy(function ($w) {
                return $w->km_team ? $w->km_team->sort_no : 999;
            });

        return response()->json($workers->values()->map(function ($w) {
            return [
                'workerId'    => $w->worker_id,
                'workerName'  => $w->worker_name,
                'teamId'      => $w->team_id,
                'teamName'    => $w->km_team ? $w->km_team->team_name : '',
            ];
        }));
    }
}
