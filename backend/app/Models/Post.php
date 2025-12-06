<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Post extends Model
{
    protected $fillable = [
        'user_id',
        'content',
        'image_path',
        'document_path',
        'document_name',
        'status',
        'approved_at',
        'approved_by',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
    ];

    /**
     * Get the user that owns the post
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the admin who approved the post
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Scope to get only approved posts
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    /**
     * Scope to get only pending posts
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }
}
