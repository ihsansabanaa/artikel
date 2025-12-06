# Login & Register System - Laravel + React

Sistem authentication dengan Laravel backend dan React frontend menggunakan Laravel Sanctum.

## Struktur Aplikasi

```
artikel/
├── backend/     (Laravel API)
└── frontend/    (React SPA)
```

## Fitur

- ✅ Register user baru
- ✅ Login dengan email & password
- ✅ **Login dengan Google OAuth** 🆕
- ✅ Logout
- ✅ Protected routes
- ✅ Dashboard untuk user yang sudah login
- ✅ Token-based authentication (Laravel Sanctum)
- ✅ Avatar dari Google profile

## Cara Menjalankan

### Backend (Laravel)

1. **Masuk ke folder backend:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   composer install
   ```

3. **Setup database di `.env`:**
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=artikel_db
   DB_USERNAME=root
   DB_PASSWORD=
   
   # Google OAuth (opsional - untuk login dengan Google)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_REDIRECT_URL=http://localhost:8000/api/auth/google/callback
   FRONTEND_URL=http://localhost:5173
   ```

4. **Generate key:**
   ```bash
   php artisan key:generate
   ```

5. **Jalankan migration:**
   ```bash
   php artisan migrate
   ```

6. **Jalankan server:**
   ```bash
   php artisan serve
   ```
   Backend akan berjalan di `http://localhost:8000`

### Frontend (React)

1. **Masuk ke folder frontend:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Setup Google OAuth (opsional):**
   Buat file `.env` di folder frontend:
   ```env
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   ```
   
   📖 **Lihat [GOOGLE_OAUTH_SETUP.md](GOOGLE_OAUTH_SETUP.md) untuk setup lengkap Google OAuth**

4. **Jalankan dev server:**
   ```bash
   npm run dev
   ```
   Frontend akan berjalan di `http://localhost:5173`

## API Endpoints

### Public Routes
- `POST /api/register` - Register user baru
- `POST /api/login` - Login user
- `GET /api/auth/google` - Redirect ke Google OAuth
- `GET /api/auth/google/callback` - Callback dari Google
- `POST /api/auth/google/login` - Login dengan Google token (SPA)

### Protected Routes (memerlukan Bearer token)
- `POST /api/logout` - Logout user
- `GET /api/me` - Get user data
- `GET /api/user` - Get authenticated user

## Testing API dengan Postman/Thunder Client

### 1. Register
```http
POST http://localhost:8000/api/register
Content-Type: application/json

{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "password_confirmation": "password123"
}
```

### 2. Login
```http
POST http://localhost:8000/api/login
Content-Type: application/json

{
    "email": "john@example.com",
    "password": "password123"
}
```

Response akan memberikan `access_token`:
```json
{
    "message": "Login successful",
    "user": { ... },
    "access_token": "1|xxxxxxxxxxxxx",
    "token_type": "Bearer"
}
```

### 3. Akses Protected Route
```http
GET http://localhost:8000/api/me
Authorization: Bearer 1|xxxxxxxxxxxxx
```

## Teknologi yang Digunakan

### Backend
- Laravel 12
- Laravel Sanctum (Authentication)
- Laravel Socialite (OAuth)
- MySQL/MariaDB

### Frontend
- React 19
- React Router DOM
- Axios
- @react-oauth/google
- Vite

## Struktur File Penting

### Backend
```
backend/
├── app/Http/Controllers/
│   ├── AuthController.php
│   └── SocialAuthController.php
├── config/
│   ├── cors.php
│   ├── sanctum.php
│   └── services.php
├── routes/api.php
└── app/Models/User.php
```

### Frontend
```
frontend/src/
├── components/
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Dashboard.jsx
│   ├── ProtectedRoute.jsx
│   ├── AuthCallback.jsx
│   ├── Auth.css
│   └── Dashboard.css
├── context/
│   └── AuthContext.jsx
├── services/
│   └── api.js
└── App.jsx
```

## Flow Authentication

### Email/Password Authentication
1. User mengisi form register/login
2. React mengirim request ke Laravel API
3. Laravel memvalidasi dan membuat token (Sanctum)
4. Token disimpan di localStorage
5. Setiap request ke protected route menyertakan token di header

### Google OAuth Authentication
1. User klik "Sign in with Google"
2. Google OAuth popup muncul
3. User pilih akun Google
4. Google mengirim credential ke React
5. React mengirim Google token ke Laravel API
6. Laravel memverifikasi token dan buat/update user
7. Laravel membuat Sanctum token
8. Token disimpan di localStorage
9. User redirect ke dashboard
6. Laravel memverifikasi token dan memberikan response

## Troubleshooting

### CORS Error
Pastikan `config/cors.php` sudah disetup dengan benar:
```php
'allowed_origins' => ['http://localhost:5173'],
'supports_credentials' => true,
```

### 401 Unauthorized
- Cek apakah token sudah disimpan di localStorage
- Pastikan format header: `Authorization: Bearer {token}`

### Migration Error
Jalankan:
```bash
php artisan config:clear
php artisan migrate:fresh
```

## License
MIT
