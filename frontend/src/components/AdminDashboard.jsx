import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('posts'); // 'users' or 'posts'
    const [users, setUsers] = useState([]);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedPostId, setSelectedPostId] = useState(null);
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        // Redirect if not admin
        if (user && !user.is_admin) {
            navigate('/dashboard');
            return;
        }

        if (activeTab === 'users') {
            fetchUsers();
        } else {
            fetchPendingPosts();
        }
    }, [user, navigate, activeTab]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8000/api/admin/users', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }

            const data = await response.json();
            setUsers(data.users);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchPendingPosts = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8000/api/admin/posts/pending', {
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

    const handleApprovePost = async (postId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8000/api/admin/posts/${postId}/approve`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to approve post');
            }

            fetchPendingPosts();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleRejectPost = async (postId) => {
        setSelectedPostId(postId);
        setShowRejectModal(true);
    };

    const confirmRejectPost = async () => {
        if (!rejectReason.trim()) {
            alert('Mohon berikan alasan penolakan');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8000/api/admin/posts/${selectedPostId}/reject`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    reject_reason: rejectReason
                })
            });

            if (!response.ok) {
                throw new Error('Failed to reject post');
            }

            setShowRejectModal(false);
            setRejectReason('');
            setSelectedPostId(null);
            fetchPendingPosts();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDeletePost = async (postId) => {
        if (!confirm('Are you sure you want to delete this post?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8000/api/admin/posts/${postId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to delete post');
            }

            fetchPendingPosts();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!confirm('Are you sure you want to delete this user?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8000/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to delete user');
            }

            // Refresh users list
            fetchUsers();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleToggleAdmin = async (userId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8000/api/admin/users/${userId}/toggle-admin`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to update admin status');
            }

            // Refresh users list
            fetchUsers();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="admin-container">
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="admin-container">
            <div className="admin-card">
                <div className="admin-header">
                    <div>
                        <h2>Admin Dashboard</h2>
                        <p>Welcome, <strong>{user?.name}</strong>!</p>
                    </div>
                    <button onClick={handleLogout} className="btn-logout">
                        Logout
                    </button>
                </div>

                {error && <div className="error-message">{error}</div>}

                {/* Tabs */}
                <div className="tabs">
                    <button
                        className={`tab ${activeTab === 'posts' ? 'active' : ''}`}
                        onClick={() => setActiveTab('posts')}
                    >
                        Pending Posts ({posts.length})
                    </button>
                    <button
                        className={`tab ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={() => setActiveTab('users')}
                    >
                        Manage Users ({users.length})
                    </button>
                </div>

                {/* Posts Tab */}
                {activeTab === 'posts' && (
                    <div className="tab-content">
                        {posts.length === 0 ? (
                            <div className="empty-state">
                                <p>No pending posts to review.</p>
                            </div>
                        ) : (
                            <div className="posts-grid">
                                {posts.map((post) => (
                                    <div key={post.id} className="post-card">
                                        <div className="post-user-info">
                                            <strong>{post.user.name}</strong>
                                            <small>{post.user.email}</small>
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
                                                    View
                                                </a>
                                            </div>
                                        )}

                                        <div className="post-meta">
                                            <small>Submitted: {new Date(post.created_at).toLocaleString()}</small>
                                        </div>

                                        <div className="post-actions">
                                            <button
                                                onClick={() => handleApprovePost(post.id)}
                                                className="btn-approve"
                                            >
                                                ✓ Approve
                                            </button>
                                            <button
                                                onClick={() => handleRejectPost(post.id)}
                                                className="btn-reject"
                                            >
                                                ✗ Reject
                                            </button>
                                            <button
                                                onClick={() => handleDeletePost(post.id)}
                                                className="btn-delete"
                                            >
                                                🗑 Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <div className="tab-content">
                        <div className="table-container">
                            <table className="users-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Admin</th>
                                        <th>Verified</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((u) => (
                                        <tr key={u.id}>
                                            <td>{u.name}</td>
                                            <td>{u.email}</td>
                                            <td>
                                                <span className={`badge ${u.is_admin ? 'badge-success' : 'badge-secondary'}`}>
                                                    {u.is_admin ? 'Yes' : 'No'}
                                                </span>
                                            </td>
                                            <td>{u.email_verified_at ? '✓' : '✗'}</td>
                                            <td>
                                                <button
                                                    onClick={() => handleToggleAdmin(u.id)}
                                                    disabled={u.id === user?.id}
                                                    className="btn-toggle"
                                                >
                                                    Toggle Admin
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(u.id)}
                                                    disabled={u.id === user?.id}
                                                    className="btn-delete-user"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Alasan Penolakan</h3>
                            <button onClick={() => setShowRejectModal(false)} className="modal-close-btn">
                                ✕
                            </button>
                        </div>
                        <div className="modal-body">
                            <label htmlFor="reject-reason">Berikan alasan mengapa postingan ini ditolak:</label>
                            <textarea
                                id="reject-reason"
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Contoh: Konten tidak sesuai dengan pedoman komunitas..."
                                rows="5"
                                className="reject-textarea"
                            />
                        </div>
                        <div className="modal-footer">
                            <button onClick={() => setShowRejectModal(false)} className="btn-cancel">
                                Batal
                            </button>
                            <button onClick={confirmRejectPost} className="btn-confirm-reject">
                                Tolak Postingan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
