<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    /**
     * Get all users
     */
    public function getAllUsers()
    {
        $users = User::select('id', 'name', 'email', 'is_admin', 'email_verified_at', 'created_at')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'users' => $users,
        ]);
    }

    /**
     * Delete user
     */
    public function deleteUser($id)
    {
        $user = User::findOrFail($id);

        // Prevent deleting your own account
        if ($user->id === auth()->id()) {
            return response()->json([
                'message' => 'You cannot delete your own account.',
            ], 403);
        }

        $user->delete();

        return response()->json([
            'message' => 'User deleted successfully.',
        ]);
    }

    /**
     * Toggle admin status
     */
    public function toggleAdmin($id)
    {
        $user = User::findOrFail($id);

        // Prevent toggling your own admin status
        if ($user->id === auth()->id()) {
            return response()->json([
                'message' => 'You cannot change your own admin status.',
            ], 403);
        }

        $user->is_admin = !$user->is_admin;
        $user->save();

        return response()->json([
            'message' => 'User admin status updated successfully.',
            'user' => $user,
        ]);
    }
}
