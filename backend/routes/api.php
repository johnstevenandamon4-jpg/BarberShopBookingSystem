<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BarberController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\AdminDashboardController;
use App\Http\Controllers\Api\CustomerNotificationController;

// Public authentication routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Public read-only barber routes
Route::get('/barbers', [BarberController::class, 'index']);
Route::get('/barbers/{barber}', [BarberController::class, 'show']);

// Public read-only service routes
Route::get('/services', [ServiceController::class, 'index']);
Route::get('/services/{service}', [ServiceController::class, 'show']);

// Routes requiring authentication
Route::middleware('auth:sanctum')->group(function () {
    // Authentication
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Customer notifications
    Route::get('/notifications', [
        CustomerNotificationController::class,
        'index',
    ]);

    Route::patch('/notifications/{customerNotification}/read', [
        CustomerNotificationController::class,
        'markAsRead',
    ]);

    // Appointment management
    Route::post(
        '/appointments/{appointment}/complete',
        [AppointmentController::class, 'complete']
    );

    Route::apiResource('appointments', AppointmentController::class);

    // Administrator-only routes
    Route::middleware('admin')->group(function () {
        // Dashboard statistics
        Route::get('/admin/dashboard', [
            AdminDashboardController::class,
            'index',
        ]);

        // Barber management
        Route::apiResource('barbers', BarberController::class)
            ->except(['index', 'show']);

        // Service management
        Route::apiResource('services', ServiceController::class)
            ->except(['index', 'show']);
    });
});
