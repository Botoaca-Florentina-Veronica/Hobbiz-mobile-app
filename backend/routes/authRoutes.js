const express = require('express');
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Inițiază autentificarea cu Google
// Acceptă opțional parametri "state=mobile" sau "mobile=1" pentru a redirecționa către aplicația mobilă după login
router.get('/google', (req, res, next) => {
  const rawState = typeof req.query.state === 'string' ? req.query.state : undefined;
  const isMobile = rawState === 'mobile' || req.query.mobile === '1';
  if (req.session) {
    req.session.oauthDestination = isMobile ? 'mobile' : 'web';
  }
  // If a client provided an explicit redirect URI (mobile app deep link), store it in session
  if (isMobile && typeof req.query.redirect === 'string' && req.session) {
    try {
      req.session.oauthRedirect = req.query.redirect;
    } catch (e) { /* ignore session write errors */ }
  }
  const options = { scope: ['profile', 'email'] };

  // Passport will use this state value to send to Google and validate on return. We prefix to know this is a mobile flow.
  if (isMobile) {
    const mobileState = `mobile_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    // If the client sent a redirect URI, encode it into the state so it survives without session cookies
    if (typeof req.query.redirect === 'string' && req.query.redirect) {
      const encoded = encodeURIComponent(req.query.redirect);
      options.state = `${mobileState}::redirect:${encoded}`;
    } else {
      options.state = mobileState;
    }
  } else if (rawState) {
    options.state = rawState;
  }
  return passport.authenticate('google', options)(req, res, next);
});

// Callback după autentificare
router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login',
    session: true,
  }),
  (req, res) => {
    // Generează JWT pentru utilizatorul autentificat
    const user = req.user;
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar
      },
      process.env.JWT_SECRET || 'jwt_secret',
      { expiresIn: '7d' }
    );

    // Redirect mobil dacă state=mobile
    const returnedState = typeof req.query.state === 'string' ? req.query.state : '';
    const sessionDest = req.session ? req.session.oauthDestination : undefined;
    if (req.session) {
      req.session.oauthDestination = undefined;
    }
    const stateSaysMobile = returnedState.startsWith('mobile_');
    const isMobile = stateSaysMobile || sessionDest === 'mobile';
    if (isMobile) {
      // Try to extract redirect encoded in state (preferred) to avoid relying on session cookies
      let stateRedirect;
      try {
        const st = typeof req.query.state === 'string' ? req.query.state : '';
        const marker = '::redirect:';
        const idx = st.indexOf(marker);
        if (idx !== -1) {
          const enc = st.slice(idx + marker.length);
          stateRedirect = decodeURIComponent(enc);
        }
      } catch (e) {
        stateRedirect = undefined;
      }

      let mobileRedirect;
      if (stateRedirect) {
        mobileRedirect = `${stateRedirect}${stateRedirect.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`;
      } else {
        // Fallback to any session-stored redirect if present (older clients)
        const sessionRedirect = req.session && req.session.oauthRedirect ? req.session.oauthRedirect : undefined;
        if (sessionRedirect) {
          mobileRedirect = `${sessionRedirect}${sessionRedirect.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`;
        } else {
          const scheme = process.env.MOBILE_APP_SCHEME || 'mobileapp';
          const path = process.env.MOBILE_APP_REDIRECT_PATH || 'oauth';
          mobileRedirect = `${scheme}://${path}?token=${encodeURIComponent(token)}`;
        }
      }
      // Clear session-stored redirect to avoid reuse
      try { if (req.session) req.session.oauthRedirect = undefined; } catch (e) {}
        // Log headers and session (sanitized) to help debug why some clients fall back to web
        try {
          console.log('[Auth] Mobile OAuth detected. Trying to open app with URL:', mobileRedirect);
          console.log('[Auth] Headers snippet:', {
            ua: (req.headers['user-agent'] || '').slice(0, 200),
            referer: req.headers.referer || req.headers.referrer || null
          });
          console.log('[Auth] Query:', req.query);
          console.log('[Auth] Session dest:', sessionDest ? 'mobile' : 'web');
        } catch (e) { /* ignore logging errors */ }

        // Serve an HTML page that attempts to open the app and after a short timeout redirects to web as fallback.
        const webFallback = process.env.NODE_ENV === 'production' ? 'https://hobbiz.netlify.app' : 'http://localhost:5173';
        const maskedToken = token ? token.slice(0, 8) + '...' : '';
        const html = `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>Open app</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial; display:flex; align-items:center; justify-content:center; height:100vh; margin:0; background:#f6f7fb }
        .card { background: #fff; padding: 24px; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); max-width: 640px; text-align:center }
        a { color: #2563eb; text-decoration:none; font-weight:600 }
        pre { text-align:left; background:#f3f4f6; padding:12px; border-radius:8px; overflow:auto }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>Se deschide aplicația...</h2>
        <p>Dacă aplicația nu pornește automat, atinge butonul de mai jos.</p>
        <p><a id="open-link" href="${mobileRedirect}">Deschide aplicația Hobbiz</a></p>
        <p style="margin-top:12px"><a id="web-link" href="${webFallback}">Continuă pe web</a></p>
        <hr style="margin:16px 0" />
        <div style="text-align:left">
          <strong>Debug:</strong>
          <pre>token=${maskedToken}\nstate=${returnedState}\nsessionDest=${sessionDest || 'none'}\nuserAgent=${(req.headers['user-agent']||'').slice(0,200)}</pre>
        </div>
      </div>
      <script>
        (function() {
          var openUrl = '${mobileRedirect}';
          function openApp(){ try{ window.location = openUrl; } catch(e){} }
          function openViaIframe(){
            try{
              var iframe = document.createElement('iframe');
              iframe.style.display = 'none';
              iframe.src = openUrl;
              document.body.appendChild(iframe);
              setTimeout(function(){ try{ document.body.removeChild(iframe); }catch(e){} }, 1500);
            }catch(e){}
          }
          try { openApp(); } catch(e) {}
          setTimeout(function(){ try { openViaIframe(); } catch(e) {} }, 200);
          // After 1800ms if app didn't open, redirect user to web fallback automatically
          setTimeout(function(){ window.location = '${webFallback}'; }, 1800);
        })();
      </script>
    </body>
  </html>
  `;
        res.set('Content-Type', 'text/html; charset=utf-8');
        return res.send(html);
    }

    // Redirecționează către frontend web cu tokenul în query string
    // Pentru dezvoltare locală
    const frontendUrl = process.env.NODE_ENV === 'production' 
      ? 'https://hobbiz.netlify.app' 
      : 'http://localhost:5173';

    return res.redirect(`${frontendUrl}/oauth-success?token=${token}`);
  }
);

// Logout
router.get('/logout', (req, res) => {
  req.logout(() => {
    const frontendUrl = process.env.NODE_ENV === 'production' 
      ? 'https://hobbiz.netlify.app' 
      : 'http://localhost:5173';
    res.redirect(frontendUrl);
  });
});

module.exports = router;


/*
// Inițiază autentificarea cu Facebook
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));

// Callback după autentificare Facebook
router.get('/facebook/callback',
  passport.authenticate('facebook', {
    failureRedirect: '/login',
    session: true,
  }),
  (req, res) => {
    // Generează JWT pentru utilizatorul autentificat
    const user = req.user;
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar
      },
      process.env.JWT_SECRET || 'jwt_secret',
      { expiresIn: '7d' }
    );
    // Redirecționează către frontend cu tokenul în query string
    res.redirect(`https://hobbiz.netlify.app/oauth-success?token=${token}`);
  }
); */