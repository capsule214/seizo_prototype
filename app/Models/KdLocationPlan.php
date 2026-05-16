<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KdLocationPlan extends Model
{
    protected $table = 'kd_location_plan';
    protected $primaryKey = 'location_plan_id';
    public $timestamps = false;
    protected $fillable = ['location_id', 'serial_id', 'start_date', 'end_date', 'deleted'];

    public function km_location()
    {
        return $this->belongsTo(KmLocation::class, 'location_id', 'location_id');
    }

    public function kd_serial()
    {
        return $this->belongsTo(KdSerial::class, 'serial_id', 'serial_id');
    }
}
