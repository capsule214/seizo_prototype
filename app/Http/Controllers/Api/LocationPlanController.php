<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KdLocationPlan;
use Illuminate\Http\Request;

class LocationPlanController extends Controller
{
    private function planRules(): array
    {
        return [
            'locationId' => 'required|integer|min:1',
            'serialId'   => 'required|integer|min:1',
            'startDate'  => 'required|date',
            'endDate'    => 'required|date|after_or_equal:startDate',
        ];
    }

    private function planPayload(array $data): array
    {
        return [
            'location_id' => $data['locationId'],
            'serial_id'   => $data['serialId'],
            'start_date'  => $data['startDate'],
            'end_date'    => $data['endDate'],
        ];
    }

    private function formatPlan(KdLocationPlan $plan): array
    {
        $location = $plan->km_location;
        $serial   = $plan->kd_serial;

        return [
            'planId'       => $plan->location_plan_id,
            'locationId'   => $plan->location_id,
            'locationName' => $location ? $location->location_name : '',
            'serialId'     => $plan->serial_id,
            'serialNo'     => $serial ? $serial->serial_no : '',
            'kisyuId'      => $serial ? $serial->kisyu_id : null,
            'kisyuName'    => $serial && $serial->dm_kisyu ? $serial->dm_kisyu->kisyu_name : '',
            'startDate'    => $plan->start_date,
            'endDate'      => $plan->end_date,
        ];
    }

    public function index(Request $request)
    {
        $query = KdLocationPlan::with(['km_location', 'kd_serial.dm_kisyu'])
            ->where('deleted', 0);

        return response()->json($query->get()->map(fn($p) => $this->formatPlan($p)));
    }

    public function search(Request $request)
    {
        $data = $request->validate([
            'from'         => 'required|date',
            'to'           => 'required|date|after_or_equal:from',
            'location_ids' => 'nullable|array',
            'location_ids.*' => 'integer|min:1',
            'serial_ids'   => 'nullable|array',
            'serial_ids.*' => 'integer|min:1',
        ]);

        $query = KdLocationPlan::with(['km_location', 'kd_serial.dm_kisyu'])
            ->where('deleted', 0)
            ->where('start_date', '<=', $data['to'])
            ->where('end_date', '>=', $data['from']);

        if (!empty($data['location_ids'])) {
            $query->whereIn('location_id', $data['location_ids']);
        }
        if (!empty($data['serial_ids'])) {
            $query->whereIn('serial_id', $data['serial_ids']);
        }

        return response()->json($query->get()->map(fn($p) => $this->formatPlan($p)));
    }

    public function store(Request $request)
    {
        $data = $request->validate($this->planRules());

        $plan = KdLocationPlan::create([
            ...$this->planPayload($data),
            'deleted'     => 0,
        ]);

        $plan->load(['km_location', 'kd_serial.dm_kisyu']);

        return response()->json($this->formatPlan($plan), 201);
    }

    public function update(Request $request, int $id)
    {
        $plan = KdLocationPlan::findOrFail($id);

        $data = $request->validate($this->planRules());

        $plan->update($this->planPayload($data));

        $plan->load(['km_location', 'kd_serial.dm_kisyu']);

        return response()->json($this->formatPlan($plan));
    }

    public function destroy(Request $request)
    {
        $data = $request->validate([
            'ids'   => 'required|array|min:1',
            'ids.*' => 'integer|min:1',
        ]);

        $deleted = KdLocationPlan::whereIn('location_plan_id', $data['ids'])->update(['deleted' => 1]);
        return response()->json(['deleted' => $deleted]);
    }
}
