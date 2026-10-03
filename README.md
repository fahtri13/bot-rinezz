# 🤖 rinezz - WhatsApp AI & Roleplay Game Bot

Bot WhatsApp pintar bertenaga AI **9router (`kr/auto`)** dengan fitur percakapan santai, sistem Mini-RPG Roleplay bertingkat level, daily claim, pekerjaan per-role, dan pertarungan Bos Epik setiap kelipatan level 5.

Dibuat menggunakan `@whiskeysockets/baileys` yang ringan, cepat, dan hemat memori tanpa memerlukan browser Chromium.

---

## 🌟 Fitur Utama

1. **Otak AI 9router (`kr/auto`):**
   - Karakter persona ramah, santai, dan tidak kaku bernama **rinezz**.
   - Otomatis membalas chat pribadi (DM).
   - Di grup WhatsApp: Menjawab jika di-*mention* (`@rinezz`), di-*reply*, atau menggunakan `/ai <pertanyaan>`.
   - Mengingat riwayat percakapan (memory context) agar obrolan nyambung.
   - Perintah `/reset` untuk membersihkan ingatan obrolan.

2. **Sistem Roleplay RPG (`/game`):**
   - **5 Pilihan Role:**
     - 🛡️ **Tank:** Ketahanan baja, HP paling tebal, defense tinggi.
     - ⚔️ **Warrior:** Petarung seimbang, serangan & pertahanan stabil.
     - 🧙‍♂️ **Mage:** Sihir mematikan dengan damage sangat tinggi (*Magic Burst*).
     - 🏹 **Archer:** Pemanah lincah dengan serangan critical damage.
     - 🗡️ **Assassin:** Pembunuh bayangan dengan damage mematikan.
   - **Statistik Pemain:** Level, EXP, HP, Max HP, Power, Role, dan Gold.
   - **/claim:** Hadiah harian (Daily EXP & Gold) setiap 24 jam sekali.
   - **/work:** Bekerja sesuai role pemain (Pengawal Kerajaan, Instruktur Militer, Pustakawan Sihir, Bounty Hunter, Spionase).
   - **/game hunt:** Berburu monster liar di hutan untuk mengumpulkan EXP & Gold.
   - **/mission:** Misi ekspedisi petualangan biasa, dan **Epic Boss Raid khusus setiap kelipatan Level 5 (Level 5, 10, 15, 20, dst)**!
   - **/game heal:** Memulihkan HP pemain menggunakan Gold atau istirahat.
   - **/game top:** Papan peringkat 10 petualang level tertinggi.

3. **Perintah Dasar & Hiburan:**
   - **/ping:** Cek kecepatan respon (ms), uptime, dan status online bot.
   - **/menu** / **/help:** Menampilkan daftar lengkap semua perintah.
   - **/info:** Menampilkan spesifikasi bot, versi, model AI, dan identitas pembuat.
   - **/roast [nama]:** Roasting lucu dan kocak tanpa menyinggung fisik/SARA.
   - **/joke:** Lelucon bapak-bapak dan tebak-tebakan receh.
   - **/curhat [pesan]:** Mode pendengar yang empatik, suportif, dan ramah.

---

## 📋 Struktur Folder

```text
bot-rinezz/
├── config.js               # Konfigurasi aplikasi
├── index.js                # Entry point utama bot
├── package.json            # Daftar dependensi Node.js
├── .env                    # File konfigurasi API Key & pengaturan login
├── .env.example            # Contoh template file .env
├── database/
│   └── players.json        # Database lokal penyimpanan pemain RPG
└── src/
    ├── ai.js               # Integrasi 9router (kr/auto) & context memory
    ├── commands.js         # Pengolah seluruh perintah (/ping, /menu, /game, dll)
    ├── rpg.js              # Sistem game roleplay (role, hunt, work, boss raid)
    └── whatsapp.js         # Handler koneksi Baileys (QR code & pairing code)
```

---

## 🚀 Cara Menjalankan Bot

### 1. Masukkan API Key 9router
Buka file `.env` di teks editor, lalu masukkan API Key 9router Anda:
```env
ROUTER9_API_KEY=masukkan_api_key_9router_anda_disini
ROUTER9_BASE_URL=https://api.9router.com/v1
AI_MODEL=kr/auto
```

### 2. Pilih Metode Login WhatsApp
Pada file `.env`, tentukan metode login:
* **Scan QR Code (Default):**
  ```env
  USE_PAIRING_CODE=false
  ```
* **Pairing Code 8-Digit (Tanpa Kamera):**
  ```env
  USE_PAIRING_CODE=true
  PAIRING_NUMBER=6281234567890
  ```

### 3. Jalankan Bot
Buka terminal / PowerShell di folder bot ini, lalu ketik:
```bash
npm start
```
atau
```bash
node index.js
```

1. Jika menggunakan **QR Code**: Scan QR yang muncul di terminal melalui menu **Perangkat Tertaut (Linked Devices)** di WhatsApp HP Anda.
2. Jika menggunakan **Pairing Code**: Buka WhatsApp HP -> Perangkat Tertaut -> Tautkan dengan nomor telepon, lalu masukkan kode 8 digit yang muncul di terminal.
3. Setelah terhubung, status akan berubah menjadi:
   `✅ BOT "RINEZZ" BERHASIL TERHUBUNG KE WHATSAPP!`

---

## 🎮 Panduan Bermain RPG

1. **Daftar Karakter:**
   Ketik: `/game register <role>`
   Contoh: `/game register tank` atau `/game register warrior`
2. **Klaim Hadiah Harian:**
   Ketik: `/claim`
3. **Bekerja:**
   Ketik: `/work`
4. **Berburu Monster:**
   Ketik: `/game hunt`
5. **Cek Profil:**
   Ketik: `/game profile`
6. **Misi & Lawan Bos:**
   Ketik: `/mission`
   *(Ketika levelmu mencapai 5, 10, 15, 20, dll., kamu akan otomatis menantang Bos Kuat!)*
7. **Memulihkan HP:**
   Ketik: `/game heal`

---

## 👤 Pembuat
* **Nama:** rinezzero
* **Bot:** rinezz
