<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\SerialController;
use App\Http\Controllers\Api\WorkerController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\PlanController;
use App\Http\Controllers\Api\DisplaySettingsController;
use App\Http\Controllers\Api\SeedController;
use App\Http\Controllers\Api\LocationController;
use App\Http\Controllers\Api\LocationPlanController;

// 認証不要
Route::post('/login', [AuthController::class, 'login']);

// 認証必須
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);

    Route::get('/serial', [SerialController::class, 'index']);
    Route::get('/worker', [WorkerController::class, 'index']);
    Route::get('/task',   [TaskController::class, 'index']);

    Route::get('/plan',          [PlanController::class, 'index']);
    Route::post('/plan/search',  [PlanController::class, 'search']);
    Route::post('/plan',         [PlanController::class, 'store']);
    Route::delete('/plan',      [PlanController::class, 'destroy']);
    Route::put('/plan/{id}',    [PlanController::class, 'update']);
    Route::delete('/plan/{id}', [PlanController::class, 'destroyOne']);

    Route::get('/display-settings', [DisplaySettingsController::class, 'index']);
    Route::put('/display-settings', [DisplaySettingsController::class, 'update']);

    Route::get('/location', [LocationController::class, 'index']);

    Route::get('/location-plan',          [LocationPlanController::class, 'index']);
    Route::post('/location-plan/search',  [LocationPlanController::class, 'search']);
    Route::post('/location-plan',         [LocationPlanController::class, 'store']);
    Route::put('/location-plan/{id}',    [LocationPlanController::class, 'update']);
    Route::delete('/location-plan',      [LocationPlanController::class, 'destroy']);

    Route::post('/seed', [SeedController::class, 'seed']);
});
