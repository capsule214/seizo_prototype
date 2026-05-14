<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KmTask extends Model
{
    protected $table = 'km_task';
    protected $primaryKey = 'task_id';
    public $timestamps = false;
    protected $fillable = ['task_name', 'back_color', 'font_color', 'sort_no'];
}
