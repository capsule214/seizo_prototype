<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('km_location', function (Blueprint $table) {
            $table->id('location_id');
            $table->string('location_name');
            $table->integer('sort_no')->default(0);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('km_location');
    }
};
