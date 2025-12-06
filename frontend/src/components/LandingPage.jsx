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

    useEffect(() => {
        // Fetch approved posts - no redirect, everyone can see the feed
        fetchApprovedPosts();
        // Initialize interactions from localStorage
        const savedInteractions = localStorage.getItem('postInteractions');
        if (savedInteractions) {
            setPostInteractions(JSON.parse(savedInteractions));
        }
        // Load comments from localStorage
        const savedComments = localStorage.getItem('postComments');
        if (savedComments) {
            setComments(JSON.parse(savedComments));
        }
    }, []);

    const handleLike = (postId) => {
        setPostInteractions(prev => {
            const current = prev[postId] || { likes: 0, comments: 0, reposts: 0, views: 0, liked: false };
            const newInteractions = {
                ...prev,
                [postId]: {
                    ...current,
                    likes: current.liked ? current.likes - 1 : current.likes + 1,
                    liked: !current.liked
                }
            };
            localStorage.setItem('postInteractions', JSON.stringify(newInteractions));
            return newInteractions;
        });
    };

    const handleComment = (post) => {
        if (!user) {
            navigate('/login');
            return;
        }
        setSelectedPost(post);
        setShowCommentModal(true);
    };

    const submitComment = () => {
        if (!commentText.trim()) return;
        
        const newComment = {
            id: Date.now(),
            user: user.name,
            text: commentText,
            date: new Date().toISOString()
        };

        // Add comment to local state
        setComments(prev => {
            const postComments = prev[selectedPost.id] || [];
            const updated = {
                ...prev,
                [selectedPost.id]: [...postComments, newComment]
            };
            localStorage.setItem('postComments', JSON.stringify(updated));
            return updated;
        });

        // Update comment count
        setPostInteractions(prev => {
            const current = prev[selectedPost.id] || { likes: 0, comments: 0, reposts: 0, views: 0, liked: false };
            const newInteractions = {
                ...prev,
                [selectedPost.id]: { ...current, comments: (comments[selectedPost.id]?.length || 0) + 1 }
            };
            localStorage.setItem('postInteractions', JSON.stringify(newInteractions));
            return newInteractions;
        });

        setCommentText('');
        setShowCommentModal(false);
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

    const incrementViews = (postId) => {
        setPostInteractions(prev => {
            const current = prev[postId] || { likes: 0, comments: 0, reposts: 0, views: 0, liked: false };
            const newInteractions = {
                ...prev,
                [postId]: { ...current, views: current.views + 1 }
            };
            localStorage.setItem('postInteractions', JSON.stringify(newInteractions));
            return newInteractions;
        });
    };

    const openPostDetail = (post) => {
        setDetailPost(post);
        setShowDetailModal(true);
        incrementViews(post.id);
    };

    const fetchApprovedPosts = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/posts/approved');
            const data = await response.json();
            setPosts(data.posts);
        } catch (error) {
            console.error('Failed to fetch posts:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="twitter-layout">
            {/* Fixed Header */}
            <header className="top-header">
                <div className="header-content">
                    <div className="logo">
                        <h2 className="logo-text">ArticleHub</h2>
                    </div>
                    <nav className="header-nav">
                        {user ? (
                            <span className="user-name">Hi, {user.name}</span>
                        ) : (
                            <>
                                <button onClick={() => navigate('/login')} className="btn-login">
                                    Sign in
                                </button>
                                <button onClick={() => navigate('/register')} className="btn-signup">
                                    Sign up
                                </button>
                            </>
                        )}
                    </nav>
                </div>
            </header>

            {/* Main Container */}
            <div className="main-container">
                {/* Left Sidebar */}
                <aside className="left-sidebar">
                    {user ? (
                        <nav className="sidebar-nav">
                            <button onClick={() => navigate('/')} className="nav-item active">
                                <svg viewBox="0 0 24 24" className="nav-icon">
                                    <g><path d="M12 1.696L.622 8.807l1.06 1.696L3 9.679V19.5C3 20.881 4.119 22 5.5 22h13c1.381 0 2.5-1.119 2.5-2.5V9.679l1.318.824 1.06-1.696L12 1.696zM12 16.5c-1.933 0-3.5-1.567-3.5-3.5s1.567-3.5 3.5-3.5 3.5 1.567 3.5 3.5-1.567 3.5-3.5 3.5z"></path></g>
                                </svg>
                                <span className="nav-text">Beranda</span>
                            </button>

                            <button onClick={() => navigate('/dashboard')} className="nav-item">
                                <svg viewBox="0 0 24 24" className="nav-icon">
                                    <g><path d="M23 3c-6.62-.1-10.38 2.421-13.05 6.03C7.29 12.61 6 17.331 6 22h2c0-1.007.07-2.012.19-3H12c4.1 0 7.48-3.082 7.94-7.054C22.79 10.147 23.17 6.359 23 3zm-7 8h-1.5v2H16c.63-.016 1.2-.08 1.72-.188C16.95 15.24 14.68 17 12 17H8.55c.57-2.512 1.57-4.851 3-6.78 2.16-2.912 5.29-4.911 9.45-5.187C20.95 8.079 19.9 11 16 11zM4 9V6H1V4h3V1h2v3h3v2H6v3H4z"></path></g>
                                </svg>
                                <span className="nav-text">Buat Postingan</span>
                            </button>

                            <button onClick={() => navigate('/my-posts')} className="nav-item">
                                <svg viewBox="0 0 24 24" className="nav-icon">
                                    <g><path d="M7.5 3.75C6.5 3.75 5.5 4.5 5.5 5.75v12.5c0 1.25 1 2 2 2h9c1 0 2-.75 2-2V5.75c0-1.25-1-2-2-2h-9zm0 1.5h9c.25 0 .5.25.5.5v12.5c0 .25-.25.5-.5.5h-9c-.25 0-.5-.25-.5-.5V5.75c0-.25.25-.5.5-.5zM9 7v1.5h6V7H9zm0 3v1.5h6V10H9zm0 3v1.5h4V13H9z"></path></g>
                                </svg>
                                <span className="nav-text">Postingan Saya</span>
                            </button>

                            {user.is_admin && (
                                <button onClick={() => navigate('/admin')} className="nav-item">
                                    <svg viewBox="0 0 24 24" className="nav-icon">
                                        <g><path d="M10.54 1.75h2.92l1.57 2.36c.11.17.32.25.53.21l2.53-.59 2.17 2.17-.58 2.54c-.05.2.04.41.21.53l2.36 1.57v2.92l-2.36 1.57c-.17.12-.26.33-.21.53l.58 2.54-2.17 2.17-2.53-.59c-.21-.04-.42.04-.53.21l-1.57 2.36h-2.92l-1.58-2.36c-.11-.17-.32-.25-.52-.21l-2.54.59-2.17-2.17.58-2.54c.05-.2-.03-.41-.21-.53l-2.35-1.57v-2.92L4.1 8.97c.18-.12.26-.33.21-.53L3.73 5.9 5.9 3.73l2.54.59c.2.04.41-.04.52-.21l1.58-2.36zm1.07 2l-.98 1.47C10.05 6.08 9 6.5 7.99 6.27l-1.46-.34-.6.6.33 1.46c.24 1.01-.18 2.07-1.05 2.64l-1.46.98v.78l1.46.98c.87.57 1.29 1.63 1.05 2.64l-.33 1.46.6.6 1.46-.34c1.01-.23 2.06.19 2.64 1.05l.98 1.47h.78l.97-1.47c.58-.86 1.63-1.28 2.65-1.05l1.45.34.61-.6-.34-1.46c-.23-1.01.18-2.07 1.05-2.64l1.47-.98v-.78l-1.47-.98c-.87-.57-1.28-1.63-1.05-2.64l.34-1.46-.61-.6-1.45.34c-1.02.23-2.07-.19-2.65-1.05l-.97-1.47h-.78zM12 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5c.82 0 1.5-.67 1.5-1.5s-.68-1.5-1.5-1.5zM8.5 12c0-1.93 1.56-3.5 3.5-3.5 1.93 0 3.5 1.57 3.5 3.5s-1.57 3.5-3.5 3.5c-1.94 0-3.5-1.57-3.5-3.5z"></path></g>
                                    </svg>
                                    <span className="nav-text">Admin Panel</span>
                                </button>
                            )}

                            <div className="nav-divider"></div>

                            <div className="user-profile-card">
                                <div className="user-profile-info">
                                    {user.avatar ? (
                                        <img src={user.avatar} alt={user.name} className="user-profile-avatar" />
                                    ) : (
                                        <div className="user-profile-avatar-placeholder">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="user-profile-details">
                                        <span className="user-profile-name">{user.name}</span>
                                        <span className="user-profile-email">{user.email}</span>
                                    </div>
                                </div>
                            </div>
                        </nav>
                    ) : (
                        <div className="sidebar-content">
                            <h2 className="sidebar-title">ArticleHub</h2>
                            <p className="sidebar-description">
                                Platform untuk berbagi dan menemukan artikel menarik dari komunitas.
                            </p>
                            <div className="sidebar-cta">
                                <h3>Bergabung Sekarang</h3>
                                <p>Mulai berbagi artikel dan konten Anda dengan komunitas</p>
                                <button onClick={() => navigate('/register')} className="btn-cta-sidebar">
                                    Buat Akun Gratis
                                </button>
                            </div>
                        </div>
                    )}
                </aside>

                {/* Center Feed */}
                <main className="center-feed">
                    <div className="feed-header">
                        <h2>Beranda</h2>
                    </div>

                    <div className="feed-content">
                        {loading ? (
                            <div className="loading-container">
                                <div className="loading-spinner"></div>
                                <p>Memuat postingan...</p>
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
                            <div className="posts-container">
                                {posts.map((post) => (
                                    <article key={post.id} className="post-card" onClick={() => openPostDetail(post)}>
                                        <div className="post-header">
                                            <div className="post-avatar">
                                                {post.user.avatar ? (
                                                    <img src={post.user.avatar} alt={post.user.name} />
                                                ) : (
                                                    <div className="avatar-placeholder">
                                                        {post.user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="post-meta">
                                                <span className="author-name">{post.user.name}</span>
                                                <span className="post-date">
                                                    · {new Date(post.approved_at).toLocaleDateString('id-ID', { 
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="post-body">
                                            {post.content && (
                                                <div className="post-text">
                                                    <p>{post.content}</p>
                                                </div>
                                            )}

                                            {post.image_path && (
                                                <div className="post-image">
                                                    <img
                                                        src={`http://localhost:8000/storage/${post.image_path}`}
                                                        alt="Post content"
                                                        loading="lazy"
                                                    />
                                                </div>
                                            )}

                                            {post.document_path && (
                                                <div className="post-document">
                                                    <div className="document-info">
                                                        <div className="document-icon">📄</div>
                                                        <div className="document-details">
                                                            <span className="document-name">{post.document_name}</span>
                                                            <a
                                                                href={`http://localhost:8000/storage/${post.document_path}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="document-link"
                                                                onClick={() => incrementViews(post.id)}
                                                            >
                                                                Lihat Dokumen →
                                                            </a>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Post Actions */}
                                        <div className="post-actions-bar">
                                            <button 
                                                className={`action-btn ${postInteractions[post.id]?.liked ? 'liked' : ''}`}
                                                onClick={(e) => { e.stopPropagation(); handleLike(post.id); }}
                                                title="Like"
                                            >
                                                <svg viewBox="0 0 24 24" width="18" height="18">
                                                    <g><path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"></path></g>
                                                </svg>
                                                <span>{postInteractions[post.id]?.likes || 0}</span>
                                            </button>

                                            <button 
                                                className="action-btn"
                                                onClick={(e) => { e.stopPropagation(); handleComment(post); }}
                                                title="Comment"
                                            >
                                                <svg viewBox="0 0 24 24" width="18" height="18">
                                                    <g><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z"></path></g>
                                                </svg>
                                                <span>{comments[post.id]?.length || 0}</span>
                                            </button>

                                            <button 
                                                className="action-btn"
                                                onClick={(e) => { e.stopPropagation(); handleRepost(post.id); }}
                                                title="Repost"
                                            >
                                                <svg viewBox="0 0 24 24" width="18" height="18">
                                                    <g><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"></path></g>
                                                </svg>
                                                <span>{postInteractions[post.id]?.reposts || 0}</span>
                                            </button>

                                            <button 
                                                className="action-btn"
                                                title="Views"
                                            >
                                                <svg viewBox="0 0 24 24" width="18" height="18">
                                                    <g><path d="M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21l.004-10h2L6 21H4zm9.248 0v-7h2v7h-2z"></path></g>
                                                </svg>
                                                <span>{postInteractions[post.id]?.views || 0}</span>
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>
                </main>

                {/* Right Sidebar */}
                <aside className="right-sidebar">
                    <div className="sidebar-widget">
                        <h3>Trending Topics</h3>
                        <div className="trending-list">
                            <div className="trending-item">
                                <span className="trending-tag">#Technology</span>
                                <span className="trending-count">1.2K posts</span>
                            </div>
                            <div className="trending-item">
                                <span className="trending-tag">#Design</span>
                                <span className="trending-count">890 posts</span>
                            </div>
                            <div className="trending-item">
                                <span className="trending-tag">#Programming</span>
                                <span className="trending-count">756 posts</span>
                            </div>
                            <div className="trending-item">
                                <span className="trending-tag">#Business</span>
                                <span className="trending-count">623 posts</span>
                            </div>
                        </div>
                    </div>

                    <div className="sidebar-widget">
                        <h3>Tentang ArticleHub</h3>
                        <p className="about-text">
                            Platform berbagi artikel dan konten yang telah dipercaya oleh ribuan pengguna.
                        </p>
                        <div className="stats-mini">
                            <div className="stat-mini">
                                <strong>10K+</strong>
                                <span>Pengguna Aktif</span>
                            </div>
                            <div className="stat-mini">
                                <strong>50K+</strong>
                                <span>Artikel</span>
                            </div>
                        </div>
                    </div>

                    <div className="footer-links">
                        <a href="#">Tentang</a>
                        <a href="#">Bantuan</a>
                        <a href="#">Ketentuan</a>
                        <a href="#">Privasi</a>
                    </div>
                    <div className="copyright">
                        <p>© 2025 ArticleHub</p>
                    </div>
                </aside>
            </div>

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
                                    {selectedPost.user.avatar ? (
                                        <img src={selectedPost.user.avatar} alt={selectedPost.user.name} className="avatar-small" />
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
                            {comments[selectedPost.id]?.map((comment) => (
                                <div key={comment.id} className="comment-item">
                                    <div className="comment-avatar-placeholder">
                                        {comment.user.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="comment-content">
                                        <div className="comment-header">
                                            <span className="comment-author">{comment.user}</span>
                                            <span className="comment-date">
                                                {new Date(comment.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                            </span>
                                        </div>
                                        <p className="comment-text">{comment.text}</p>
                                    </div>
                                </div>
                            ))}
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
                                {detailPost.user.avatar ? (
                                    <img src={detailPost.user.avatar} alt={detailPost.user.name} className="detail-avatar" />
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
                                    <div className="detail-document-info">
                                        <svg viewBox="0 0 24 24" width="32" height="32" className="detail-doc-icon">
                                            <g><path d="M7 4V3h2v1h6V3h2v1h1.5C19.89 4 21 5.12 21 6.5v12c0 1.38-1.11 2.5-2.5 2.5h-13C4.12 21 3 19.88 3 18.5v-12C3 5.12 4.12 4 5.5 4H7zm0 2H5.5c-.27 0-.5.22-.5.5v12c0 .28.23.5.5.5h13c.28 0 .5-.22.5-.5v-12c0-.28-.22-.5-.5-.5H17v1h-2V6H9v1H7V6zm0 6h2v-2H7v2zm0 4h2v-2H7v2zm4-4h2v-2h-2v2zm0 4h2v-2h-2v2zm4-4h2v-2h-2v2z"></path></g>
                                        </svg>
                                        <div className="detail-doc-text">
                                            <span className="detail-doc-name">{detailPost.document_name}</span>
                                            <a
                                                href={`http://localhost:8000/storage/${detailPost.document_path}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="detail-doc-link"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                Download Dokumen
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Post Stats */}
                            <div className="detail-stats">
                                <div className="detail-stat-item">
                                    <svg viewBox="0 0 24 24" width="18" height="18">
                                        <g><path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"></path></g>
                                    </svg>
                                    <span>{postInteractions[detailPost.id]?.likes || 0} Likes</span>
                                </div>
                                <div className="detail-stat-item">
                                    <svg viewBox="0 0 24 24" width="18" height="18">
                                        <g><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z"></path></g>
                                    </svg>
                                    <span>{comments[detailPost.id]?.length || 0} Comments</span>
                                </div>
                                <div className="detail-stat-item">
                                    <svg viewBox="0 0 24 24" width="18" height="18">
                                        <g><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"></path></g>
                                    </svg>
                                    <span>{postInteractions[detailPost.id]?.reposts || 0} Reposts</span>
                                </div>
                                <div className="detail-stat-item">
                                    <svg viewBox="0 0 24 24" width="18" height="18">
                                        <g><path d="M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21l.004-10h2L6 21H4zm9.248 0v-7h2v7h-2z"></path></g>
                                    </svg>
                                    <span>{postInteractions[detailPost.id]?.views || 0} Views</span>
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
                                                    {comment.user.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="detail-comment-content">
                                                    <div className="detail-comment-header">
                                                        <span className="detail-comment-author">{comment.user}</span>
                                                        <span className="detail-comment-date">
                                                            {new Date(comment.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                                        </span>
                                                    </div>
                                                    <p className="detail-comment-text">{comment.text}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="detail-no-comments">Belum ada komentar</p>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="detail-modal-footer">
                            <button 
                                className={`detail-action-btn ${postInteractions[detailPost.id]?.liked ? 'liked' : ''}`}
                                onClick={() => handleLike(detailPost.id)}
                            >
                                <svg viewBox="0 0 24 24" width="20" height="20">
                                    <g><path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"></path></g>
                                </svg>
                                {postInteractions[detailPost.id]?.liked ? 'Liked' : 'Like'}
                            </button>
                            <button 
                                className="detail-action-btn"
                                onClick={() => { setShowDetailModal(false); handleComment(detailPost); }}
                            >
                                <svg viewBox="0 0 24 24" width="20" height="20">
                                    <g><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z"></path></g>
                                </svg>
                                Comment
                            </button>
                            <button 
                                className="detail-action-btn"
                                onClick={() => handleRepost(detailPost.id)}
                            >
                                <svg viewBox="0 0 24 24" width="20" height="20">
                                    <g><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"></path></g>
                                </svg>
                                Repost
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LandingPage;
