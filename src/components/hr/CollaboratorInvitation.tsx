import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  Send,
  UserPlus,
  Mail,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import {
  useCollaboratorInvitation,
  CollaboratorInvitationForm,
} from '@/hooks/useCollaboratorInvitation';
import { useMultiplePlaceholderHandler } from '@/hooks/usePlaceholderHandler';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * 🎯 Composant: CollaboratorInvitation
 * Pattern: Stripe, Notion, Linear - Interface d'invitation collaborateurs
 *
 * Fonctionnalités:
 * - Formulaire d'invitation avec validation
 * - Liste des invitations en attente
 * - Statistiques en temps réel
 * - Actions rapides (révocation)
 * - Design moderne et responsive
 */

// ============================================================================
// TYPES
// ============================================================================

interface AvailableRole {
  value: string;
  label: string;
  description: string;
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export const CollaboratorInvitation: React.FC = () => {
  // ============================================================================
  // STATE - RÔLES DISPONIBLES
  // ============================================================================
  const [availableRoles, setAvailableRoles] = useState<AvailableRole[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

  const { toast } = useToast();

  const {
    sendInvitation,
    revokeInvitation,
    refreshInvitations,
    pendingInvitations,
    stats,
    isLoading,
    isSending,
    error,
    canInvite,
  } = useCollaboratorInvitation();

  // État du formulaire
  const [form, setForm] = useState<CollaboratorInvitationForm>({
    email: '',
    fullName: '',
    roleToAssign: '',
    department: '',
    jobPosition: '',
  });

  // État pour gérer le rôle personnalisé
  const [showCustomRole, setShowCustomRole] = useState(false);
  const [customRole, setCustomRole] = useState('');

  // Gestion des placeholders
  const { handleFocus, getPlaceholder } = useMultiplePlaceholderHandler({
    email: 'collaborateur@exemple.com',
    fullName: 'Marie Dupont',
    department: 'Développement',
    jobPosition: 'Développeur Frontend',
  });

  // ============================================================================
  // CHARGEMENT DES RÔLES DISPONIBLES
  // ============================================================================

  useEffect(() => {
    const fetchAvailableRoles = async () => {
      try {
        setLoadingRoles(true);

        // Récupérer tous les rôles depuis la base de données
        const { data: roles, error } = await supabase
          .from('roles')
          .select('name, display_name, description')
          .order('hierarchy_level', { ascending: true });

        if (error) {
          console.error('Erreur chargement rôles:', error);
          return;
        }

        // Filtrer pour exclure super_admin et tenant_admin
        const filteredRoles = (roles || [])
          .filter(role => role.name !== 'super_admin' && role.name !== 'tenant_admin')
          .map(role => ({
            value: role.name,
            label: role.display_name || role.name,
            description: role.description || `Rôle ${role.display_name || role.name}`,
          }));

        setAvailableRoles(filteredRoles);

        console.log('✅ Rôles chargés:', filteredRoles.length, 'rôles disponibles');
      } catch (err) {
        console.error('Exception chargement rôles:', err);
      } finally {
        setLoadingRoles(false);
      }
    };

    fetchAvailableRoles();
  }, []);

  // Définir le premier rôle disponible comme valeur par défaut
  useEffect(() => {
    if (availableRoles.length > 0 && !form.roleToAssign) {
      setForm(prev => ({ ...prev, roleToAssign: availableRoles[0].value }));
    }
  }, [availableRoles]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleInputChange = (field: keyof CollaboratorInvitationForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleRoleChange = (value: string) => {
    if (value === 'autre') {
      setShowCustomRole(true);
      setForm(prev => ({ ...prev, roleToAssign: '' }));
    } else {
      setShowCustomRole(false);
      setCustomRole('');
      setForm(prev => ({ ...prev, roleToAssign: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation du rôle personnalisé
    if (showCustomRole && !customRole.trim()) {
      toast({
        title: '⚠️ Rôle manquant',
        description:
          'Veuillez spécifier le rôle personnalisé ou sélectionner un rôle dans la liste',
        variant: 'destructive',
      });
      return;
    }

    // Utiliser le rôle personnalisé si "Autre" est sélectionné
    const formToSubmit = {
      ...form,
      roleToAssign: showCustomRole ? customRole.trim() : form.roleToAssign,
    };

    const success = await sendInvitation(formToSubmit);

    if (success) {
      // Réinitialiser le formulaire avec le premier rôle disponible
      setForm({
        email: '',
        fullName: '',
        roleToAssign: availableRoles.length > 0 ? availableRoles[0].value : '',
        department: '',
        jobPosition: '',
      });
      setShowCustomRole(false);
      setCustomRole('');
    }
  };

  const handleRevoke = async (invitationId: string) => {
    if (confirm('Êtes-vous sûr de vouloir annuler cette invitation ?')) {
      await revokeInvitation(invitationId);
    }
  };

  // Format des dates (Pattern Notion)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Expirée';
    if (diffDays === 0) return "Expire aujourd'hui";
    if (diffDays === 1) return 'Expire demain';
    return `Expire dans ${diffDays} jours`;
  };

  // ============================================================================
  // PERMISSIONS INSUFFISANTES
  // ============================================================================

  if (!canInvite) {
    return (
      <Alert className="border-orange-200 bg-orange-50">
        <XCircle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          <strong>Permissions insuffisantes</strong>
          <br />
          Seuls les administrateurs, managers et responsables RH peuvent inviter des collaborateurs.
        </AlertDescription>
      </Alert>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* ============================================================================
          STATISTIQUES (Pattern Linear)
          ============================================================================ */}

      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">En attente</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500 opacity-75" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Acceptées</p>
                  <p className="text-2xl font-bold">{stats.accepted}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500 opacity-75" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Expirées</p>
                  <p className="text-2xl font-bold">{stats.expired}</p>
                </div>
                <XCircle className="h-8 w-8 text-gray-400 opacity-75" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500 opacity-75" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ============================================================================
          FORMULAIRE D'INVITATION (Pattern Stripe)
          ============================================================================ */}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Inviter un collaborateur
              </CardTitle>
              <CardDescription>Ajoutez un nouveau membre à votre équipe</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={refreshInvitations} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations principales */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={getPlaceholder('email', form.email)}
                    value={form.email}
                    onChange={e => handleInputChange('email', e.target.value)}
                    onFocus={() => handleFocus('email')}
                    disabled={isSending}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">
                  Nom complet <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder={getPlaceholder('fullName', form.fullName)}
                  value={form.fullName}
                  onChange={e => handleInputChange('fullName', e.target.value)}
                  onFocus={() => handleFocus('fullName')}
                  disabled={isSending}
                  required
                />
              </div>
            </div>

            {/* Rôle */}
            <div className="space-y-2">
              <Label htmlFor="role">
                Rôle <span className="text-red-500">*</span>
              </Label>
              <Select
                value={showCustomRole ? 'autre' : form.roleToAssign}
                onValueChange={handleRoleChange}
                disabled={isSending || loadingRoles}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={loadingRoles ? 'Chargement des rôles...' : 'Sélectionner un rôle'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {loadingRoles ? (
                    <SelectItem value="loading" disabled>
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Chargement...</span>
                      </div>
                    </SelectItem>
                  ) : availableRoles.length === 0 ? (
                    <SelectItem value="empty" disabled>
                      <span className="text-muted-foreground">Aucun rôle disponible</span>
                    </SelectItem>
                  ) : (
                    <>
                      {availableRoles.map(role => (
                        <SelectItem key={role.value} value={role.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{role.label}</span>
                            <span className="text-muted-foreground text-xs">
                              {role.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                      {/* Option "Autre" */}
                      <SelectItem value="autre">
                        <div className="flex flex-col">
                          <span className="font-medium">✏️ Autre</span>
                          <span className="text-muted-foreground text-xs">
                            Spécifier un rôle personnalisé
                          </span>
                        </div>
                      </SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Champ rôle personnalisé (conditionnel) */}
            {showCustomRole && (
              <div className="space-y-2">
                <Label htmlFor="customRole">
                  Rôle personnalisé <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="customRole"
                  type="text"
                  placeholder="Ex: Consultant, Stagiaire, Freelance..."
                  value={customRole}
                  onChange={e => setCustomRole(e.target.value)}
                  disabled={isSending}
                  required
                  className="border-primary"
                />
                <p className="text-muted-foreground text-xs">
                  💡 Ce rôle personnalisé sera créé pour ce collaborateur
                </p>
              </div>
            )}

            {/* Informations optionnelles */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="department">Département (optionnel)</Label>
                <Input
                  id="department"
                  type="text"
                  placeholder={getPlaceholder('department', form.department || '')}
                  value={form.department}
                  onChange={e => handleInputChange('department', e.target.value)}
                  onFocus={() => handleFocus('department')}
                  disabled={isSending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobPosition">Poste (optionnel)</Label>
                <Input
                  id="jobPosition"
                  type="text"
                  placeholder={getPlaceholder('jobPosition', form.jobPosition || '')}
                  value={form.jobPosition}
                  onChange={e => handleInputChange('jobPosition', e.target.value)}
                  onFocus={() => handleFocus('jobPosition')}
                  disabled={isSending}
                />
              </div>
            </div>

            {/* Erreur */}
            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Bouton d'envoi */}
            <Button
              type="submit"
              disabled={isSending || !form.email.trim() || !form.fullName.trim()}
              className="w-full md:w-auto"
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Envoyer l'invitation
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ============================================================================
          INVITATIONS EN ATTENTE (Pattern Notion)
          ============================================================================ */}

      {pendingInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Invitations en attente ({pendingInvitations.length})</CardTitle>
            <CardDescription>
              Les invitations expirent automatiquement après 7 jours
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-3">
              {pendingInvitations.map(invitation => (
                <div
                  key={invitation.id}
                  className="hover:bg-accent/50 flex items-center justify-between rounded-lg border p-4 transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{invitation.full_name}</p>
                      <Badge variant="outline" className="text-xs">
                        {availableRoles.find(r => r.value === invitation.role_to_assign)?.label ||
                          invitation.role_to_assign}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm">{invitation.email}</p>
                    {(invitation.department || invitation.job_position) && (
                      <p className="text-muted-foreground text-xs">
                        {[invitation.department, invitation.job_position]
                          .filter(Boolean)
                          .join(' • ')}
                      </p>
                    )}
                    <p className="text-xs font-medium text-orange-600">
                      {formatDate(invitation.expires_at)}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRevoke(invitation.id)}
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============================================================================
          INFORMATIONS (Pattern Linear)
          ============================================================================ */}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">ℹ️ Comment ça marche ?</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2 text-sm">
          <p>• Le collaborateur reçoit un email avec un lien d'invitation</p>
          <p>• Il crée son compte en utilisant le mot de passe temporaire fourni</p>
          <p>• Il est automatiquement ajouté à votre entreprise avec le rôle spécifié</p>
          <p>• Les invitations expirent après 7 jours pour des raisons de sécurité</p>
          <p>• Vous pouvez annuler une invitation en attente à tout moment</p>
        </CardContent>
      </Card>
    </div>
  );
};
