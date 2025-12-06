import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './MyPosts.css';

const MyPosts = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchMyPosts();
    }, []);

    const fetchMyPosts = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8000/api/posts/my-posts', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch posts');
            }

            const data = await response.json();
            setPosts(data.posts);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (postId) => {
        if (!confirm('Are you sure you want to delete this post?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8000/api/posts/${postId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to delete post');
            }

            fetchMyPosts();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending: { bg: '#ffc107', text: 'Pending' },
            approved: { bg: '#28a745', text: 'Approved' },
            rejected: { bg: '#dc3545', text: 'Rejected' },
        };
        const style = styles[status] || styles.pending;
        return (
            <span style={{
                padding: '4px 12px',
                borderRadius: '12px',
                backgroundColor: style.bg,
                color: 'white',
                fontSize: '12px',
                fontWeight: '600'
            }}>
                {style.text}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="my-posts-container">
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="my-posts-container">
            <div className="my-posts-card">
                <div className="my-posts-header">
                    <div>
                        <h2>My Posts</h2>
                        <p className="welcome-text">Manage your uploaded content</p>
                    </div>
                    <div className="header-buttons">
                        <button onClick={() => navigate('/dashboard')} className="btn-secondary">
                            Back to Dashboard
                        </button>
                        <button onClick={handleLogout} className="btn-logout">
                            Logout
                        </button>
                    </div>
                </div>

                {error && <div className="error-message">{error}</div>}

                {posts.length === 0 ? (
                    <div className="empty-state">
                        <p>You haven't uploaded any content yet.</p>
                        <button onClick={() => navigate('/dashboard')} className="btn-primary">
                            Upload Content
                        </button>
                    </div>
                ) : (
                    <div className="posts-grid">
                        {posts.map((post) => (
                            <div key={post.id} className="post-card">
                                <div className="post-status">
                                    {getStatusBadge(post.status)}
                                </div>

                                {post.image_path && (
                                    <div className="post-image">
                                        <img
                                            src={`http://localhost:8000/storage/${post.image_path}`}
                                            alt="Post"
                                        />
                                    </div>
                                )}

                                {post.content && (
                                    <div className="post-content">
                                        <p>{post.content}</p>
                                    </div>
                                )}

                                {post.document_path && (
                                    <div className="post-document">
                                        <span>📄 {post.document_name}</span>
                                        <a
                                            href={`http://localhost:8000/storage/${post.document_path}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn-download"
                                        >
                                            Download
                                        </a>
                                    </div>
                                )}

                                <div className="post-footer">
                                    <small>Created: {new Date(post.created_at).toLocaleDateString()}</small>
                                    <button
                                        onClick={() => handleDelete(post.id)}
                                        className="btn-delete"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyPosts;
