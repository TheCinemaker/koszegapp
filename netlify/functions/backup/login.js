// netlify/functions/login.js
const jwt = require('jsonwebtoken');

const USERS = {
  'admin': { 
    permissions: ['*'] // Az Admin mindent megtehet, minden fájlt kezelhet
  },
  'varos': {
    // A Város felel az általános infókért, látnivalókért, eseményekért
    permissions: [
      'events:view_all', 'events:create', 'events:edit', 'events:delete',
      'attractions:view_all', 'attractions:create', 'attractions:edit', 'attractions:delete',
      'info:view_all', 'info:edit',
      'restaurants:view_all', 'restaurants:edit' // Lehet, hogy csak ránéznek
    ] 
  },
  'var': { 
    // A Vár a saját eseményeit és a várhoz kötődő látnivalókat kezeli
    permissions: [
      'events:view_own', 'events:create', 'events:edit_own', 'events:delete_own'
      // Jövőben: 'attractions:edit_specific' (pl. csak a Vármúzeumot szerkesztheti)
    ] 
  },
  'tourinform': {
    // A Tourinform a turisztikai tartalmakért felel: események, szállások, szabadidő
    permissions: [
      'events:view_all', 'events:create', 'events:edit', 'events:delete',
      'hotels:view_all', 'hotels:create', 'hotels:edit', 'hotels:delete',
      'leisure:view_all', 'leisure:create', 'leisure:edit', 'leisure:delete'
    ] 
  },
  'kulsos': { 
    // A Külsős Partner csak a saját eseményeit kezeli, mást nem is lát
    permissions: [
      'events:view_own', 'events:create', 'events:edit_own', 'events:delete_own'
    ] 
  }
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // ---- DIAGNOSZTIKAI SOR ----
    console.log('[login.js] JWT_SECRET:', process.env.JWT_SECRET ? `Létezik, hossza: ${process.env.JWT_SECRET.length}` : '!!! HIÁNYZIK !!!');
    
    const { userId, password } = JSON.parse(event.body);
    
    const passwordEnvVar = `ADMIN_PASSWORD_${userId.toUpperCase()}`;
    const correctPassword = process.env[passwordEnvVar];

    if (!correctPassword || password !== correctPassword) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Hibás felhasználónév vagy jelszó.' }) };
    }

    const userProfile = USERS[userId];
    if (!userProfile) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Ismeretlen felhasználó.' }) };
    }

    const token = jwt.sign(
      { 
        id: userId,
        permissions: userProfile.permissions 
      }, 
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        token,
        user: { 
          id: userId,
          permissions: userProfile.permissions
        } 
      }),
    };

  } catch (error) {
    // ---- JOBB HIBAKEZELÉS ----
    console.error('[login.js] Hiba történt:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Szerverhiba a bejelentkezés során.' }) };
  }
};
