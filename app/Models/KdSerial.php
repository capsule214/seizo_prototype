<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KdSerial extends Model
{
    protected $table = 'kd_serial';
    protected $primaryKey = 'serial_id';
    public $timestamps = false;
    protected $fillable = ['kisyu_id', 'serial_no', 'back_color', 'font_color'];

    public function dm_kisyu()
    {
        return $this->belongsTo(DmKisyu::class, 'kisyu_id', 'kisyu_id');
    }
}
