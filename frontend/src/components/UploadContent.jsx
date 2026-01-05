import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './UploadContent.css';

const UploadContent = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [content, setContent] = useState('');
    const [image, setImage] = useState(null);
    const [documentFile, setDocumentFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [imagePreview, setImagePreview] = useState(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate size
            if (file.size > 5 * 1024 * 1024) {
                setError('Ukuran gambar maksimal 5MB');
                return;
            }
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDocumentChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate size
            if (file.size > 10 * 1024 * 1024) {
                setError('Ukuran dokumen maksimal 10MB');
                return;
            }
            setDocumentFile(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validate at least one field
        if (!content && !image && !documentFile) {
            setError('Harap isi setidaknya salah satu: teks, gambar, atau dokumen.');
            return;
        }

        setLoading(true);

        try {
            const formData = new FormData();
            if (content) formData.append('content', content);
            if (image) formData.append('image', image);
            if (documentFile) formData.append('document', documentFile);

            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8000/api/posts', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Upload failed');
            }

            setSuccess('Konten berhasil diupload! Menunggu persetujuan admin.');
            // Reset form
            setContent('');
            setImage(null);
            setDocumentFile(null);
            setImagePreview(null);
            // Reset file inputs
            document.getElementById('image-input').value = '';
            document.getElementById('document-input').value = '';

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="twitter-layout">
            {/* Fixed Header */}
            <header className="top-header">
                <div className="header-content">
                    <div className="logo">
                        <h1 className="site-title">ArticleHub</h1>
                    </div>
                    <nav className="header-nav">
                        <span className="user-name">Hi, {user?.name}</span>
                        <button onClick={handleLogout} className="btn-logout-header">
                            Logout
                        </button>
                    </nav>
                </div>
            </header>

            {/* Main Container */}
            <div className="main-container">
                {/* Left Sidebar */}
                <aside className="left-sidebar">
                    <nav className="sidebar-nav">
                        <button onClick={() => navigate('/')} className="nav-item">
                            <svg viewBox="0 0 24 24" className="nav-icon">
                                <g><path d="M12 1.696L.622 8.807l1.06 1.696L3 9.679V19.5C3 20.881 4.119 22 5.5 22h13c1.381 0 2.5-1.119 2.5-2.5V9.679l1.318.824 1.06-1.696L12 1.696zM12 16.5c-1.933 0-3.5-1.567-3.5-3.5s1.567-3.5 3.5-3.5 3.5 1.567 3.5 3.5-1.567 3.5-3.5 3.5z"></path></g>
                            </svg>
                            <span className="nav-text">Beranda</span>
                        </button>

                        <button onClick={() => navigate('/dashboard')} className="nav-item active">
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

                        {user?.is_admin && (
                            <button onClick={() => navigate('/admin')} className="nav-item">
                                <svg viewBox="0 0 24 24" className="nav-icon">
                                    <g><path d="M10.54 1.75h2.92l1.57 2.36c.11.17.32.25.53.21l2.53-.59 2.17 2.17-.58 2.54c-.05.2.04.41.21.53l2.36 1.57v2.92l-2.36 1.57c-.17.12-.26.33-.21.53l.58 2.54-2.17 2.17-2.53-.59c-.21-.04-.42.04-.53.21l-1.57 2.36h-2.92l-1.58-2.36c-.11-.17-.32-.25-.52-.21l-2.54.59-2.17-2.17.58-2.54c.05-.2-.03-.41-.21-.53l-2.35-1.57v-2.92L4.1 8.97c.18-.12.26-.33.21-.53L3.73 5.9 5.9 3.73l2.54.59c.2.04.41-.04.52-.21l1.58-2.36zm1.07 2l-.98 1.47C10.05 6.08 9 6.5 7.99 6.27l-1.46-.34-.6.6.33 1.46c.24 1.01-.18 2.07-1.05 2.64l-1.46.98v.78l1.46.98c.87.57 1.29 1.63 1.05 2.64l-.33 1.46.6.6 1.46-.34c1.01-.23 2.06.19 2.64 1.05l.98 1.47h.78l.97-1.47c.58-.86 1.63-1.28 2.65-1.05l1.45.34.61-.6-.34-1.46c-.23-1.01.18-2.07 1.05-2.64l1.47-.98v-.78l-1.47-.98c-.87-.57-1.28-1.63-1.05-2.64l.34-1.46-.61-.6-1.45.34c-1.02.23-2.07-.19-2.65-1.05l-.97-1.47h-.78zM12 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5c.82 0 1.5-.67 1.5-1.5s-.68-1.5-1.5-1.5zM8.5 12c0-1.93 1.56-3.5 3.5-3.5 1.93 0 3.5 1.57 3.5 3.5s-1.57 3.5-3.5 3.5c-1.94 0-3.5-1.57-3.5-3.5z"></path></g>
                                </svg>
                                <span className="nav-text">Admin Panel</span>
                            </button>
                        )}

                        <div className="nav-divider"></div>

                        <button className="user-profile-card" onClick={() => navigate('/profile')}>
                            <div className="user-profile-info">
                                {user?.profile_image || user?.avatar ? (
                                    <img src={user.profile_image || user.avatar} alt={user.name} className="user-profile-avatar" />
                                ) : (
                                    <div className="user-profile-avatar-placeholder">
                                        {user?.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className="user-profile-details">
                                    <span className="user-profile-name">{user?.name}</span>
                                    <span className="user-profile-email">{user?.email}</span>
                                </div>
                            </div>
                        </button>
                    </nav>
                </aside>

                {/* Center Content */}
                <main className="center-feed">
                    <div className="feed-header">
                        <h2>Buat Postingan</h2>
                    </div>

                    <div className="upload-content-wrapper">
                        {error && <div className="alert alert-error">{error}</div>}
                        {success && <div className="alert alert-success">{success}</div>}

                        <form onSubmit={handleSubmit} className="post-form">
                            {/* Text Content */}
                            <div className="form-field">
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Apa yang sedang Anda pikirkan?"
                                    rows="4"
                                    className="post-textarea"
                                />
                            </div>

                            {/* Image Preview */}
                            {imagePreview && (
                                <div className="media-preview">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setImage(null);
                                            setImagePreview(null);
                                            document.getElementById('image-input').value = '';
                                        }}
                                        className="btn-remove-media"
                                    >
                                        ✕
                                    </button>
                                    <img src={imagePreview} alt="Preview" />
                                </div>
                            )}

                            {/* Document Preview */}
                            {documentFile && (
                                <div className="document-preview-box">
                                    <div className="document-info">
                                        <svg viewBox="0 0 24 24" className="document-icon" width="24" height="24">
                                            <g><path d="M7 4V3h2v1h6V3h2v1h1.5C19.89 4 21 5.12 21 6.5v12c0 1.38-1.11 2.5-2.5 2.5h-13C4.12 21 3 19.88 3 18.5v-12C3 5.12 4.12 4 5.5 4H7zm0 2H5.5c-.27 0-.5.22-.5.5v12c0 .28.23.5.5.5h13c.28 0 .5-.22.5-.5v-12c0-.28-.22-.5-.5-.5H17v1h-2V6H9v1H7V6zm0 6h2v-2H7v2zm0 4h2v-2H7v2zm4-4h2v-2h-2v2zm0 4h2v-2h-2v2zm4-4h2v-2h-2v2z"></path></g>
                                        </svg>
                                        <span className="document-name">{documentFile.name}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setDocumentFile(null);
                                            document.getElementById('document-input').value = '';
                                        }}
                                        className="btn-remove-doc"
                                    >
                                        Hapus
                                    </button>
                                </div>
                            )}

                            {/* Upload Actions */}
                            <div className="post-actions">
                                <div className="media-buttons">
                                    <label htmlFor="image-input" className="media-btn" title="Tambah Gambar">
                                        <svg viewBox="0 0 24 24" width="20" height="20">
                                            <g><path d="M3 5.5C3 4.119 4.119 3 5.5 3h13C19.881 3 21 4.119 21 5.5v13c0 1.381-1.119 2.5-2.5 2.5h-13C4.119 21 3 19.881 3 18.5v-13zM5.5 5c-.276 0-.5.224-.5.5v9.086l3-3 3 3 5-5 3 3V5.5c0-.276-.224-.5-.5-.5h-13zM19 15.414l-3-3-5 5-3-3-3 3V18.5c0 .276.224.5.5.5h13c.276 0 .5-.224.5-.5v-3.086zM9.75 7C8.784 7 8 7.784 8 8.75s.784 1.75 1.75 1.75 1.75-.784 1.75-1.75S10.716 7 9.75 7z"></path></g>
                                        </svg>
                                        <input
                                            type="file"
                                            id="image-input"
                                            accept="image/jpeg,image/png,image/jpg,image/gif"
                                            onChange={handleImageChange}
                                            style={{ display: 'none' }}
                                        />
                                    </label>

                                    <label htmlFor="document-input" className="media-btn" title="Tambah Dokumen">
                                        <svg viewBox="0 0 24 24" width="20" height="20">
                                            <g><path d="M7 4V3h2v1h6V3h2v1h1.5C19.89 4 21 5.12 21 6.5v12c0 1.38-1.11 2.5-2.5 2.5h-13C4.12 21 3 19.88 3 18.5v-12C3 5.12 4.12 4 5.5 4H7zm0 2H5.5c-.27 0-.5.22-.5.5v12c0 .28.23.5.5.5h13c.28 0 .5-.22.5-.5v-12c0-.28-.22-.5-.5-.5H17v1h-2V6H9v1H7V6zm0 6h2v-2H7v2zm0 4h2v-2H7v2zm4-4h2v-2h-2v2zm0 4h2v-2h-2v2zm4-4h2v-2h-2v2z"></path></g>
                                        </svg>
                                        <input
                                            type="file"
                                            id="document-input"
                                            accept=".pdf,.doc,.docx,.txt"
                                            onChange={handleDocumentChange}
                                            style={{ display: 'none' }}
                                        />
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || (!content && !image && !documentFile)}
                                    className="btn-post"
                                >
                                    {loading ? 'Memposting...' : 'Posting'}
                                </button>
                            </div>
                        </form>
                    </div>
                </main>

                {/* Right Sidebar */}
                <aside className="right-sidebar">
                    <div className="sidebar-widget">
                        <h3>Tips Posting</h3>
                        <ul className="tips-list">
                            <li>Isi minimal salah satu: teks, gambar, atau dokumen</li>
                            <li>Ukuran gambar maksimal 5MB</li>
                            <li>Ukuran dokumen maksimal 10MB</li>
                            <li>Postingan akan ditinjau oleh admin sebelum dipublikasikan</li>
                        </ul>
                    </div>

                    <div className="sidebar-widget">
                        <h3>Quick Actions</h3>
                        <button onClick={() => navigate('/my-posts')} className="quick-action-btn">
                            <svg viewBox="0 0 24 24" width="20" height="20">
                                <g><path d="M7.5 3.75C6.5 3.75 5.5 4.5 5.5 5.75v12.5c0 1.25 1 2 2 2h9c1 0 2-.75 2-2V5.75c0-1.25-1-2-2-2h-9z"></path></g>
                            </svg>
                            Lihat Postingan Saya
                        </button>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default UploadContent;
