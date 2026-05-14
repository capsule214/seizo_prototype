<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KdSerial;

class SerialController extends Controller
{
    public function index()
    {
        $serials = KdSerial::with('dm_kisyu')
            ->orderBy('serial_id')
            ->get();

        return response()->json($serials->map(function ($s) {
            return [
                'serialId'   => $s->serial_id,
                'kisyuId'    => $s->kisyu_id,
                'kisyuName'  => $s->dm_kisyu ? $s->dm_kisyu->kisyu_name : '',
                'serialNo'   => $s->serial_no,
                'backColor'  => $s->back_color,
                'fontColor'  => $s->font_color,
                'sortNo'     => $s->dm_kisyu ? $s->dm_kisyu->sort_no : 0,
            ];
        }));
    }
}
