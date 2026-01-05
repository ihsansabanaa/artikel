import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LandingPage.css';

const LandingPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [postInteractions, setPostInteractions] = useState({});
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState({});
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [detailPost, setDetailPost] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        // Fetch approved posts and check liked status
        const initializePosts = async () => {
            await fetchApprovedPosts();
        };
        
        initializePosts();

        // Auto refresh posts every 10 seconds to get updated counts
        const interval = setInterval(() => {
            fetchApprovedPosts();
        }, 10000); // 10 seconds

        return () => clearInterval(interval);
    }, []);

    const handleLike = async (postId) => {
        // Check if user is logged in
        if (!user) {
            alert('Silakan login terlebih dahulu untuk menyukai postingan');
            navigate('/login');
            return;
        }

        const token = localStorage.getItem('token');
        const isLiked = postInteractions[postId]?.liked || false;

        console.log('handleLike:', { postId, isLiked, currentInteractions: postInteractions[postId] });

        try {
            const endpoint = isLiked 
                ? `http://localhost:8000/api/posts/${postId}/unlike`
                : `http://localhost:8000/api/posts/${postId}/like`;

            console.log('Calling endpoint:', endpoint);

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            const data = await response.json();
            console.log('Response data:', data);

            if (response.ok) {
                // Update local state
                setPostInteractions(prev => ({
                    ...prev,
                    [postId]: {
                        liked: data.liked,
                    }
                }));

                // Update posts with new count
                setPosts(prev => prev.map(p => 
                    p.id === postId ? { ...p, likes_count: data.likes_count } : p
                ));

                // Update detailPost if it's the same post
                if (detailPost && detailPost.id === postId) {
                    setDetailPost(prev => ({ ...prev, likes_count: data.likes_count }));
                }
            } else {
                console.error('API error:', data);
                if (response.status === 401) {
                    alert('Sesi Anda telah berakhir. Silakan login kembali.');
                    navigate('/login');
                }
            }
        } catch (error) {
            console.error('Failed to like/unlike post:', error);
        }
    };

    const handleComment = (post) => {
        if (!user) {
            navigate('/login');
            return;
        }
        setSelectedPost(post);
        setShowCommentModal(true);
        // Fetch comments when modal opens
        fetchComments(post.id);
    };

    const submitComment = async (postId = null) => {
        if (!commentText.trim()) return;
        
        const targetPostId = postId || selectedPost?.id;
        if (!targetPostId) return;

        const token = localStorage.getItem('token');

        try {
            const response = await fetch(`http://localhost:8000/api/posts/${targetPostId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ comment: commentText })
            });

            const data = await response.json();

            if (response.ok) {
                // Update posts with new comments count
                setPosts(prev => prev.map(p => 
                    p.id === targetPostId ? { ...p, comments_count: data.comments_count } : p
                ));

                // Update detailPost if it's the same post
                if (detailPost && detailPost.id === targetPostId) {
                    setDetailPost(prev => ({ ...prev, comments_count: data.comments_count }));
                }

                // Fetch fresh comments
                fetchComments(targetPostId);

                setCommentText('');
                
                // Close modal if it was from comment modal
                if (!postId && selectedPost) {
                    setShowCommentModal(false);
                }
            } else {
                console.error('Failed to add comment:', data);
                alert(data.message || 'Failed to add comment');
            }
        } catch (error) {
            console.error('Failed to add comment:', error);
            alert('Failed to add comment');
        }
    };

    const fetchComments = async (postId) => {
        try {
            const response = await fetch(`http://localhost:8000/api/posts/${postId}/comments`);
            const data = await response.json();
            
            setComments(prev => ({
                ...prev,
                [postId]: data.comments
            }));
        } catch (error) {
            console.error('Failed to fetch comments:', error);
        }
    };

    const handleDownload = async (post) => {
        // Check if user is logged in
        if (!user) {
            alert('Silakan login terlebih dahulu untuk mengunduh dokumen');
            navigate('/login');
            return;
        }

        const token = localStorage.getItem('token');

        try {
            const response = await fetch(`http://localhost:8000/api/posts/${post.id}/download`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
            });

            if (response.ok) {
                // Get filename from content-disposition or use default
                const contentDisposition = response.headers.get('content-disposition');
                let filename = 'document';
                if (contentDisposition) {
                    const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                    if (filenameMatch) {
                        filename = filenameMatch[1];
                    }
                }

                // Convert response to blob and download
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                const data = await response.json();
                alert(data.message || 'Gagal mengunduh dokumen');
                if (response.status === 401) {
                    navigate('/login');
                }
            }
        } catch (error) {
            console.error('Failed to download document:', error);
            alert('Gagal mengunduh dokumen');
        }
    };

    const handleRepost = (postId) => {
        if (!user) {
            navigate('/login');
            return;
        }
        setPostInteractions(prev => {
            const current = prev[postId] || { likes: 0, comments: 0, reposts: 0, views: 0, liked: false };
            const newInteractions = {
                ...prev,
                [postId]: {
                    ...current,
                    reposts: current.reposts + 1
                }
            };
            localStorage.setItem('postInteractions', JSON.stringify(newInteractions));
            return newInteractions;
        });
    };

    const incrementViews = async (postId) => {
        const token = localStorage.getItem('token');

        try {
            const response = await fetch(`http://localhost:8000/api/posts/${postId}/view`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
            });

            const data = await response.json();

            if (response.ok) {
                // Update posts with new count
                setPosts(prev => prev.map(p => 
                    p.id === postId ? { ...p, views_count: data.views_count } : p
                ));

                // Update detailPost if it's the same post
                if (detailPost && detailPost.id === postId) {
                    setDetailPost(prev => ({ ...prev, views_count: data.views_count }));
                }
            }
        } catch (error) {
            console.error('Failed to increment views:', error);
        }
    };

    const openPostDetail = (post) => {
        setDetailPost(post);
        setShowDetailModal(true);
        fetchComments(post.id);
        incrementViews(post.id);
    };

    const fetchApprovedPosts = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/posts/approved');
            const data = await response.json();
            setPosts(data.posts);
            
            // Check liked status for each post
            const token = localStorage.getItem('token');
            const likedStatus = {};

            // Use Promise.all for parallel requests
            await Promise.all(data.posts.map(async (post) => {
                try {
                    const likeResponse = await fetch(`http://localhost:8000/api/posts/${post.id}/check-like`, {
                        headers: {
                            ...(token && { 'Authorization': `Bearer ${token}` })
                        }
                    });
                    const likeData = await likeResponse.json();
                    likedStatus[post.id] = { liked: likeData.liked };
                } catch (error) {
                    console.error('Failed to check like status:', error);
                    likedStatus[post.id] = { liked: false };
                }
            }));

            setPostInteractions(likedStatus);
        } catch (error) {
            console.error('Failed to fetch posts:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`article-website ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
            {/* Header */}
            <header className="site-header">
                <div className="container">
                    <div className="header-wrapper">
                        <div className="logo-section">
                            <h1 className="site-logo" onClick={() => navigate('/')}>ArticleHub</h1>
                            <p className="site-tagline">Baca, Tulis, Bagikan</p>
                        </div>
                        
                        {/* Horizontal Navigation Menu */}
                        {user && (
                            <nav className="horizontal-nav">
                                <button onClick={() => navigate('/')} className="horizontal-nav-item active">
                                    Beranda
                                </button>
                                <button onClick={() => navigate('/dashboard')} className="horizontal-nav-item">
                                    Tulis Artikel
                                </button>
                                <button onClick={() => navigate('/my-posts')} className="horizontal-nav-item">
                                    Artikel Saya
                                </button>
                                {user.is_admin && (
                                    <button onClick={() => navigate('/admin')} className="horizontal-nav-item">
                                        Admin
                                    </button>
                                )}
                            </nav>
                        )}
                        
                        <nav className="main-nav">
                            {user ? (
                                <>
                                    <button onClick={() => navigate('/profile')} className="user-menu-btn">
                                        {user.profile_image || user.avatar ? (
                                            <img src={user.profile_image || user.avatar} alt={user.name} />
                                        ) : (
                                            <span>{user.name.charAt(0).toUpperCase()}</span>
                                        )}
                                    </button>
                                    <button onClick={async () => {
                                        const token = localStorage.getItem('token');
                                        try {
                                            await fetch('http://localhost:8000/api/logout', {
                                                method: 'POST',
                                                headers: {
                                                    'Authorization': `Bearer ${token}`,
                                                    'Content-Type': 'application/json',
                                                },
                                            });
                                        } catch (error) {
                                            console.error('Logout error:', error);
                                        }
                                        localStorage.removeItem('token');
                                        localStorage.removeItem('user');
                                        window.location.href = '/';
                                    }} className="btn-nav-logout">
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => navigate('/login')} className="btn-nav-login">
                                        Masuk
                                    </button>
                                    <button onClick={() => navigate('/register')} className="btn-nav-signup">
                                        Daftar
                                    </button>
                                </>
                            )}
                        </nav>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="main-content">
                <div className="container">
                    <div className="content-wrapper">
                        {/* Welcome Widget */}
                        {user && (
                            <div className="welcome-widget">
                                <h3 className="widget-title">Selamat Datang, {user.name}!</h3>
                                <p className="widget-description">
                                    Mulai berbagi cerita dan pengetahuan Anda dengan ribuan pembaca kami. Tulis artikel baru sekarang!
                                </p>
                                <button onClick={() => navigate('/dashboard')} className="btn-widget-cta">
                                    Tulis Artikel Sekarang
                                </button>
                            </div>
                        )}

                        {/* Articles Section */}
                        <section className="articles-section">
                            <h2>Artikel Populer</h2>
                            {loading ? (
                                <div className="loading-state">
                                    <div className="loading-spinner"></div>
                                    <p>Memuat artikel...</p>
                                </div>
                        ) : posts.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">📝</div>
                                <h3>Belum Ada Postingan</h3>
                                <p>Jadilah yang pertama berbagi sesuatu yang menarik!</p>
                                {!user && (
                                    <button onClick={() => navigate('/register')} className="btn-start">
                                        Mulai Sekarang
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="articles-grid">
                                {posts.map((post) => (
                                    <article key={post.id} className="article-card" onClick={() => openPostDetail(post)}>
                                        {/* Article Image */}
                                        <div className="article-image-wrapper">
                                            {post.image_path ? (
                                                <div className="article-image">
                                                    <img
                                                        src={`http://localhost:8000/storage/${post.image_path}`}
                                                        alt="Article cover"
                                                        loading="lazy"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="article-image article-image-placeholder">
                                                    <svg viewBox="0 0 24 24" width="80" height="80" fill="#cbd5e0">
                                                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 11.5c.83 0 1.5-.67 1.5-1.5S9.83 8.5 9 8.5 7.5 9.17 7.5 10s.67 1.5 1.5 1.5zM17 17H7v-2l2-2 1.5 1.5L13 12l4 4v1z"/>
                                                    </svg>
                                                </div>
                                            )}
                                        </div>

                                        {/* Article Content */}
                                        <div className="article-content">
                                            <div className="article-header-info">
                                                <div className="article-meta">
                                                    <div className="author-avatar">
                                                        {post.user.profile_image || post.user.avatar ? (
                                                            <img src={post.user.profile_image || post.user.avatar} alt={post.user.name} />
                                                        ) : (
                                                            <div className="author-avatar-placeholder">
                                                                {post.user.name.charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="author-info">
                                                        <span className="author-name">{post.user.name}</span>
                                                        <span className="article-date">
                                                            {new Date(post.approved_at).toLocaleDateString('id-ID', { 
                                                                day: 'numeric',
                                                                month: 'long',
                                                                year: 'numeric'
                                                            })} | {Math.ceil(post.content?.length / 200) || 1} menit lalu
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {post.content && (
                                                <h3 className="article-title">{post.content.length > 100 ? post.content.substring(0, 100) + '...' : post.content}</h3>
                                            )}

                                            <div className="article-stats">
                                                <span className={`stat-item ${postInteractions[post.id]?.liked ? 'liked' : ''}`}
                                                    onClick={(e) => { e.stopPropagation(); handleLike(post.id); }}>
                                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                                    </svg>
                                                    {post.likes_count || 0}
                                                </span>
                                                <span className="stat-item"
                                                    onClick={(e) => { e.stopPropagation(); handleComment(post); }}>
                                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
                                                    </svg>
                                                    {post.comments_count || 0}
                                                </span>
                                                <span className="stat-item">
                                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                                                    </svg>
                                                    {post.views_count || 0}
                                                </span>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                        </section>
                    </div>
                </div>
            </main>

            {/* Comment Modal */}
            {showCommentModal && selectedPost && (
                <div className="comment-modal-overlay" onClick={() => setShowCommentModal(false)}>
                    <div className="comment-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="comment-modal-header">
                            <h3>Komentar</h3>
                            <button onClick={() => setShowCommentModal(false)} className="modal-close-btn">
                                ✕
                            </button>
                        </div>

                        <div className="comment-modal-post">
                            <div className="post-preview">
                                <div className="post-author-small">
                                    {selectedPost.user.profile_image || selectedPost.user.avatar ? (
                                        <img src={selectedPost.user.profile_image || selectedPost.user.avatar} alt={selectedPost.user.name} className="avatar-small" />
                                    ) : (
                                        <div className="avatar-small-placeholder">
                                            {selectedPost.user.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <span className="author-name-small">{selectedPost.user.name}</span>
                                </div>
                                {selectedPost.content && (
                                    <p className="post-text-preview">{selectedPost.content}</p>
                                )}
                            </div>
                        </div>

                        <div className="comment-list">
                            {comments[selectedPost.id]?.length > 0 ? (
                                comments[selectedPost.id].map((comment) => (
                                    <div key={comment.id} className="comment-item">
                                        {comment.user?.profile_image || comment.user?.avatar ? (
                                            <img src={comment.user.profile_image || comment.user.avatar} alt={comment.user.name} className="comment-avatar" />
                                        ) : (
                                            <div className="comment-avatar-placeholder">
                                                {comment.user?.name?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                        )}
                                        <div className="comment-content">
                                            <div className="comment-header">
                                                <span className="comment-author">{comment.user?.name || 'Unknown'}</span>
                                                <span className="comment-date">
                                                    {new Date(comment.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="comment-text">{comment.comment}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="no-comments">Belum ada komentar. Jadilah yang pertama berkomentar!</p>
                            )}
                        </div>

                        <div className="comment-input-container">
                            <div className="comment-avatar-placeholder">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <textarea
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="Tulis komentar Anda..."
                                className="comment-textarea"
                                rows="3"
                            />
                        </div>

                        <div className="comment-modal-footer">
                            <button onClick={submitComment} className="btn-submit-comment" disabled={!commentText.trim()}>
                                Kirim Komentar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail Post Modal */}
            {showDetailModal && detailPost && (
                <div className="detail-modal-overlay" onClick={() => setShowDetailModal(false)}>
                    <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="detail-modal-header">
                            <h3>Detail Postingan</h3>
                            <button onClick={() => setShowDetailModal(false)} className="modal-close-btn">
                                ✕
                            </button>
                        </div>

                        <div className="detail-modal-body">
                            {/* Post Author */}
                            <div className="detail-author">
                                {detailPost.user.profile_image || detailPost.user.avatar ? (
                                    <img src={detailPost.user.profile_image || detailPost.user.avatar} alt={detailPost.user.name} className="detail-avatar" />
                                ) : (
                                    <div className="detail-avatar-placeholder">
                                        {detailPost.user.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className="detail-author-info">
                                    <span className="detail-author-name">{detailPost.user.name}</span>
                                    <span className="detail-post-date">
                                        {new Date(detailPost.approved_at).toLocaleDateString('id-ID', { 
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                            </div>

                            {/* Post Content */}
                            {detailPost.content && (
                                <div className="detail-content">
                                    <p>{detailPost.content}</p>
                                </div>
                            )}

                            {/* Post Image */}
                            {detailPost.image_path && (
                                <div className="detail-image">
                                    <img
                                        src={`http://localhost:8000/storage/${detailPost.image_path}`}
                                        alt="Post content"
                                    />
                                </div>
                            )}

                            {/* Post Document */}
                            {detailPost.document_path && (
                                <div className="detail-document">
                                    <svg viewBox="0 0 24 24" width="40" height="40" className="detail-doc-icon" fill="#495057">
                                        <g><path d="M7.5 4h9v2h-9V4zm0 6h9v2h-9v-2zm0 6h9v2h-9v-2zM5 2v20h14V2H5zm12 18H7V4h10v16z"></path></g>
                                    </svg>
                                    <div className="detail-doc-info">
                                        <div className="detail-doc-name">{detailPost.document_name}</div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDownload(detailPost);
                                            }}
                                            className="detail-doc-link"
                                        >
                                            📥 Download Dokumen
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Post Stats */}
                            <div className="detail-stats">
                                <div 
                                    className={`detail-stat-item clickable ${postInteractions[detailPost.id]?.liked ? 'liked' : ''}`}
                                    onClick={(e) => { e.stopPropagation(); handleLike(detailPost.id); }}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                        <g><path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"></path></g>
                                    </svg>
                                    <span>{detailPost.likes_count || 0} Likes</span>
                                </div>
                                <div 
                                    className="detail-stat-item clickable"
                                    onClick={(e) => { e.stopPropagation(); handleComment(detailPost); }}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                        <g><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z"></path></g>
                                    </svg>
                                    <span>{detailPost.comments_count || 0} Comments</span>
                                </div>
                                <div 
                                    className="detail-stat-item clickable"
                                    onClick={(e) => { e.stopPropagation(); handleRepost(detailPost.id); }}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                        <g><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"></path></g>
                                    </svg>
                                    <span>{detailPost.reposts_count || 0} Reposts</span>
                                </div>
                                <div className="detail-stat-item">
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                        <g><path d="M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21l.004-10h2L6 21H4zm9.248 0v-7h2v7h-2z"></path></g>
                                    </svg>
                                    <span>{detailPost.views_count || 0} Views</span>
                                </div>
                            </div>

                            {/* Comments Section */}
                            <div className="detail-comments">
                                <h4>Komentar ({comments[detailPost.id]?.length || 0})</h4>
                                {comments[detailPost.id]?.length > 0 ? (
                                    <div className="detail-comments-list">
                                        {comments[detailPost.id].map((comment) => (
                                            <div key={comment.id} className="detail-comment-item">
                                                <div className="detail-comment-avatar">
                                                    {comment.user?.name?.charAt(0).toUpperCase() || comment.user?.charAt(0).toUpperCase() || 'U'}
                                                </div>
                                                <div className="detail-comment-content">
                                                    <div className="detail-comment-header">
                                                        <span className="detail-comment-author">{comment.user?.name || comment.user || 'Anonymous'}</span>
                                                        <span className="detail-comment-date">
                                                            {new Date(comment.created_at || comment.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </span>
                                                    </div>
                                                    <p className="detail-comment-text">{comment.comment || comment.text}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="detail-no-comments">Belum ada komentar</p>
                                )}
                                
                                {/* Comment Form */}
                                <div className="detail-comment-form">
                                    <div className="detail-comment-form-avatar">
                                        {user ? user.name.charAt(0).toUpperCase() : 'G'}
                                    </div>
                                    <div className="detail-comment-form-input">
                                        <textarea
                                            placeholder={user ? "Tulis komentar..." : "Login untuk berkomentar"}
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                            disabled={!user}
                                            rows="3"
                                        />
                                        {user && (
                                            <button
                                                className="btn-submit-comment"
                                                onClick={() => submitComment(detailPost.id)}
                                                disabled={!commentText.trim()}
                                            >
                                                Kirim Komentar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LandingPage;
