import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * 🎯 Hook: useCollaboratorInvitation
 * Pattern: Stripe, Notion, Linear - Gestion invitations collaborateurs
 *
 * Fonctionnalités:
 * - Envoi invitations avec validation
 * - Liste invitations en attente
 * - Révocation invitations
 * - Statistiques et métriques
 * - Cache intelligent (Pattern Stripe)
 */

// ============================================================================
// TYPES
// ============================================================================

export interface CollaboratorInvitationForm {
  email: string;
  fullName: string;
  roleToAssign: string;
  department?: string;
  jobPosition?: string;
}

export interface PendingInvitation {
  id: string;
  email: string;
  full_name: string;
  role_to_assign: string;
  department?: string;
  job_position?: string;
  created_at: string;
  expires_at: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
}

export interface InvitationStats {
  total: number;
  pending: number;
  accepted: number;
  expired: number;
  cancelled: number;
}

interface UseCollaboratorInvitationReturn {
  // Actions principales
  sendInvitation: (form: CollaboratorInvitationForm) => Promise<boolean>;
  revokeInvitation: (invitationId: string) => Promise<boolean>;
  refreshInvitations: () => Promise<void>;

  // Données
  pendingInvitations: PendingInvitation[];
  stats: InvitationStats | null;

  // États
  isLoading: boolean;
  isSending: boolean;
  error: string | null;

  // Utilitaires
  canInvite: boolean;
  remainingSlots: number | null;
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export const useCollaboratorInvitation = (): UseCollaboratorInvitationReturn => {
  const { toast } = useToast();

  // États
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [stats, setStats] = useState<InvitationStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canInvite, setCanInvite] = useState(false);
  const [remainingSlots, setRemainingSlots] = useState<number | null>(null);

  // ============================================================================
  // VÉRIFICATION PERMISSIONS
  // ============================================================================

  const checkPermissions = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setCanInvite(false);
        return;
      }

      // Vérifier via requête directe sur user_roles
      const { data, error } = await supabase
        .from('user_roles')
        .select('roles!inner(name)')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Erreur vérification permissions:', error);
        setCanInvite(false);
        return;
      }

      // Vérifier si le rôle permet d'inviter
      const allowedRoles = ['tenant_admin', 'manager', 'hr_manager', 'super_admin'];
      const hasPermission = data?.roles?.name && allowedRoles.includes(data.roles.name);
      setCanInvite(hasPermission || false);
    } catch (err) {
      console.error('Exception vérification permissions:', err);
      setCanInvite(false);
    }
  }, []);

  // ============================================================================
  // CHARGEMENT INVITATIONS EN ATTENTE
  // ============================================================================

  const loadPendingInvitations = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Récupérer le tenant_id de l'utilisateur
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('tenant_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .not('tenant_id', 'is', null)
        .single();

      const tenantId = userRole?.tenant_id;

      if (!tenantId) return;

      // Récupérer les invitations en attente
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('invitation_type', 'collaborator')
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur chargement invitations:', error);
        setError(error.message);
        return;
      }

      // Mapper les données avec les champs attendus
      // Note: Les colonnes role_to_assign, department, job_position sont disponibles après la migration SQL
      const invitations: PendingInvitation[] = ((data as any) || []).map((inv: any) => ({
        id: inv.id,
        email: inv.email,
        full_name: inv.full_name,
        role_to_assign: inv.role_to_assign || 'employee',
        department: inv.department,
        job_position: inv.job_position,
        created_at: inv.created_at,
        expires_at: inv.expires_at,
        status: inv.status,
      }));

      setPendingInvitations(invitations);
    } catch (err: any) {
      console.error('Exception chargement invitations:', err);
      setError(err.message);
    }
  }, []);

  // ============================================================================
  // CHARGEMENT STATISTIQUES
  // ============================================================================

  const loadStats = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userRole } = await supabase
        .from('user_roles')
        .select('tenant_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .not('tenant_id', 'is', null)
        .single();

      const tenantId = userRole?.tenant_id;

      if (!tenantId) return;

      // Compter par statut
      const { data, error } = await supabase
        .from('invitations')
        .select('status')
        .eq('tenant_id', tenantId)
        .eq('invitation_type', 'collaborator');

      if (error) {
        console.error('Erreur chargement stats:', error);
        return;
      }

      const stats: InvitationStats = {
        total: data.length,
        pending: data.filter(i => i.status === 'pending').length,
        accepted: data.filter(i => i.status === 'accepted').length,
        expired: data.filter(i => i.status === 'expired').length,
        cancelled: data.filter(i => i.status === 'cancelled').length,
      };

      setStats(stats);
    } catch (err) {
      console.error('Exception chargement stats:', err);
    }
  }, []);

  // ============================================================================
  // REFRESH COMPLET
  // ============================================================================

  const refreshInvitations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await Promise.all([checkPermissions(), loadPendingInvitations(), loadStats()]);
    } finally {
      setIsLoading(false);
    }
  }, [checkPermissions, loadPendingInvitations, loadStats]);

  // ============================================================================
  // ENVOI INVITATION (Pattern Stripe: Validation + Feedback)
  // ============================================================================

  const sendInvitation = useCallback(
    async (form: CollaboratorInvitationForm): Promise<boolean> => {
      if (!canInvite) {
        toast({
          title: '🔒 Permissions insuffisantes',
          description: "Vous n'avez pas les permissions pour inviter des collaborateurs",
          variant: 'destructive',
        });
        return false;
      }

      // Validation locale
      if (!form.email || !form.fullName || !form.roleToAssign) {
        toast({
          title: '❌ Données incomplètes',
          description: 'Email, nom complet et rôle sont requis',
          variant: 'destructive',
        });
        return false;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        toast({
          title: '❌ Email invalide',
          description: 'Veuillez saisir une adresse email valide',
          variant: 'destructive',
        });
        return false;
      }

      setIsSending(true);
      setError(null);

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error('Session non trouvée');
        }

        // Appeler la Edge Function
        const supabaseUrl =
          import.meta.env.VITE_SUPABASE_URL || 'https://qliinxtanjdnwxlvnxji.supabase.co';
        const response = await fetch(`${supabaseUrl}/functions/v1/send-collaborator-invitation`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: form.email.toLowerCase().trim(),
            fullName: form.fullName.trim(),
            roleToAssign: form.roleToAssign,
            department: form.department?.trim() || null,
            jobPosition: form.jobPosition?.trim() || null,
            siteUrl: window.location.origin,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          // Créer une erreur enrichie avec les détails du backend
          const error: any = new Error(result.error || "Erreur lors de l'envoi de l'invitation");
          error.errorCode = result.errorCode;
          error.suggestion = result.suggestion;
          error.technicalDetails = result.technicalDetails;
          throw error;
        }

        // Succès - Pattern Notion: Feedback positif immédiat
        toast({
          title: '✅ Invitation envoyée !',
          description: `${form.fullName} recevra un email à ${form.email}`,
          variant: 'default',
        });

        // Rafraîchir les données
        await refreshInvitations();

        return true;
      } catch (err: any) {
        console.error('Erreur envoi invitation:', err);

        // Pattern Linear + Stripe: Messages d'erreur contextuels basés sur errorCode
        let errorTitle = "❌ Erreur d'invitation";
        let errorMessage = err.message || 'Une erreur est survenue';
        let errorDescription = err.suggestion || '';

        // Utiliser errorCode si disponible (depuis le backend)
        if (err.errorCode) {
          switch (err.errorCode) {
            case 'EMAIL_ALREADY_EXISTS':
            case 'EMAIL_ALREADY_IN_TENANT':
              errorTitle = '📧 Email déjà utilisé';
              break;
            case 'INSUFFICIENT_PERMISSIONS':
              errorTitle = '🔒 Permissions insuffisantes';
              break;
            case 'UNAUTHORIZED':
            case 'SESSION_EXPIRED':
              errorTitle = '🔐 Session expirée';
              break;
            case 'NO_TENANT_FOUND':
              errorTitle = '🏢 Compte incomplet';
              break;
            case 'MISSING_REQUIRED_FIELDS':
              errorTitle = '📝 Informations manquantes';
              break;
            case 'RATE_LIMIT_EXCEEDED':
              errorTitle = '⏱️ Limite atteinte';
              break;
            default:
              errorTitle = '❌ Erreur';
          }
        }

        // Afficher le message d'erreur avec suggestion si disponible
        const toastDescription = errorDescription
          ? `${errorMessage}\n\n💡 ${errorDescription}`
          : errorMessage;

        toast({
          title: errorTitle,
          description: toastDescription,
          variant: 'destructive',
          duration: 7000, // Plus long pour lire la suggestion
        });

        setError(errorMessage);
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [canInvite, toast, refreshInvitations]
  );

  // ============================================================================
  // RÉVOCATION INVITATION (Pattern Stripe: Confirmation + Optimistic Update)
  // ============================================================================

  const revokeInvitation = useCallback(
    async (invitationId: string): Promise<boolean> => {
      try {
        // Optimistic update
        const previousInvitations = [...pendingInvitations];
        setPendingInvitations(prev => prev.filter(i => i.id !== invitationId));

        const { error } = await supabase
          .from('invitations')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('id', invitationId);

        if (error) {
          // Rollback on error
          setPendingInvitations(previousInvitations);
          throw error;
        }

        toast({
          title: '✅ Invitation révoquée',
          description: "L'invitation a été annulée avec succès",
          variant: 'default',
        });

        await loadStats();
        return true;
      } catch (err: any) {
        console.error('Erreur révocation invitation:', err);

        toast({
          title: '❌ Erreur',
          description: "Impossible d'annuler l'invitation",
          variant: 'destructive',
        });

        return false;
      }
    },
    [pendingInvitations, toast, loadStats]
  );

  // ============================================================================
  // CHARGEMENT INITIAL
  // ============================================================================

  useEffect(() => {
    refreshInvitations();
  }, [refreshInvitations]);

  // ============================================================================
  // NETTOYAGE AUTOMATIQUE DES INVITATIONS EXPIRÉES (Pattern Stripe)
  // ============================================================================

  useEffect(() => {
    const cleanupExpired = () => {
      setPendingInvitations(prev => prev.filter(inv => new Date(inv.expires_at) > new Date()));
    };

    // Vérifier toutes les minutes
    const interval = setInterval(cleanupExpired, 60000);

    return () => clearInterval(interval);
  }, []);

  // ============================================================================
  // RETOUR API
  // ============================================================================

  return {
    // Actions
    sendInvitation,
    revokeInvitation,
    refreshInvitations,

    // Données
    pendingInvitations,
    stats,

    // États
    isLoading,
    isSending,
    error,

    // Utilitaires
    canInvite,
    remainingSlots,
  };
};
