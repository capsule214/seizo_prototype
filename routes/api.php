<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\SerialController;
use App\Http\Controllers\Api\WorkerController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\PlanController;
use App\Http\Controllers\Api\DisplaySettingsController;
use App\Http\Controllers\Api\SeedController;

Route::get('/serial', [SerialController::class, 'index']);
Route::get('/worker', [WorkerController::class, 'index']);
Route::get('/task', [TaskController::class, 'index']);

Route::get('/plan', [PlanController::class, 'index']);
Route::post('/plan', [PlanController::class, 'store']);
Route::delete('/plan', [PlanController::class, 'destroy']);
Route::put('/plan/{id}', [PlanController::class, 'update']);
Route::delete('/plan/{id}', [PlanController::class, 'destroyOne']);

Route::get('/display-settings', [DisplaySettingsController::class, 'index']);
Route::put('/display-settings', [DisplaySettingsController::class, 'update']);

Route::post('/seed', [SeedController::class, 'seed']);
