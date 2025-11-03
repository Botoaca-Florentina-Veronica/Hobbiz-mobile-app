// backend/server.js
require('dotenv').config();

// Error handling pentru uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

console.log('🔍 DEBUG ENV VARS:');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '***SET***' : 'NOT SET');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '***SET***' : 'NOT SET');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT || 5000);

const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/db'); // Importă conexiunea
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes'); // Importă rutele de autentificare
const session = require('express-session'); // Import express-session
const passport = require('passport'); // Import passport
const mitmRoutes = require('./routes/mitmRoutes'); // Importă rutele pentru mitm
const announcementRoutes = require('./routes/announcementRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const { execFile } = require('child_process');
const Alert = require('./models/Alert');
const path = require('path');
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

const app = express();
const server = http.createServer(app);

// Utility: detect private/local hosts (LAN IPs, localhost)
function isPrivateHostname(hostname) {
  if (!hostname) return false;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
  // 10.0.0.0/8
  if (/^10\./.test(hostname)) return true;
  // 192.168.0.0/16
  if (/^192\.168\./.test(hostname)) return true;
  // 172.16.0.0 - 172.31.255.255
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)) return true;
  return false;
}

// Configure Socket.IO with CORS
const io = socketIo(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      try {
        const hostname = new URL(origin).hostname;
        const isNetlify = /\.netlify\.app$/.test(hostname);
        const isDigitalOcean = /\.ondigitalocean\.app$/.test(hostname);
        const allowedOrigins = [
          process.env.FRONTEND_URL,
          'https://hobbiz-app-kkull.ondigitalocean.app/',
          'https://hobbiz.netlify.app',
          'https://hobbiz-mui.netlify.app',
          'https://hobbiz-mui.onrender.com',
          'http://localhost:5173',
          'http://localhost:5174',
          'http://localhost:8081', // Expo Dev Server
          'http://localhost:19000', // Expo alternative port
          'http://localhost:19006'  // Expo web
        ].filter(Boolean);
        if (allowedOrigins.includes(origin) || isNetlify || isDigitalOcean || isPrivateHostname(hostname)) {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
      } catch (e) {
        return callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Store active users and their typing status
const activeUsers = new Map(); // userId -> socketId
const typingUsers = new Map(); // conversationId -> Set of userIds

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  // User joins with their ID
  socket.on('join', (userId) => {
    activeUsers.set(userId, socket.id);
    socket.userId = userId;
    console.log(`👤 User ${userId} joined with socket ${socket.id}`);
  });

  // Handle typing events
  socket.on('typing', ({ conversationId, isTyping }) => {
    if (!socket.userId) return;
    
    if (!typingUsers.has(conversationId)) {
      typingUsers.set(conversationId, new Set());
    }
    
    const typingSet = typingUsers.get(conversationId);
    
    if (isTyping) {
      typingSet.add(socket.userId);
    } else {
      typingSet.delete(socket.userId);
    }
    
    // Broadcast typing status to other users in the conversation
    const participantIds = conversationId.split('-');
    participantIds.forEach(participantId => {
      if (participantId !== socket.userId) {
        const participantSocketId = activeUsers.get(participantId);
        if (participantSocketId) {
          io.to(participantSocketId).emit('userTyping', {
            conversationId,
            userId: socket.userId,
            isTyping
          });
        }
      }
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    if (socket.userId) {
      activeUsers.delete(socket.userId);
      // Remove from all typing conversations
      typingUsers.forEach((typingSet, conversationId) => {
        if (typingSet.has(socket.userId)) {
          typingSet.delete(socket.userId);
          // Notify others that user stopped typing
          const participantIds = conversationId.split('-');
          participantIds.forEach(participantId => {
            if (participantId !== socket.userId) {
              const participantSocketId = activeUsers.get(participantId);
              if (participantSocketId) {
                io.to(participantSocketId).emit('userTyping', {
                  conversationId,
                  userId: socket.userId,
                  isTyping: false
                });
              }
            }
          });
        }
      });
      console.log(`👤 User ${socket.userId} disconnected`);
    }
  });
});

// Make io available to routes
app.set('io', io);
app.set('activeUsers', activeUsers);

// Middleware
// CORS cu whitelist flexibil pentru prod/dev și suport pentru domeniile Netlify și DigitalOcean
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://hobbiz.netlify.app',
  'https://hobbiz-mui.netlify.app',
  'https://hobbiz-mui.netlify.app',
  'https://hobbiz-mui.onrender.com',
  'https://hobbiz-app-kkull.ondigitalocean.app/',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:8081', // Expo Dev Server
  'http://localhost:19000', // Expo alternative port
  'http://localhost:19006'  // Expo web
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Permite tool-uri server-to-server sau curl fără origin
    if (!origin) return callback(null, true);
    try {
      const hostname = new URL(origin).hostname;
      const isNetlify = /\.netlify\.app$/.test(hostname);
      const isDigitalOcean = /\.ondigitalocean\.app$/.test(hostname);
      if (allowedOrigins.includes(origin) || isNetlify || isDigitalOcean || isPrivateHostname(hostname)) {
        return callback(null, true);
      }
      console.warn(`CORS blocat pentru origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    } catch (e) {
      console.warn('CORS origin parse error:', e.message);
      return callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));
// Accept larger JSON bodies (for base64 images) and urlencoded payloads
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use('/api/notifications', notificationRoutes);

// Configure session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'a_very_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Conectare la baza de date
connectDB(); // Apelează funcția exportată

// Rute
app.use('/api/users', userRoutes);
app.use('/auth', authRoutes); // Adaugă rutele de autentificare
app.use('/api/mitm', mitmRoutes); // Adaugă rutele pentru mitm

app.use('/api/announcements', announcementRoutes); // Rute pentru anunturi publice
app.use('/api/favorites', favoriteRoutes); // Rute pentru favorite persistente
app.use('/api/messages', messageRoutes); // Rute pentru mesaje chat
app.use('/api/reviews', reviewRoutes); // Rute pentru recenzii (create/list)

// Servire imagini uploadate din frontend/public/uploads
app.use('/uploads', express.static(path.join(__dirname, '../frontend/public/uploads')));

app.get('/', (req, res) => {
  res.send('🚀 Serverul rulează!');
});

// Health check endpoint pentru Render
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// DB healthcheck endpoint
app.get('/health/db', (req, res) => {
  try {
    const mongoose = require('mongoose');
    const rs = mongoose.connection?.readyState;
    res.json({ readyState: rs, ok: rs === 1 });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Folosește calea corectă către mitm_detector.exe și interfața de rețea "Ethernet"
  execFile('../mitm-detector.exe', ['Ethernet'], (error, stdout, stderr) => {
    if (error) {
      console.error('Eroare la rularea detectorului:', error);
      return res.status(500).json({ error: 'Eroare internă la detecție MITM' });
    }

    let alerts = [];
    try {
      alerts = JSON.parse(stdout); // dacă output-ul Rust e JSON
    } catch (e) {
      alerts = stdout.split('\n').filter(Boolean);
    }

    if (alerts.length > 0) {
      Alert.create({
        username,
        alert: alerts.join('; '),
        timestamp: new Date()
      });
      return res.status(403).json({ error: 'Sesiune suspectă: posibil atac MITM detectat!' });
    }

    // Continuă login-ul normal (aici pui logica ta de autentificare)
    res.json({ success: true });
  });
});

// Pornire server
const PORT = process.env.PORT || 5000;
// Print LAN IPs to help debugging from physical devices
try {
  const os = require('os');
  const nets = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push(net.address);
      }
    }
  }
  if (addresses.length) {
    console.log('🔍 LAN addresses:', addresses.join(', '));
  }
} catch (e) {
  // ignore
}

// Listen on all interfaces so physical devices on the same LAN can reach the server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🔥 Server pe http://0.0.0.0:${PORT} (accessible on LAN)`);
  console.log(`🔌 Socket.IO enabled for real-time chat`);
});

// Error handling pentru server
server.on('error', (err) => {
  console.error('💥 Server Error:', err);
  process.exit(1);
});

// Gestionare închidere grațioasă (opțional)
const mongoose = require('mongoose');
process.on('SIGINT', async () => {
  console.log('🔄 Shutting down gracefully...');
  await mongoose.connection.close();
  console.log('⏹️ Conexiune MongoDB închisă grațios');
  server.close(() => {
    console.log('⏹️ Server closed');
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('💥 UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});