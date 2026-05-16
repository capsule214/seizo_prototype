<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kd_location_plan', function (Blueprint $table) {
            $table->id('location_plan_id');
            $table->unsignedBigInteger('location_id');
            $table->unsignedBigInteger('serial_id');
            $table->string('start_date');
            $table->string('end_date');
            $table->integer('deleted')->default(0);
            $table->foreign('location_id')->references('location_id')->on('km_location');
            $table->foreign('serial_id')->references('serial_id')->on('kd_serial');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kd_location_plan');
    }
};
