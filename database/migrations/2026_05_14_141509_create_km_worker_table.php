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
        Schema::create('km_worker', function (Blueprint $table) {
            $table->id('worker_id');
            $table->string('worker_name');
            $table->unsignedBigInteger('team_id');
            $table->foreign('team_id')->references('team_id')->on('km_team');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('km_worker');
    }
};
