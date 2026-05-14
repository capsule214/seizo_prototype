<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KmTask;

class TaskController extends Controller
{
    public function index()
    {
        $tasks = KmTask::orderBy('sort_no')->get();

        return response()->json($tasks->map(function ($t) {
            return [
                'taskId'     => $t->task_id,
                'taskName'   => $t->task_name,
                'backColor'  => $t->back_color,
                'fontColor'  => $t->font_color,
            ];
        }));
    }
}
