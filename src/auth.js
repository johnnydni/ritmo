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

export function sb(){
  if(typeof window==='undefined'||!window.supabase) throw new Error(SUPA_MISSING);
  return window.supabase;
}

function appBase(){
  return (typeof window!=='undefined'&&window.__BASE__)||'/';
}

export const auth={
  async signUpWithEmail(email,password){
    const e=(email||'').trim().toLowerCase();
    if(!e||!EMAIL_RE.test(e)) throw new Error('Bitte gültige E-Mail eingeben');
    if(!password||password.length<8) throw new Error('Passwort min. 8 Zeichen');
    // ?verified=1 schaltet in der App die VerifiedLanding-Page frei,
    // statt direkt ins Onboarding zu springen.
    const {data,error}=await sb().auth.signUp({
      email:e,password,
      options:{emailRedirectTo:window.location.origin+appBase()+'?verified=1'},
    });
    if(error) throw new Error(error.message||'Registrierung fehlgeschlagen');
    return {needsVerification:!data.session,email:e};
  },

  async signInWithEmail(email,password){
    const e=(email||'').trim().toLowerCase();
    if(!e||!password) throw new Error('Bitte alle Felder ausfüllen');
    // Test-User-Bypass für Demo/Dev-Zugang ohne Supabase-Konto.
    // Bewusst gelassen — der einzige Nicht-Supabase-Pfad in der Auth.
    if(e==='ritmo'&&password==='padelhaus'){
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
    if(!newPassword||newPassword.length<8) throw new Error('Passwort min. 8 Zeichen');
    const {error}=await sb().auth.updateUser({password:newPassword});
    if(error) throw new Error(error.message||'Passwort konnte nicht aktualisiert werden');
    return true;
  },
};
