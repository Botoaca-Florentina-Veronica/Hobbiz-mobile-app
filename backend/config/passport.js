
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
//const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/User');

/*
// Facebook OAuth2.0 Strategy
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: process.env.FACEBOOK_CALLBACK_URL,
  profileFields: ['id', 'emails', 'name', 'picture.type(large)']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Try to find the user by facebookId
    let user = await User.findOne({ facebookId: profile.id });

    if (user) {
      // Sync avatar and name at every Facebook login
      user.avatar = profile.photos && profile.photos[0] ? profile.photos[0].value : user.avatar;
      user.firstName = profile.name && profile.name.givenName ? profile.name.givenName : user.firstName;
      user.lastName = profile.name && profile.name.familyName ? profile.name.familyName : user.lastName;
      await user.save();
      return done(null, user);
    } else {
      // If not found by facebookId, try to find by email
      const email = profile.emails && profile.emails[0] ? profile.emails[0].value : undefined;
      if (email) {
        user = await User.findOne({ email });
        if (user) {
          user.facebookId = profile.id;
          user.avatar = profile.photos && profile.photos[0] ? profile.photos[0].value : user.avatar;
          user.firstName = profile.name && profile.name.givenName ? profile.name.givenName : user.firstName;
          user.lastName = profile.name && profile.name.familyName ? profile.name.familyName : user.lastName;
          await user.save();
          return done(null, user);
        }
      }
      // If user not found by either facebookId or email, create a new one
      user = await User.create({
        facebookId: profile.id,
        firstName: profile.name && profile.name.givenName ? profile.name.givenName : '',
        lastName: profile.name && profile.name.familyName ? profile.name.familyName : '',
        email: email || '',
        avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : '',
        // Password is not required for Facebook users
      });
      return done(null, user);
    }
  } catch (err) {
    return done(err, null);
  }
}));

*/

// Helperi pentru Google OAuth favorit merge
const normalizeEmail = (e='') => e.trim().toLowerCase();
const escapeRegex = (str='') => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
async function mergeDupesByEmail(baseEmail, preferredUserId) {
  try {
    if (!baseEmail) return null;
    const regex = new RegExp(`^${escapeRegex(baseEmail)}$`, 'i');
    const users = await User.find({ email: regex });
    if (users.length <= 1) return users[0] || null;
    let primary = users.find(u => String(u._id) === String(preferredUserId)) || users.find(u => u.googleId) || users[0];
    const favSet = new Set();
    users.forEach(u => (u.favorites||[]).forEach(f => favSet.add(f.toString())));
    primary.favorites = Array.from(favSet);
    // Completează câmpuri lipsă
    for (const u of users) {
      if (!primary.firstName && u.firstName) primary.firstName = u.firstName;
      if (!primary.lastName && u.lastName) primary.lastName = u.lastName;
      if (!primary.avatar && u.avatar) primary.avatar = u.avatar;
      if (!primary.phone && u.phone) primary.phone = u.phone;
      if (!primary.localitate && u.localitate) primary.localitate = u.localitate;
    }
    primary.email = normalizeEmail(primary.email);
    await primary.save();
    const toDelete = users.filter(u => String(u._id) !== String(primary._id));
    if (toDelete.length) await User.deleteMany({ _id: { $in: toDelete.map(u => u._id) } });
    return primary;
  } catch (e) {
    console.warn('[GoogleOAuthMerge] Eroare merge:', e.message);
    return null;
  }
}

// Google OAuth2.0 Strategy (optional in local/dev)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CALLBACK_URL) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const primaryEmail = profile.emails && profile.emails[0] ? normalizeEmail(profile.emails[0].value) : undefined;
      let user = await User.findOne({ googleId: profile.id });
      if (!user && primaryEmail) {
        user = await User.findOne({ email: new RegExp(`^${escapeRegex(primaryEmail)}$`, 'i') });
      }

      if (user) {
        // Actualizează date profil
        user.googleId = user.googleId || profile.id;
        user.avatar = (profile.photos && profile.photos[0]) ? profile.photos[0].value : user.avatar;
        user.firstName = profile.name?.givenName || user.firstName;
        user.lastName = profile.name?.familyName || user.lastName;
        if (primaryEmail) user.email = primaryEmail; // normalize
        await user.save();
      } else {
        user = await User.create({
          googleId: profile.id,
            firstName: profile.name?.givenName || '',
            lastName: profile.name?.familyName || '',
            email: primaryEmail || '',
            avatar: (profile.photos && profile.photos[0]) ? profile.photos[0].value : ''
        });
      }

      await mergeDupesByEmail(primaryEmail, user._id);
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }));
} else {
  console.warn('⚠️ Google OAuth not configured: missing env vars. Skipping strategy setup.');
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
