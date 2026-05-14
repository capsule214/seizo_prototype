<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('kd_serial', function (Blueprint $table) {
            $table->id('serial_id');
            $table->unsignedBigInteger('kisyu_id');
            $table->string('serial_no');
            $table->integer('back_color')->default(1);
            $table->integer('font_color')->default(6);
            $table->foreign('kisyu_id')->references('kisyu_id')->on('dm_kisyu');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kd_serial');
    }
};
