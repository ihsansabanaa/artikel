# Google OAuth Setup Guide

## Langkah 1: Buat Google Cloud Project

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Buat project baru atau pilih existing project
3. Enable **Google+ API**:
   - Navigation Menu > APIs & Services > Library
   - Cari "Google+ API"
   - Klik Enable

## Langkah 2: Buat OAuth 2.0 Credentials

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Navigation Menu > APIs & Services > Credentials
3. Klik **+ CREATE CREDENTIALS** > OAuth client ID
4. Pilih Application type: **Web application**
5. Isi form:
   - **Name**: Artikel App (atau nama lain)
   - **Authorized JavaScript origins**:
     - `http://localhost:5173`
     - `http://localhost:8000`
   - **Authorized redirect URIs**:
     - `http://localhost:8000/api/auth/google/callback`
6. Klik **CREATE**
7. Copy **Client ID** dan **Client Secret**

## Langkah 3: Configure Backend (.env)

Edit file `backend/.env`:

```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URL=http://localhost:8000/api/auth/google/callback
FRONTEND_URL=http://localhost:5173
```

## Langkah 4: Configure Frontend (.env)

Edit file `frontend/.env`:

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

**PENTING:** Client ID yang sama digunakan di backend dan frontend!

## Langkah 5: Testing

### Backend Testing
```bash
cd backend
php artisan serve
```

### Frontend Testing
```bash
cd frontend
npm run dev
```

### Test Login Flow

1. Buka browser di `http://localhost:5173`
2. Klik tombol "Sign in with Google"
3. Pilih akun Google
4. Akan redirect ke dashboard dengan data user dari Google

## API Endpoints

### Google OAuth (Redirect Flow)
- `GET /api/auth/google` - Redirect ke Google OAuth
- `GET /api/auth/google/callback` - Callback dari Google

### Google OAuth (Token Flow - untuk SPA)
- `POST /api/auth/google/login` - Login dengan Google token
  ```json
  {
    "token": "google_id_token"
  }
  ```

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Pastikan redirect URI di Google Console sama persis dengan yang ada di konfigurasi
- Format: `http://localhost:8000/api/auth/google/callback`

### Error: "Invalid Client ID"
- Pastikan VITE_GOOGLE_CLIENT_ID di frontend sama dengan GOOGLE_CLIENT_ID di backend
- Restart dev server setelah mengubah .env

### Error: "Authorization code was already redeemed"
- Gunakan mode incognito/private browser
- Clear browser cache

### Google Button tidak muncul
- Cek console browser untuk error
- Pastikan Google Client ID sudah benar di .env
- Restart Vite dev server: `npm run dev`

## Production Setup

Untuk production, tambahkan domain production ke:

1. **Google Console**:
   - Authorized JavaScript origins: `https://yourdomain.com`
   - Authorized redirect URIs: `https://yourdomain.com/api/auth/google/callback`

2. **Backend .env**:
   ```env
   GOOGLE_REDIRECT_URL=https://yourdomain.com/api/auth/google/callback
   FRONTEND_URL=https://yourdomain.com
   ```

3. **Frontend .env**:
   ```env
   VITE_GOOGLE_CLIENT_ID=your_production_client_id
   ```

## Security Notes

- **Jangan commit** file `.env` ke Git
- Simpan Client Secret dengan aman
- Gunakan HTTPS di production
- Validate Google tokens di server-side
- Set proper CORS configuration
