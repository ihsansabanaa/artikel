<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\SocialAuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/resend-verification', [AuthController::class, 'resendVerification']);

// Email verification route
Route::get('/email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])
    ->name('verification.verify');

// Google OAuth routes
Route::get('/auth/google', [SocialAuthController::class, 'redirectToGoogle']);
Route::get('/auth/google/callback', [SocialAuthController::class, 'handleGoogleCallback']);
Route::post('/auth/google/login', [SocialAuthController::class, 'loginWithGoogle']);

// Public posts route - approved posts for landing page
Route::get('/posts/approved', [PostController::class, 'getApprovedPosts']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // User posts routes
    Route::prefix('posts')->group(function () {
        Route::get('/my-posts', [PostController::class, 'getUserPosts']);
        Route::post('/', [PostController::class, 'store']);
        Route::delete('/{id}', [PostController::class, 'destroy']);
    });

    // Admin routes
    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('/users', [AdminController::class, 'getAllUsers']);
        Route::delete('/users/{id}', [AdminController::class, 'deleteUser']);
        Route::patch('/users/{id}/toggle-admin', [AdminController::class, 'toggleAdmin']);

        // Admin posts management
        Route::prefix('posts')->group(function () {
            Route::get('/pending', [PostController::class, 'getPendingPosts']);
            Route::patch('/{id}/approve', [PostController::class, 'approve']);
            Route::patch('/{id}/reject', [PostController::class, 'reject']);
            Route::delete('/{id}', [PostController::class, 'adminDelete']);
        });
    });
});
