/**
 * 🔒 SÉCURITÉ - Gestion Complète du Nettoyage des Sessions
 *
 * Ce module implémente les meilleures pratiques de sécurité pour éviter
 * les fuites de données entre utilisateurs (OWASP Top 10 - A01:2021 Broken Access Control)
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * 🧹 Nettoyage COMPLET de toutes les données utilisateur
 *
 * À appeler OBLIGATOIREMENT à la déconnexion pour éviter les fuites de données
 * entre différents utilisateurs sur le même navigateur/appareil.
 */
export async function clearAllUserData(): Promise<void> {
  console.log('🔒 SÉCURITÉ: Nettoyage complet des données utilisateur...');

  try {
    // 1️⃣ Déconnexion Supabase
    await supabase.auth.signOut();

    // 2️⃣ Vider LocalStorage (sauf les préférences système non-sensibles)
    const keysToPreserve = ['theme', 'language']; // Préférences UI uniquement
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (!keysToPreserve.includes(key)) {
        localStorage.removeItem(key);
      }
    });

    // 3️⃣ Vider SessionStorage (TOUT)
    sessionStorage.clear();

    // 4️⃣ Vider les cookies Supabase (via attributs sécurisés)
    document.cookie.split(';').forEach(c => {
      document.cookie = c
        .replace(/^ +/, '')
        .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
    });

    // 5️⃣ Invalider le cache du navigateur pour les requêtes API
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
    }

    // 6️⃣ Forcer un refresh complet de la page (invalide tous les états React)
    // Utiliser replace pour éviter le retour arrière
    window.location.replace('/login?cleared=true');
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
    // En cas d'erreur, rediriger quand même vers login par sécurité
    window.location.replace('/login?error=cleanup_failed');
  }
}

/**
 * 🔐 Vérification de Sécurité au Chargement
 *
 * Détecte les incohérences de session (cache corrompu, token expiré, etc.)
 */
export async function verifySessionIntegrity(): Promise<boolean> {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session) {
      console.warn('⚠️ Session invalide détectée, nettoyage préventif...');
      await clearAllUserData();
      return false;
    }

    // Vérifier que le user_id du token correspond au profil en cache
    const cachedUserId = localStorage.getItem('cached_user_id');
    if (cachedUserId && cachedUserId !== session.user.id) {
      console.error('🚨 ALERTE SÉCURITÉ: Mismatch user_id! Nettoyage forcé...');
      await clearAllUserData();
      return false;
    }

    // Stocker l'ID pour la prochaine vérification
    localStorage.setItem('cached_user_id', session.user.id);

    return true;
  } catch (error) {
    console.error('❌ Erreur vérification session:', error);
    return false;
  }
}

/**
 * 🔄 Hook de Nettoyage Automatique
 *
 * À appeler dans le composant racine pour écouter les événements de déconnexion
 */
export function setupSecurityListeners(): () => void {
  // Listener sur les changements d'auth Supabase
  const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT') {
      console.log('🔒 SIGNED_OUT détecté, nettoyage complet...');
      await clearAllUserData();
    }

    if (event === 'SIGNED_IN' && session) {
      console.log('🔐 SIGNED_IN détecté, vérification intégrité...');
      await verifySessionIntegrity();
    }
  });

  // Listener sur la fermeture de l'onglet/fenêtre
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    // Vérifier s'il y a une déconnexion en cours
    const isLoggingOut = sessionStorage.getItem('logging_out');
    if (isLoggingOut === 'true') {
      // Nettoyage synchrone rapide
      sessionStorage.clear();
      localStorage.removeItem('cached_user_id');
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);

  // Retourner une fonction de nettoyage
  return () => {
    authListener.subscription.unsubscribe();
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
}

/**
 * 🚪 Déconnexion Sécurisée
 *
 * Fonction principale à appeler pour déconnecter un utilisateur
 */
export async function secureLogout(): Promise<void> {
  // Marquer la déconnexion en cours
  sessionStorage.setItem('logging_out', 'true');

  console.log('🚪 Déconnexion sécurisée en cours...');

  // Nettoyage complet
  await clearAllUserData();
}
