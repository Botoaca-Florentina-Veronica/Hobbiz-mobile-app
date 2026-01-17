## Hobbiz-mobile-app

Hobbiz este o aplicație mobilă cross-platform (Android/iOS) cu platformă dedicată (www.hobbiz.ro) unde utilizatorii își pot publica anunțuri în vederea monetizarii hobby‑urilor. Hobbiz are ca scop transformarea pasiunilor în sprijin financiar — fie pentru a le susține și dezvolta, fie pentru a genera un venit suplimentar.

# Demo

![alt text](image.png)

# Features

-Autentificare (email + Google OAuth) -in viitor si facebook + apple
-Creare, editare, ștergere anunțuri (CRUD)
-Chat în timp real cu Socket.IO
-Notificări push (Expo Notifications + FCM-firebase)
-Schimbarea parolei folosind mailerSend(cod trimis pe email-ul utilizatorului)
-Sistem de rating/recenzii
-Suport temă întunecată/luminoasă
-Sincronizare web + mobil (același backend)
-Reactivare/dezactivare anunț (arhivare temporară fără ștergere)

# Tech Stack

-Frontend: Expo (React Native), TypeScript, Expo Router, Axios, socket.io-client, expo-notifications, expo-secure-store.
-Backend: Node.js, Express, MongoDB (Mongoose), Socket.IO, Cloudinary, JWT, Passport Google OAuth, Firebase (FMC).
-Modele & Securitate: User, Announcement, Message, Notification, Review. Securitate: Token-uri JWT în SecureStore, validare/sanitizare input, CORS whitelist, limită upload 5MB/imagine.

# Instalare & rulare locală

## -Clone this repo
