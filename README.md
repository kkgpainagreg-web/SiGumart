# AGSA - Admin Guru Super App

## 📖 Tentang Aplikasi

AGSA (Admin Guru Super App) adalah aplikasi web yang membantu guru mengotomatisasi administrasi mengajar dengan konsep **Single Input – Multi Output**. 

Cukup masukkan data dasar sekali, dan sistem akan menghasilkan berbagai dokumen yang saling sinkron:
- ATP (Alur Tujuan Pembelajaran)
- Prota (Program Tahunan)
- Promes (Program Semester) - Premium
- Modul Ajar - Premium
- LKPD - Premium
- KKTP - Premium
- Jurnal & Absensi - Premium
- Daftar Nilai - Premium

## 🚀 Cara Memulai

### 1. Setup Firebase
Aplikasi sudah dikonfigurasi dengan Firebase. Pastikan rules Firestore sudah diatur:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /calendars/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /schedules/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /students/{docId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    match /settings/{docId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'super_admin';
    }
  }
}