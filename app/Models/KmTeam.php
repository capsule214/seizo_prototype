<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KmTeam extends Model
{
    protected $table = 'km_team';
    protected $primaryKey = 'team_id';
    public $timestamps = false;
    protected $fillable = ['team_name', 'sort_no'];

    public function workers()
    {
        return $this->hasMany(KmWorker::class, 'team_id', 'team_id');
    }
}
