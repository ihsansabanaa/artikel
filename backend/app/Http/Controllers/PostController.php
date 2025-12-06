<?php

namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PostController extends Controller
{
    /**
     * Get all approved posts for landing page
     */
    public function getApprovedPosts()
    {
        $posts = Post::with('user:id,name,avatar')
            ->approved()
            ->orderBy('approved_at', 'desc')
            ->get();

        return response()->json([
            'posts' => $posts,
        ]);
    }

    /**
     * Get user's own posts
     */
    public function getUserPosts(Request $request)
    {
        $posts = Post::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'posts' => $posts,
        ]);
    }

    /**
     * Create a new post
     */
    public function store(Request $request)
    {
        $request->validate([
            'content' => 'nullable|string|max:5000',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120', // 5MB
            'document' => 'nullable|file|mimes:pdf,doc,docx,txt|max:10240', // 10MB
        ], [
            'image.max' => 'Image size must not exceed 5MB.',
            'document.max' => 'Document size must not exceed 10MB.',
        ]);

        // Validate at least one field is provided
        if (!$request->content && !$request->hasFile('image') && !$request->hasFile('document')) {
            return response()->json([
                'message' => 'Please provide at least one of: content, image, or document.',
            ], 422);
        }

        $data = [
            'user_id' => $request->user()->id,
            'content' => $request->content,
            'status' => 'pending',
        ];

        // Handle image upload
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('posts/images', 'public');
            $data['image_path'] = $imagePath;
        }

        // Handle document upload
        if ($request->hasFile('document')) {
            $document = $request->file('document');
            $documentPath = $document->store('posts/documents', 'public');
            $data['document_path'] = $documentPath;
            $data['document_name'] = $document->getClientOriginalName();
        }

        $post = Post::create($data);

        return response()->json([
            'message' => 'Post created successfully. Waiting for admin approval.',
            'post' => $post,
        ], 201);
    }

    /**
     * Delete user's own post
     */
    public function destroy(Request $request, $id)
    {
        $post = Post::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        // Delete files if exist
        if ($post->image_path) {
            Storage::disk('public')->delete($post->image_path);
        }
        if ($post->document_path) {
            Storage::disk('public')->delete($post->document_path);
        }

        $post->delete();

        return response()->json([
            'message' => 'Post deleted successfully.',
        ]);
    }

    /**
     * Get all pending posts (Admin only)
     */
    public function getPendingPosts()
    {
        $posts = Post::with('user:id,name,email,avatar')
            ->pending()
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'posts' => $posts,
        ]);
    }

    /**
     * Approve a post (Admin only)
     */
    public function approve(Request $request, $id)
    {
        $post = Post::findOrFail($id);

        $post->update([
            'status' => 'approved',
            'approved_at' => now(),
            'approved_by' => $request->user()->id,
        ]);

        return response()->json([
            'message' => 'Post approved successfully.',
            'post' => $post,
        ]);
    }

    /**
     * Reject a post (Admin only)
     */
    public function reject(Request $request, $id)
    {
        $post = Post::findOrFail($id);

        $post->update([
            'status' => 'rejected',
        ]);

        return response()->json([
            'message' => 'Post rejected successfully.',
            'post' => $post,
        ]);
    }

    /**
     * Delete any post (Admin only)
     */
    public function adminDelete($id)
    {
        $post = Post::findOrFail($id);

        // Delete files if exist
        if ($post->image_path) {
            Storage::disk('public')->delete($post->image_path);
        }
        if ($post->document_path) {
            Storage::disk('public')->delete($post->document_path);
        }

        $post->delete();

        return response()->json([
            'message' => 'Post deleted successfully.',
        ]);
    }
}
