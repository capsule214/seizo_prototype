<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DmKisyu extends Model
{
    protected $table = 'dm_kisyu';
    protected $primaryKey = 'kisyu_id';
    public $timestamps = false;
    protected $fillable = ['kisyu_name', 'sort_no'];

    public function serials()
    {
        return $this->hasMany(KdSerial::class, 'kisyu_id', 'kisyu_id');
    }
}
