<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KmLocation extends Model
{
    protected $table = 'km_location';
    protected $primaryKey = 'location_id';
    public $timestamps = false;
    protected $fillable = ['location_name', 'sort_no'];

    public function kd_location_plans()
    {
        return $this->hasMany(KdLocationPlan::class, 'location_id', 'location_id');
    }
}
