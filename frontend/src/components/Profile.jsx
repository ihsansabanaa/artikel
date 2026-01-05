import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

const Profile = () => {
    const navigate = useNavigate();
    const { user, updateUser } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [profileImage, setProfileImage] = useState(null);
    const [previewImage, setPreviewImage] = useState(user?.profile_image || null);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.name);
            setPreviewImage(user.profile_image);
        }
    }, [user]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setMessage('Ukuran gambar maksimal 5MB');
                return;
            }

            // Validate file type
            if (!file.type.startsWith('image/')) {
                setMessage('File harus berupa gambar');
                return;
            }

            setProfileImage(file);
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const formData = new FormData();
            formData.append('name', name);
            if (profileImage) {
                formData.append('profile_image', profileImage);
            }

            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8000/api/user/profile', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                // Update user context
                updateUser(data.user);
                setMessage('Profil berhasil diperbarui!');
                setTimeout(() => {
                    navigate('/');
                }, 1500);
            } else {
                setMessage(data.message || 'Gagal memperbarui profil');
            }
        } catch (error) {
            console.error('Update profile error:', error);
            setMessage('Terjadi kesalahan saat memperbarui profil');
        } finally {
            setLoading(false);
        }
    };

    const removeImage = () => {
        setProfileImage(null);
        setPreviewImage(user?.profile_image || null);
    };

    return (
        <div className="profile-container">
            {/* Navbar */}
            <nav className="profile-navbar">
                <div className="navbar-content">
                    <button className="back-btn" onClick={() => navigate('/')}>
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                            <path d="M7.414 13l5.043 5.04-1.414 1.42L3.586 12l7.457-7.46 1.414 1.42L7.414 11H21v2H7.414z"/>
                        </svg>
                    </button>
                    <div className="profile-nav-title">
                        <h2>Edit Profil</h2>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="profile-main">
                <div className="profile-content">
                    <form onSubmit={handleSubmit} className="profile-form">
                        {/* Profile Image Section */}
                        <div className="profile-image-section">
                            <div className="current-image">
                                {previewImage ? (
                                    <img src={previewImage} alt="Profile" />
                                ) : (
                                    <div className="default-avatar">
                                        <svg viewBox="0 0 24 24" width="60" height="60" fill="#8b98a5">
                                            <path d="M12 11.816c1.355 0 2.872-.15 3.84-1.256.814-.93 1.078-2.368.806-4.392-.38-2.825-2.117-4.512-4.646-4.512S7.734 3.343 7.354 6.17c-.272 2.022-.008 3.46.806 4.39.968 1.107 2.485 1.256 3.84 1.256zM8.84 6.368c.162-1.2.787-3.212 3.16-3.212s2.998 2.013 3.16 3.212c.207 1.55.057 2.627-.45 3.205-.455.52-1.266.743-2.71.743s-2.255-.223-2.71-.743c-.507-.578-.657-1.656-.45-3.205zm11.44 12.868c-.877-3.526-4.282-5.99-8.28-5.99s-7.403 2.464-8.28 5.99c-.172.692-.028 1.4.395 1.94.408.52 1.04.82 1.733.82h12.304c.693 0 1.325-.3 1.733-.82.424-.54.567-1.247.394-1.94zm-1.576 1.016c-.126.16-.316.246-.552.246H5.848c-.235 0-.426-.085-.552-.246-.137-.174-.18-.412-.12-.654.71-2.855 3.517-4.85 6.824-4.85s6.114 1.994 6.824 4.85c.06.242.017.48-.12.654z"/>
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <div className="image-actions">
                                <label className="upload-image-btn">
                                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                        <path d="M3 5.5C3 4.119 4.119 3 5.5 3h13C19.881 3 21 4.119 21 5.5v13c0 1.381-1.119 2.5-2.5 2.5h-13C4.119 21 3 19.881 3 18.5v-13zM5.5 5c-.276 0-.5.224-.5.5v9.086l3-3 3 3 5-5 3 3V5.5c0-.276-.224-.5-.5-.5h-13zM19 15.414l-3-3-5 5-3-3-3 3V18.5c0 .276.224.5.5.5h13c.276 0 .5-.224.5-.5v-3.086zM9.75 7C8.784 7 8 7.784 8 8.75s.784 1.75 1.75 1.75 1.75-.784 1.75-1.75S10.716 7 9.75 7z"/>
                                    </svg>
                                    Pilih Foto
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        style={{ display: 'none' }}
                                    />
                                </label>
                                {profileImage && (
                                    <button type="button" className="remove-image-btn" onClick={removeImage}>
                                        Hapus
                                    </button>
                                )}
                            </div>
                            <p className="image-hint">Format: JPG, PNG, GIF (Max 5MB)</p>
                        </div>

                        {/* Name Input */}
                        <div className="form-group">
                            <label htmlFor="name">Nama</label>
                            <input
                                type="text"
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Masukkan nama Anda"
                                required
                            />
                        </div>

                        {/* Email (Read-only) */}
                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                value={user?.email || ''}
                                disabled
                                className="input-disabled"
                            />
                            <p className="field-hint">Email tidak dapat diubah</p>
                        </div>

                        {/* Message */}
                        {message && (
                            <div className={`message ${message.includes('berhasil') ? 'success' : 'error'}`}>
                                {message}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button type="submit" className="save-btn" disabled={loading}>
                            {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;
