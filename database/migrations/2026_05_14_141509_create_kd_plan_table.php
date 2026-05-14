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
        Schema::create('kd_plan', function (Blueprint $table) {
            $table->id('plan_id');
            $table->unsignedBigInteger('serial_id');
            $table->unsignedBigInteger('task_id');
            $table->unsignedBigInteger('assignee_id');
            $table->integer('deleted')->default(0);
            $table->string('start_date');
            $table->string('end_date');
            $table->foreign('serial_id')->references('serial_id')->on('kd_serial');
            $table->foreign('task_id')->references('task_id')->on('km_task');
            $table->foreign('assignee_id')->references('worker_id')->on('km_worker');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kd_plan');
    }
};
