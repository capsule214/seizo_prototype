<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DmKisyu;
use App\Models\KdSerial;
use App\Models\KmTeam;
use App\Models\KmWorker;
use App\Models\KmTask;
use App\Models\KdPlan;
use App\Models\KmLocation;
use App\Models\KdLocationPlan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SeedController extends Controller
{
    private const SLOT_HOURS = [8, 10, 13, 15, 17, 19];
    private const SLOT_END_HOURS = [10, 12, 15, 17, 19, 21];

    private int $lcgSeed = 42;

    private function lcgNext(): int
    {
        $this->lcgSeed = ($this->lcgSeed * 1664525 + 1013904223) & 0xffffffff;
        if ($this->lcgSeed < 0) $this->lcgSeed += 0x100000000;
        return $this->lcgSeed;
    }

    private function lcgRange(int $min, int $max): int
    {
        return $min + ($this->lcgNext() % ($max - $min + 1));
    }

    private function buildDateRangeFromSlots(int $baseTimestamp, int $startSlot, int $duration): array
    {
        $startDay = intdiv($startSlot, 6);
        $startSlotOfDay = $startSlot % 6;
        $endSlot = $startSlot + $duration - 1;
        $endDay = intdiv($endSlot, 6);
        $endSlotOfDay = $endSlot % 6;

        $startTs = $baseTimestamp + $startDay * 86400;
        $endTs = $baseTimestamp + $endDay * 86400;

        $startHour = self::SLOT_HOURS[$startSlotOfDay];
        $endHour = self::SLOT_END_HOURS[$endSlotOfDay];

        $startDate = date('Y-m-d', $startTs) . 'T' . str_pad((string) $startHour, 2, '0', STR_PAD_LEFT) . ':00:00';
        $endDate = date('Y-m-d', $endTs) . 'T' . str_pad((string) $endHour, 2, '0', STR_PAD_LEFT) . ':00:00';

        return [$startDate, $endDate];
    }

    public function seed(Request $request)
    {
        $count    = $request->input('count', 1000);
        $baseDate = $request->input('baseDate', now()->format('Y-m-01'));
        $months   = $request->input('months', 6);
        $seedNum  = $request->input('seedNum', 42);

        $this->lcgSeed = $seedNum;

        DB::statement('PRAGMA foreign_keys = OFF');
        KdLocationPlan::truncate();
        KdPlan::truncate();
        KdSerial::truncate();
        KmWorker::truncate();
        KmTeam::truncate();
        KmTask::truncate();
        DmKisyu::truncate();
        KmLocation::truncate();
        DB::statement('PRAGMA foreign_keys = ON');

        // 場所マスタ（1F〜5F）を作成
        $locationNames = ['1F', '2F', '3F', '4F', '5F'];
        $locationIds = [];
        foreach ($locationNames as $i => $name) {
            $loc = KmLocation::create(['location_name' => $name, 'sort_no' => $i + 1]);
            $locationIds[] = $loc->location_id;
        }

        $kisyuNames = ['機種A', '機種B', '機種C', '機種D', '機種E'];
        $kisyuIds = [];
        foreach ($kisyuNames as $i => $name) {
            $k = DmKisyu::create(['kisyu_name' => $name, 'sort_no' => $i + 1]);
            $kisyuIds[] = $k->kisyu_id;
        }

        $serialIds = [];
        for ($i = 1; $i <= 100; $i++) {
            $kisyuIdx = $this->lcgRange(0, 4);
            $s = KdSerial::create([
                'kisyu_id'   => $kisyuIds[$kisyuIdx],
                'serial_no'  => 'SN-' . str_pad($i, 3, '0', STR_PAD_LEFT),
                'back_color' => $kisyuIdx + 1,
                'font_color' => 6,
            ]);
            $serialIds[] = $s->serial_id;
        }

        $teamA = KmTeam::create(['team_name' => 'チームA', 'sort_no' => 1]);
        $teamB = KmTeam::create(['team_name' => 'チームB', 'sort_no' => 2]);

        $workerDefs = [
            ['山田太郎', $teamA->team_id],
            ['鈴木花子', $teamA->team_id],
            ['田中一郎', $teamB->team_id],
            ['佐藤二郎', $teamB->team_id],
            ['高橋三郎', $teamB->team_id],
        ];
        $workerIds = [];
        foreach ($workerDefs as $wd) {
            $w = KmWorker::create(['worker_name' => $wd[0], 'team_id' => $wd[1]]);
            $workerIds[] = $w->worker_id;
        }

        $taskDefs = [
            ['工程A', 1, 6, 1],
            ['工程B', 2, 6, 2],
            ['検査',  3, 6, 3],
            ['出荷',  4, 6, 4],
        ];
        $taskIds = [];
        foreach ($taskDefs as $td) {
            $t = KmTask::create([
                'task_name'  => $td[0],
                'back_color' => $td[1],
                'font_color' => $td[2],
                'sort_no'    => $td[3],
            ]);
            $taskIds[] = $t->task_id;
        }

        $base = strtotime($baseDate);
        $totalSlots = $months * 30 * 6;

        $plans = [];
        for ($i = 0; $i < $count; $i++) {
            $serialIdx  = $this->lcgRange(0, count($serialIds) - 1);
            $taskIdx    = $this->lcgRange(0, count($taskIds) - 1);
            $workerIdx  = $this->lcgRange(0, count($workerIds) - 1);
            $startSlot  = $this->lcgRange(0, $totalSlots - 1);
            $duration   = $this->lcgRange(1, 12);
            [$startDate, $endDate] = $this->buildDateRangeFromSlots($base, $startSlot, $duration);

            $plans[] = [
                'serial_id'   => $serialIds[$serialIdx],
                'task_id'     => $taskIds[$taskIdx],
                'assignee_id' => $workerIds[$workerIdx],
                'deleted'     => 0,
                'start_date'  => $startDate,
                'end_date'    => $endDate,
            ];
        }

        foreach (array_chunk($plans, 200) as $chunk) {
            KdPlan::insert($chunk);
        }

        // 場所予定を生成（装置予定の約1/4の件数）
        $locationPlanCount = max(1, intdiv($count, 4));
        $locationPlans = [];
        for ($i = 0; $i < $locationPlanCount; $i++) {
            $locationIdx = $this->lcgRange(0, count($locationIds) - 1);
            $serialIdx   = $this->lcgRange(0, count($serialIds) - 1);
            $startSlot   = $this->lcgRange(0, $totalSlots - 1);
            $duration    = $this->lcgRange(1, 8);
            [$startDate, $endDate] = $this->buildDateRangeFromSlots($base, $startSlot, $duration);

            $locationPlans[] = [
                'location_id' => $locationIds[$locationIdx],
                'serial_id'   => $serialIds[$serialIdx],
                'start_date'  => $startDate,
                'end_date'    => $endDate,
                'deleted'     => 0,
            ];
        }

        foreach (array_chunk($locationPlans, 200) as $chunk) {
            KdLocationPlan::insert($chunk);
        }

        return response()->json([
            'ok'            => true,
            'count'         => $count,
            'serials'       => count($serialIds),
            'workers'       => count($workerIds),
            'tasks'         => count($taskIds),
            'locations'     => count($locationIds),
            'locationPlans' => count($locationPlans),
        ]);
    }
}
