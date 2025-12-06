<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Str;

class SocialAuthController extends Controller
{
    /**
     * Redirect to Google OAuth
     */
    public function redirectToGoogle()
    {
        /** @var \Laravel\Socialite\Two\GoogleProvider $provider */
        $provider = Socialite::driver('google');
        
        return $provider->stateless()->redirect();
    }

    /**
     * Handle Google OAuth callback
     */
    public function handleGoogleCallback(Request $request)
    {
        try {
            /** @var \Laravel\Socialite\Two\GoogleProvider $provider */
            $provider = Socialite::driver('google');
            $googleUser = $provider->stateless()->user();

            // Find or create user
            $user = User::where('email', $googleUser->getEmail())->first();

            if ($user) {
                // Update Google ID if not set
                if (!$user->google_id) {
                    $user->update([
                        'google_id' => $googleUser->getId(),
                        'avatar' => $googleUser->getAvatar(),
                    ]);
                }
                
                // Mark email as verified for Google users
                if (!$user->hasVerifiedEmail()) {
                    $user->markEmailAsVerified();
                }
            } else {
                // Create new user
                $user = User::create([
                    'name' => $googleUser->getName(),
                    'email' => $googleUser->getEmail(),
                    'google_id' => $googleUser->getId(),
                    'avatar' => $googleUser->getAvatar(),
                    'password' => null, // No password for OAuth users
                    'email_verified_at' => now(), // Auto verify Google users
                ]);
            }

            // Create token
            $token = $user->createToken('google_auth_token')->plainTextToken;

            // Redirect to frontend with token
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
            return redirect()->away(
                $frontendUrl . '/auth/callback?token=' . $token . 
                '&user=' . urlencode(json_encode($user))
            );

        } catch (\Exception $e) {
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
            return redirect()->away(
                $frontendUrl . '/login?error=' . urlencode('Authentication failed')
            );
        }
    }

    /**
     * Login with Google (alternative method for SPA)
     */
    public function loginWithGoogle(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
        ]);

        try {
            // Verify Google token
            $client = new \Google_Client(['client_id' => config('services.google.client_id')]);
            $payload = $client->verifyIdToken($request->token);

            if (!$payload) {
                return response()->json([
                    'message' => 'Invalid Google token',
                ], 401);
            }

            // Find or create user
            $user = User::where('email', $payload['email'])->first();

            if ($user) {
                if (!$user->google_id) {
                    $user->update([
                        'google_id' => $payload['sub'],
                        'avatar' => $payload['picture'] ?? null,
                    ]);
                }
                
                // Mark email as verified for Google users
                if (!$user->hasVerifiedEmail()) {
                    $user->markEmailAsVerified();
                }
            } else {
                $user = User::create([
                    'name' => $payload['name'],
                    'email' => $payload['email'],
                    'google_id' => $payload['sub'],
                    'avatar' => $payload['picture'] ?? null,
                    'password' => null,
                    'email_verified_at' => now(), // Auto verify Google users
                ]);
            }

            $token = $user->createToken('google_auth_token')->plainTextToken;

            return response()->json([
                'message' => 'Login successful',
                'user' => $user,
                'is_admin' => $user->is_admin,
                'access_token' => $token,
                'token_type' => 'Bearer',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Authentication failed: ' . $e->getMessage(),
            ], 401);
        }
    }
}
