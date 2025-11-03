# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## 🔌 Backend Integration

### API Configuration

Aplicația se conectează la backend-ul Hobbiz. Configurarea se face în `src/services/api.ts`.

**Default URLs**:
- Android Emulator: `http://10.0.2.2:5000`
- iOS Simulator: `http://localhost:5000`
- Physical Device: trebuie setat `EXPO_PUBLIC_API_URL`

### Environment Variables

Creează `.env` pentru a seta URL-ul custom:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.10:5000
```

**PowerShell (Windows)** - override temporar:

```powershell
$env:EXPO_PUBLIC_API_URL = 'http://192.168.1.10:5000'; npx expo start
```

### Test Endpoints

- Health: `GET /api/health` → `{ status: 'OK' }`
- Login: `POST /api/users/login` → `{ token, user }`
- Profile: `GET /api/users/profile` (requires auth)
- My Announcements: `GET /api/users/my-announcements` (requires auth)

### Services

- **`src/services/api.ts`** - Axios instance configurată cu interceptori
- **`src/services/auth.ts`** - Login/logout + token management (expo-secure-store)
- **`src/services/storage.ts`** - Wrapper peste expo-secure-store

---

## 📂 Structură Proiect

```
mobile-app/
├── app/                    # File-based routing (Expo Router)
│   ├── (tabs)/            # Tab navigation
│   │   ├── index.tsx      # Home/Explorează
│   │   ├── favorites.tsx  # Favorite
│   │   ├── sell.tsx       # Vinde
│   │   ├── chat.tsx       # Chat
│   │   └── account.tsx    # Cont
│   ├── my-announcements.tsx  # 🆕 Anunțurile mele
│   ├── profile.tsx        # Profil utilizator
│   ├── settings.tsx       # Setări
│   ├── login.tsx          # Autentificare
│   └── _layout.tsx        # Root layout
├── components/            # Componente reutilizabile
├── src/
│   ├── context/          # React Context (Auth, Theme)
│   ├── services/         # API, auth, storage
│   ├── types/            # TypeScript type definitions
│   └── theme/            # Culori, stiluri brand
├── assets/               # Imagini, fonturi
└── constants/            # Constante (theme.ts)
```

---

## ✨ Funcționalități Implementate

### 🔐 Autentificare
- Login cu email + parolă
- Token JWT salvat securizat (expo-secure-store)
- Auto-restore sesiune la restart
- Logout cu confirmare

### 📢 Anunțurile Mele (NEW)
- **Listare completă** a anunțurilor utilizatorului
- **Căutare** după titlu, ID sau locație
- **Filtrare** după categorie
- **Sortare** (recente, vechi, A-Z, Z-A)
- **Chip-uri filtre active** cu posibilitate de ștergere
- **Delete** cu dialog de confirmare
- **Design identic** cu aplicația web
- **Responsive** + safe area insets

### 🎨 Tematizare
- Light/Dark mode toggle
- Culori brand Hobbiz (#355070, #F8B195)
- Theme context pentru consistență
- Animații smooth între teme

### 🧭 Navigație
- Tab bar custom cu 5 secțiuni
- Stack navigation pentru flow-uri secundare
- Back button handling
- Deep linking ready

---

## 🎨 Design System

### Culori Brand
```typescript
primary: '#355070'        // Albastru Hobbiz
secondary: '#6c757d'      // Gri
accent: '#F8B195'         // Coral/Salmon
danger: '#dc3545'         // Roșu
success: '#28a745'        // Verde
```

### Tipografie
- Font sizes: 11-32px (xs → 5xl)
- Font weights: 400-800
- Line heights: 1.2-1.75

### Spacing
- Scale: 4-48px (xs → 5xl)
- Consistent gap/padding folosind `Spacing` din `src/theme/brand.ts`

### Shadows
- Platform-specific (iOS shadowOffset/shadowOpacity, Android elevation)
- 4 nivele: sm, md, lg, xl

---

## 🧪 Testing

### Teste manuale

1. **Autentificare**
   ```bash
   # Navigare: Login → introdu credențiale → Success
   ```

2. **Anunțurile mele**
   ```bash
   # Navigare: Cont → Anunțurile mele
   # Test: căutare, filtrare, sortare, delete
   ```

3. **Theme toggle**
   ```bash
   # Navigare: Cont → Mod întunecat (switch)
   ```

### Debug API

Verifică console-ul Expo pentru:
```
[mobile-app] API baseURL = http://192.168.1.10:5000
```

Dacă vezi `10.0.2.2` și rulezi pe device fizic Android, setează `EXPO_PUBLIC_API_URL`.

---

## 📚 Documentație Suplimentară

- **[IMPLEMENTATION_NOTES.md](./IMPLEMENTATION_NOTES.md)** - Detalii tehnice implementare "Anunțurile mele"
- **[GHID_ANUNTURI.md](./GHID_ANUNTURI.md)** - Ghid utilizare pentru utilizatori finali

---

## 🛠 Scripts Disponibile

```bash
npm start              # Pornește Expo dev server
npm run android        # Deschide în Android emulator
npm run ios            # Deschide în iOS simulator
npm run web            # Deschide în browser
npm run lint           # Rulează ESLint
npm run reset-project  # Reset la structura inițială Expo
```

---

## 🚧 Roadmap

- [ ] **Edit announcement** screen + functionality
- [ ] **Reactivate/Deactivate** announcement logic
- [ ] **Image gallery** pentru announcements (carousel)
- [ ] **Pull to refresh** pe liste
- [ ] **Pagination** pentru anunțuri multe
- [ ] **Push notifications** (Expo Notifications)
- [ ] **Offline mode** cu cache local
- [ ] **Analytics** tracking (Expo Analytics / Firebase)

---

## 🐛 Known Issues

1. **Edit/Reactivate/Deactivate** buttons show alerts (not implemented yet)
2. **Images** may not load if backend URL is incorrect
3. **Type errors** in some Expo internal files (can be ignored)

---

## 🤝 Contributing

1. Fork repo
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

Proprietar - Hobbiz Platform

---

## 🔗 Links

- **Web App**: https://hobbiz.netlify.app
- **Backend Repo**: `../backend/`
- **Frontend Web Repo**: `../frontend/`
- **Expo Docs**: https://docs.expo.dev
- **React Native Docs**: https://reactnative.dev

---

**Versiune**: 1.0.0  
**Ultima actualizare**: Octombrie 2025  
**Dezvoltat cu**: Expo 54, React Native 0.81, TypeScript 5.9
