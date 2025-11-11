/**
 * Configuration Authentification Stricte
 * - JWT valide 2h uniquement
 * - Pas de refresh token
 * - Déconnexion automatique si session OS change
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * Client Supabase avec configuration session stricte
 */
export const supabaseStrict = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // DÉSACTIVER le refresh token automatique
    autoRefreshToken: false,

    // DÉSACTIVER la persistance dans localStorage
    // Utiliser sessionStorage (se vide à la fermeture du navigateur)
    storage: window.sessionStorage,

    // Détection de changement de session
    detectSessionInUrl: true,

    // Pas de stockage persistant
    persistSession: false,

    // Flow PKCE pour sécurité renforcée
    flowType: 'pkce',
  },
});

/**
 * Durée de vie du JWT : 2 heures (7200 secondes)
 * Note: Cette configuration doit AUSSI être définie dans Supabase Dashboard
 * Chemin: Authentication > Settings > JWT expiry = 7200
 */
export const JWT_EXPIRY_SECONDS = 7200; // 2 heures

/**
 * Identifiant unique de session système
 * Génère un ID unique au démarrage de la session de l'ordinateur
 */
const SESSION_MARKER_KEY = 'wadashaqeen_session_marker';

/**
 * Génère un marqueur unique pour cette session système
 */
function generateSessionMarker(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Récupère ou crée le marqueur de session
 */
function getOrCreateSessionMarker(): string {
  let marker = sessionStorage.getItem(SESSION_MARKER_KEY);
  if (!marker) {
    marker = generateSessionMarker();
    sessionStorage.setItem(SESSION_MARKER_KEY, marker);
  }
  return marker;
}

/**
 * Vérifie si la session système est toujours la même
 */
export function isSessionValid(): boolean {
  const currentMarker = sessionStorage.getItem(SESSION_MARKER_KEY);

  // Pas de marqueur = nouvelle session ou navigateur fermé/rouvert
  if (!currentMarker) {
    return false;
  }

  return true;
}

/**
 * Initialise le marqueur de session au démarrage
 */
export function initializeSessionMarker(): string {
  return getOrCreateSessionMarker();
}

/**
 * Invalide la session actuelle
 */
export async function invalidateSession(): Promise<void> {
  // Supprimer le marqueur de session
  sessionStorage.removeItem(SESSION_MARKER_KEY);

  // Déconnexion Supabase
  await supabaseStrict.auth.signOut();

  // Nettoyer tout le sessionStorage
  sessionStorage.clear();
}

/**
 * Vérifie si le token JWT est expiré
 */
export function isTokenExpired(expiresAt?: number): boolean {
  if (!expiresAt) return true;

  // Vérifier si le token expire dans moins de 5 minutes
  const fiveMinutesInSeconds = 5 * 60;
  const now = Math.floor(Date.now() / 1000);

  return expiresAt - now < fiveMinutesInSeconds;
}

/**
 * Hook de détection de fermeture/arrêt
 * Écoute les événements système
 */
export function setupSessionMonitoring(onSessionInvalid: () => void): () => void {
  // Détection de fermeture du navigateur/onglet
  const handleBeforeUnload = () => {
    // Le marqueur sera automatiquement supprimé car sessionStorage se vide
    console.log('🔒 Session terminée - fermeture du navigateur');
  };

  // Détection de visibilité (changement d'onglet, verrouillage écran, etc.)
  const handleVisibilityChange = async () => {
    if (document.hidden) {
      console.log('🔒 Navigateur en arrière-plan');
    } else {
      // Vérifier si la session est toujours valide au retour
      const valid = isSessionValid();
      if (!valid) {
        console.log('❌ Session invalide détectée au retour');
        await invalidateSession();
        onSessionInvalid();
      }
    }
  };

  // Détection de changement de focus
  const handleFocus = async () => {
    // Vérifier la session à chaque retour de focus
    const valid = isSessionValid();
    if (!valid) {
      console.log('❌ Session invalide - nouvelle session OS détectée');
      await invalidateSession();
      onSessionInvalid();
    }

    // Vérifier l'expiration du token
    const {
      data: { session },
    } = await supabaseStrict.auth.getSession();
    if (session && isTokenExpired(session.expires_at)) {
      console.log('⏰ Token JWT expiré (2h dépassées)');
      await invalidateSession();
      onSessionInvalid();
    }
  };

  // Enregistrer les listeners
  window.addEventListener('beforeunload', handleBeforeUnload);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('focus', handleFocus);

  // Vérification périodique toutes les 30 secondes
  const intervalId = setInterval(async () => {
    const {
      data: { session },
    } = await supabaseStrict.auth.getSession();

    if (session && isTokenExpired(session.expires_at)) {
      console.log('⏰ Token JWT expiré - déconnexion automatique');
      await invalidateSession();
      onSessionInvalid();
    }
  }, 30000); // 30 secondes

  // Fonction de nettoyage
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('focus', handleFocus);
    clearInterval(intervalId);
  };
}

/**
 * Connexion avec session stricte
 */
export async function signInStrict(email: string, password: string) {
  // Générer un nouveau marqueur de session
  const sessionMarker = generateSessionMarker();
  sessionStorage.setItem(SESSION_MARKER_KEY, sessionMarker);

  // Connexion Supabase
  const { data, error } = await supabaseStrict.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    sessionStorage.removeItem(SESSION_MARKER_KEY);
    throw error;
  }

  console.log('✅ Connexion réussie - Session valide pour 2h');
  console.log('🔑 Marqueur de session:', sessionMarker);

  return data;
}

/**
 * Récupère les informations de session
 */
export async function getStrictSession() {
  // Vérifier le marqueur de session
  if (!isSessionValid()) {
    console.log('❌ Session système invalide');
    await invalidateSession();
    return null;
  }

  // Récupérer la session Supabase
  const {
    data: { session },
    error,
  } = await supabaseStrict.auth.getSession();

  if (error || !session) {
    console.log('❌ Pas de session Supabase');
    return null;
  }

  // Vérifier l'expiration
  if (isTokenExpired(session.expires_at)) {
    console.log('⏰ Token expiré');
    await invalidateSession();
    return null;
  }

  return session;
}
