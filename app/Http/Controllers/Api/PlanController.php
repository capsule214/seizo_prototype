<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KdPlan;
use Illuminate\Http\Request;

class PlanController extends Controller
{
    private function planRules(): array
    {
        return [
            'serialId'  => 'required|integer|min:1',
            'taskId'    => 'required|integer|min:1',
            'workerId'  => 'required|integer|min:1',
            'startDate' => 'required|date',
            'endDate'   => 'required|date|after_or_equal:startDate',
        ];
    }

    private function planPayload(array $data): array
    {
        return [
            'serial_id'   => $data['serialId'],
            'task_id'     => $data['taskId'],
            'assignee_id' => $data['workerId'],
            'start_date'  => $data['startDate'],
            'end_date'    => $data['endDate'],
        ];
    }

    private function formatPlan(KdPlan $plan): array
    {
        $serial = $plan->kd_serial;
        $kisyu  = $serial ? $serial->dm_kisyu : null;
        $task   = $plan->km_task;
        $worker = $plan->km_worker;

        return [
            'planId'         => $plan->plan_id,
            'serialId'       => $plan->serial_id,
            'taskId'         => $plan->task_id,
            'taskName'       => $task ? $task->task_name : '',
            'kisyuId'        => $kisyu ? $kisyu->kisyu_id : null,
            'kisyuName'      => $kisyu ? $kisyu->kisyu_name : '',
            'serialNo'       => $serial ? $serial->serial_no : '',
            'taskBackColor'  => $task ? $task->back_color : 1,
            'taskFontColor'  => $task ? $task->font_color : 6,
            'startDate'      => $plan->start_date,
            'endDate'        => $plan->end_date,
            'workerId'       => $plan->assignee_id,
            'workerName'     => $worker ? $worker->worker_name : '',
        ];
    }

    public function index(Request $request)
    {
        $from = $request->query('from');
        $to   = $request->query('to');

        $query = KdPlan::with(['kd_serial.dm_kisyu', 'km_task', 'km_worker'])
            ->where('deleted', 0);

        if ($from && $to) {
            $query->where('start_date', '<=', $to)
                  ->where('end_date', '>=', $from);
        }

        return response()->json($query->get()->map(fn($p) => $this->formatPlan($p)));
    }

    public function store(Request $request)
    {
        $data = $request->validate($this->planRules());

        $plan = KdPlan::create([
            ...$this->planPayload($data),
            'deleted'     => 0,
        ]);

        $plan->load(['kd_serial.dm_kisyu', 'km_task', 'km_worker']);

        return response()->json($this->formatPlan($plan), 201);
    }

    public function update(Request $request, int $id)
    {
        $plan = KdPlan::findOrFail($id);

        $data = $request->validate($this->planRules());

        $plan->update($this->planPayload($data));

        $plan->load(['kd_serial.dm_kisyu', 'km_task', 'km_worker']);

        return response()->json($this->formatPlan($plan));
    }

    public function destroy(Request $request)
    {
        $data = $request->validate([
            'ids'   => 'required|array|min:1',
            'ids.*' => 'integer|min:1',
        ]);

        $ids     = $data['ids'];
        $deleted = KdPlan::whereIn('plan_id', $ids)->update(['deleted' => 1]);
        return response()->json(['deleted' => $deleted]);
    }

    public function destroyOne(int $id)
    {
        KdPlan::findOrFail($id)->update(['deleted' => 1]);
        return response()->json(['deleted' => 1]);
    }
}
