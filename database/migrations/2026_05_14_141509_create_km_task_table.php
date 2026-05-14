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
        Schema::create('km_task', function (Blueprint $table) {
            $table->id('task_id');
            $table->string('task_name');
            $table->integer('back_color')->default(1);
            $table->integer('font_color')->default(6);
            $table->integer('sort_no')->default(0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('km_task');
    }
};
