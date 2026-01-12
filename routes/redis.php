<?php

use App\Http\Controllers\RedisExampleController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Redis Integration Routes
|--------------------------------------------------------------------------
|
| Routes for demonstrating Redis functionality in the application.
|
*/

Route::prefix('redis')->group(function () {
    Route::get('/cache-example', [RedisExampleController::class, 'cacheExample']);
    Route::get('/service-example', [RedisExampleController::class, 'serviceExample']);
    Route::get('/direct-example', [RedisExampleController::class, 'directExample']);
    Route::get('/list-example', [RedisExampleController::class, 'listExample']);
    Route::get('/hash-example', [RedisExampleController::class, 'hashExample']);
    Route::get('/info', [RedisExampleController::class, 'info']);
    
    // POST routes for more complex examples
    Route::post('/cache-example', [RedisExampleController::class, 'cacheExample']);
    Route::post('/service-example', [RedisExampleController::class, 'serviceExample']);
    Route::post('/direct-example', [RedisExampleController::class, 'directExample']);
    Route::post('/list-example', [RedisExampleController::class, 'listExample']);
    Route::post('/hash-example', [RedisExampleController::class, 'hashExample']);
});