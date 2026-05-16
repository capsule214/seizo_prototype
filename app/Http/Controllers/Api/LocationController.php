<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KmLocation;

class LocationController extends Controller
{
    public function index()
    {
        $locations = KmLocation::orderBy('sort_no')->orderBy('location_id')->get();

        return response()->json($locations->map(function ($loc) {
            return [
                'locationId'   => $loc->location_id,
                'locationName' => $loc->location_name,
                'sortNo'       => $loc->sort_no,
            ];
        }));
    }
}
