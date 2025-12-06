# 🚀 Quick Start - Google OAuth

## Setup Cepat (5 Menit)

### 1️⃣ Dapatkan Google Credentials

1. Buka https://console.cloud.google.com/
2. Buat project baru
3. APIs & Services > Credentials
4. Create Credentials > OAuth client ID
5. Application type: **Web application**
6. Authorized JavaScript origins: `http://localhost:5173`
7. Authorized redirect URIs: `http://localhost:8000/api/auth/google/callback`
8. Copy **Client ID** dan **Client Secret**

### 2️⃣ Configure Backend

Edit `backend/.env`:
```env
GOOGLE_CLIENT_ID=paste_client_id_disini
GOOGLE_CLIENT_SECRET=paste_client_secret_disini
```

### 3️⃣ Configure Frontend

Buat file `frontend/.env`:
```env
VITE_GOOGLE_CLIENT_ID=paste_client_id_yang_sama_disini
```

### 4️⃣ Run

**Backend:**
```bash
cd backend
php artisan serve
```

**Frontend (terminal baru):**
```bash
cd frontend
npm run dev
```

### 5️⃣ Test

1. Buka http://localhost:5173
2. Klik "Sign in with Google"
3. Pilih akun Google
4. ✅ Selesai!

---

**Troubleshooting?** Lihat [GOOGLE_OAUTH_SETUP.md](GOOGLE_OAUTH_SETUP.md) untuk detail lengkap.
