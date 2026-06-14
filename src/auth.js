/* ═══════════════════════════════════════════════════════════════
   AUTH MODULE — thin wrapper around the Supabase client.

   main.jsx initialisiert window.supabase aus VITE_SUPABASE_URL +
   VITE_SUPABASE_ANON_KEY. Fehlt der Client, schlagen alle Calls
   sofort fehl — keine Mock-Pfade.

   Eingaben werden hier validiert (E-Mail-Form, Passwortlänge >= 8),
   sodass Components sich nur um UX-Fehlerdarstellung kümmern.

   Test-User-Bypass `ritmo` / `padelhaus` ist absichtlich der
   einzige Nicht-Supabase-Pfad — für Demo/Dev-Zugang ohne Account.
═══════════════════════════════════════════════════════════════ */

export const SUPA_MISSING='Authentifizierung nicht verfügbar. Bitte später erneut versuchen.';

const EMAIL_RE=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Passwort-Policy (clientseitig).
 *  - Mindestens 10 Zeichen
 *  - Mindestens eine Ziffer
 *  - Mindestens ein Buchstabe
 * Schützt gegen triviale Brute-Force-Kandidaten wie "12345678" oder
 * "password". Supabase kümmert sich serverseitig um das Hashing
 * (bcrypt) und Rate-Limiting; das hier ist UX + Defense-in-Depth.
 */
function validatePassword(pw) {
  if (!pw || pw.length < 10) throw new Error('Passwort min. 10 Zeichen.');
  if (!/[0-9]/.test(pw)) throw new Error('Passwort muss mindestens eine Ziffer enthalten.');
  if (!/[a-zA-Z]/.test(pw)) throw new Error('Passwort muss mindestens einen Buchstaben enthalten.');
}

// Erlaubte Ländervorwahlen (nur DACH in der Beta).
export const DIAL_CODES = ['+49', '+43', '+41'];

/**
 * Telefon-Format-Check (clientseitig, NUR Format — keine Verifizierung).
 * Erwartet E.164-ähnlich: + DACH-Vorwahl + 6–14 Ziffern. Gibt die
 * normalisierte Nummer (ohne Trennzeichen) zurück.
 */
function validatePhone(phone) {
  const p = (phone || '').replace(/[\s\-()]/g, '');
  if (!p) throw new Error('Bitte Telefonnummer eingeben.');
  if (!DIAL_CODES.some(d => p.startsWith(d))) throw new Error('Bitte gültige Ländervorwahl wählen.');
  if (!/^\+\d{8,16}$/.test(p)) throw new Error('Telefonnummer-Format ungültig.');
  return p;
}

export function sb(){
  if(typeof window==='undefined'||!window.supabase) throw new Error(SUPA_MISSING);
  return window.supabase;
}

function appBase(){
  return (typeof window!=='undefined'&&window.__BASE__)||'/';
}

export const auth={
  async signUpWithEmail(email,password,phone){
    const e=(email||'').trim().toLowerCase();
    if(!e||!EMAIL_RE.test(e)) throw new Error('Bitte gültige E-Mail eingeben');
    validatePassword(password);
    const ph=validatePhone(phone);
    // ?verified=1 schaltet in der App die VerifiedLanding-Page frei,
    // statt direkt ins Onboarding zu springen. Telefon wandert als
    // User-Metadatum mit (nur Format geprüft, keine SMS-Verifizierung).
    const {data,error}=await sb().auth.signUp({
      email:e,password,
      options:{
        emailRedirectTo:window.location.origin+appBase()+'?verified=1',
        data:{phone:ph},
      },
    });
    if(error) throw new Error(error.message||'Registrierung fehlgeschlagen');
    return {needsVerification:!data.session,email:e};
  },

  async signInWithEmail(email,password){
    const e=(email||'').trim().toLowerCase();
    if(!e||!password) throw new Error('Bitte alle Felder ausfüllen');
    // Test-User-Bypass: NUR im Dev-Build aktiv. import.meta.env.DEV ist
    // bei `npm run build` false → der gesamte Branch wird vom Bundler
    // tree-shaken. So bleibt die Hintertür für lokale Entwicklung
    // erhalten, kommt aber nie in den ausgelieferten Production-Code.
    if(import.meta.env.DEV&&e==='ritmo'&&password==='padelhaus'){
      return {user:{email:'ritmo@test.local',provider:'test'}};
    }
    const {data,error}=await sb().auth.signInWithPassword({email:e,password});
    if(error) throw new Error(error.message||'Anmeldung fehlgeschlagen');
    return data;
  },

  async resendVerification(email){
    const {error}=await sb().auth.resend({type:'signup',email});
    if(error) throw new Error(error.message||'Resend fehlgeschlagen');
    return true;
  },

  async confirmVerification(){
    const {data}=await sb().auth.getSession();
    return !!data.session;
  },

  async signOut(){
    try{await sb().auth.signOut();}catch(e){}
  },

  async requestPasswordReset(email){
    const e=(email||'').trim().toLowerCase();
    if(!e||!EMAIL_RE.test(e)) throw new Error('Bitte gültige E-Mail eingeben');
    const {error}=await sb().auth.resetPasswordForEmail(e,{
      redirectTo:window.location.origin+appBase(),
    });
    if(error) throw new Error(error.message||'Reset-Mail konnte nicht gesendet werden');
    return true;
  },

  async updatePassword(newPassword){
    validatePassword(newPassword);
    const {error}=await sb().auth.updateUser({password:newPassword});
    if(error) throw new Error(error.message||'Passwort konnte nicht aktualisiert werden');
    return true;
  },
};
