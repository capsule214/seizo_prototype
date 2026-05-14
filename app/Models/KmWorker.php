<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KmWorker extends Model
{
    protected $table = 'km_worker';
    protected $primaryKey = 'worker_id';
    public $timestamps = false;
    protected $fillable = ['worker_name', 'team_id'];

    public function km_team()
    {
        return $this->belongsTo(KmTeam::class, 'team_id', 'team_id');
    }
}
