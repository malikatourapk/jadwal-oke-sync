# Konfigurasi Email Redirect URL di Supabase

## Informasi Penting untuk Admin

Untuk memastikan email konfirmasi pendaftaran berfungsi dengan benar dan mengarahkan user ke halaman **Waiting Approval**, Anda perlu mengatur **Redirect URL** di dashboard Supabase.

## Langkah-langkah Konfigurasi

### 1. Buka Dashboard Supabase
- Login ke [https://supabase.com](https://supabase.com)
- Pilih project Anda

### 2. Masuk ke Authentication Settings
- Di sidebar kiri, klik **Authentication**
- Klik tab **URL Configuration**

### 3. Tambahkan Redirect URLs
Di bagian **Redirect URLs**, tambahkan URL berikut:

#### Untuk Development/Testing:
```
http://localhost:5173/waiting-approval
```

#### Untuk Production:
```
https://your-domain.com/waiting-approval
```
*Ganti `your-domain.com` dengan domain sebenarnya dari aplikasi Anda*

#### Untuk Lovable Preview:
```
https://[your-project-id].lovableproject.com/waiting-approval
```
*Ganti `[your-project-id]` dengan ID project Lovable Anda*

### 4. Site URL
Pastikan **Site URL** juga sudah diatur ke:
- Development: `http://localhost:5173`
- Production: `https://your-domain.com`

### 5. Save Configuration
Klik tombol **Save** untuk menyimpan perubahan

## URL yang Sudah Dikonfigurasi di Code

Aplikasi sudah dikonfigurasi untuk mengirim email dengan redirect URL otomatis:
```
${window.location.origin}/waiting-approval
```

Ini berarti:
- Jika aplikasi berjalan di `http://localhost:5173`, redirect akan ke `http://localhost:5173/waiting-approval`
- Jika aplikasi berjalan di `https://yourdomain.com`, redirect akan ke `https://yourdomain.com/waiting-approval`

## Flow Pendaftaran User

1. User mengisi form pendaftaran
2. User submit form
3. Sistem mengirim email konfirmasi ke email user
4. User klik link di email (akan diarahkan ke `/waiting-approval`)
5. User melihat halaman Waiting Approval dengan informasi:
   - Email konfirmasi sudah dikirim
   - Tunggu maksimal 15 menit
   - Informasi untuk hubungi admin jika tidak terima email

## Troubleshooting

### Email tidak diterima
- Cek folder Spam/Junk
- Tunggu maksimal 15 menit
- Hubungi admin via WhatsApp/Instagram

### Link email tidak mengarahkan ke halaman yang benar
- Pastikan Redirect URLs sudah dikonfigurasi di Supabase
- Pastikan URL yang ditambahkan sama persis dengan domain aplikasi Anda
- Cek apakah ada typo di URL

### Error "Invalid redirect URL"
- Pastikan URL sudah ditambahkan di **Authentication > URL Configuration > Redirect URLs**
- Pastikan tidak ada trailing slash di akhir URL
- Pastikan protokol (http/https) sesuai

## Contoh Konfigurasi Lengkap

Di Supabase Authentication > URL Configuration:

**Site URL:**
```
https://kasir-multi-toko.com
```

**Redirect URLs:** (satu per baris)
```
http://localhost:5173/waiting-approval
https://kasir-multi-toko.com/waiting-approval
https://6aeeab90-89a4-4850-b899-581a36ad9309.lovableproject.com/waiting-approval
```

## Catatan Tambahan

- Setiap kali Anda mengganti domain atau menambah environment baru, tambahkan redirect URL yang sesuai
- Untuk keamanan, hanya tambahkan domain yang Anda percaya
- Redirect URL case-sensitive (huruf besar/kecil berpengaruh)
