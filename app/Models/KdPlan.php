<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KdPlan extends Model
{
    protected $table = 'kd_plan';
    protected $primaryKey = 'plan_id';
    public $timestamps = false;
    protected $fillable = ['serial_id', 'task_id', 'assignee_id', 'deleted', 'start_date', 'end_date'];

    public function kd_serial()
    {
        return $this->belongsTo(KdSerial::class, 'serial_id', 'serial_id');
    }

    public function km_task()
    {
        return $this->belongsTo(KmTask::class, 'task_id', 'task_id');
    }

    public function km_worker()
    {
        return $this->belongsTo(KmWorker::class, 'assignee_id', 'worker_id');
    }
}
