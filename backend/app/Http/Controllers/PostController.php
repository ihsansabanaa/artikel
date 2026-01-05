<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\Comment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PostController extends Controller
{
    /**
     * Get all approved posts for landing page
     */
    public function getApprovedPosts()
    {
        $posts = Post::with('user:id,name,email,avatar,profile_image')
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
        $request->validate([
            'reject_reason' => 'required|string|max:1000',
        ]);

        $post = Post::findOrFail($id);

        $post->update([
            'status' => 'rejected',
            'reject_reason' => $request->reject_reason,
            'rejected_at' => now(),
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

    /**
     * Like a post
     */
    public function like(Request $request, $id)
    {
        $post = Post::findOrFail($id);
        $userId = $request->user() ? $request->user()->id : null;
        $ipAddress = $request->ip();

        \Log::info('Like Request', [
            'post_id' => $id,
            'user_id' => $userId,
            'user' => $request->user(),
            'ip_address' => $ipAddress,
            'has_auth_header' => $request->hasHeader('Authorization')
        ]);

        // Check if already liked
        $query = \DB::table('post_interactions')
            ->where('post_id', $id)
            ->where('type', 'like');
            
        if ($userId) {
            $query->where('user_id', $userId);
        } else {
            $query->whereNull('user_id')
                  ->where('ip_address', $ipAddress);
        }
        
        $existing = $query->first();

        if ($existing) {
            return response()->json([
                'message' => 'Already liked',
                'liked' => true,
                'likes_count' => $post->likes_count,
            ]);
        }

        // Create like interaction
        \DB::table('post_interactions')->insert([
            'post_id' => $id,
            'user_id' => $userId,
            'type' => 'like',
            'ip_address' => $ipAddress,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Increment likes count
        $post->increment('likes_count');

        return response()->json([
            'message' => 'Post liked',
            'liked' => true,
            'likes_count' => $post->fresh()->likes_count,
        ]);
    }

    /**
     * Unlike a post
     */
    public function unlike(Request $request, $id)
    {
        $post = Post::findOrFail($id);
        $userId = $request->user() ? $request->user()->id : null;
        $ipAddress = $request->ip();

        // Delete like interaction
        $query = \DB::table('post_interactions')
            ->where('post_id', $id)
            ->where('type', 'like');
            
        if ($userId) {
            $query->where('user_id', $userId);
        } else {
            $query->whereNull('user_id')
                  ->where('ip_address', $ipAddress);
        }
        
        $deleted = $query->delete();

        if ($deleted) {
            // Decrement likes count
            $post->decrement('likes_count');
        }

        return response()->json([
            'message' => 'Post unliked',
            'liked' => false,
            'likes_count' => $post->fresh()->likes_count,
        ]);
    }

    /**
     * Increment view count
     */
    public function incrementView(Request $request, $id)
    {
        $post = Post::findOrFail($id);
        $userId = $request->user() ? $request->user()->id : null;
        $ipAddress = $request->ip();

        // Check if already viewed
        $query = \DB::table('post_interactions')
            ->where('post_id', $id)
            ->where('type', 'view');
            
        if ($userId) {
            $query->where('user_id', $userId);
        } else {
            $query->whereNull('user_id')
                  ->where('ip_address', $ipAddress);
        }
        
        $existing = $query->first();

        if (!$existing) {
            // Create view interaction
            \DB::table('post_interactions')->insert([
                'post_id' => $id,
                'user_id' => $userId,
                'type' => 'view',
                'ip_address' => $ipAddress,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Increment views count
            $post->increment('views_count');
        }

        return response()->json([
            'views_count' => $post->fresh()->views_count,
        ]);
    }

    /**
     * Check if user liked a post
     */
    public function checkLike(Request $request, $id)
    {
        $userId = $request->user() ? $request->user()->id : null;
        $ipAddress = $request->ip();

        $query = \DB::table('post_interactions')
            ->where('post_id', $id)
            ->where('type', 'like');
            
        if ($userId) {
            $query->where('user_id', $userId);
        } else {
            $query->whereNull('user_id')
                  ->where('ip_address', $ipAddress);
        }
        
        $liked = $query->exists();

        \Log::info('checkLike', [
            'post_id' => $id,
            'user_id' => $userId,
            'ip_address' => $ipAddress,
            'liked' => $liked,
            'query_sql' => $query->toSql()
        ]);

        return response()->json([
            'liked' => $liked,
        ]);
    }

    /**
     * Get comments for a post
     */
    public function getComments($id)
    {
        $comments = Comment::with('user:id,name,profile_image,avatar')
            ->where('post_id', $id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'comments' => $comments,
        ]);
    }

    /**
     * Add a comment to a post
     */
    public function addComment(Request $request, $id)
    {
        $request->validate([
            'comment' => 'required|string|max:1000',
        ]);

        $post = Post::findOrFail($id);

        $comment = Comment::create([
            'post_id' => $id,
            'user_id' => $request->user()->id,
            'comment' => $request->comment,
        ]);

        // Increment comments count
        $post->increment('comments_count');

        // Load user relationship
        $comment->load('user:id,name,profile_image,avatar');

        return response()->json([
            'message' => 'Comment added',
            'comment' => $comment,
            'comments_count' => $post->fresh()->comments_count,
        ]);
    }

    /**
     * Download document (auth required)
     */
    public function downloadDocument(Request $request, $id)
    {
        $post = Post::findOrFail($id);

        if (!$post->document_path) {
            return response()->json([
                'message' => 'Document not found'
            ], 404);
        }

        $filePath = storage_path('app/public/' . $post->document_path);

        if (!file_exists($filePath)) {
            return response()->json([
                'message' => 'File not found'
            ], 404);
        }

        return response()->download($filePath);
    }
}
