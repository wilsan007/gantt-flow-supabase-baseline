/**
 * UserMenu - Menu Utilisateur Complet
 * Pattern: ClickUp, Notion, Linear
 *
 * Fonctionnalités:
 * - Profil utilisateur avec statut
 * - Actions rapides personnalisées
 * - Gestion entreprise (tenant_admin)
 * - Paramètres et déconnexion
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Settings,
  LogOut,
  Bell,
  BellOff,
  Palette,
  KeyRound,
  Building2,
  Upload,
  Globe,
  Clock,
  FileText,
  Users,
  BarChart3,
  Zap,
  ChevronRight,
  CheckCircle2,
  Circle,
  Coffee,
  Calendar,
  ListTodo,
  Trash2,
  HelpCircle,
  Receipt,
  AlertCircle,
  Home,
  BookOpen,
  Award,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UserMenuProps {
  user: {
    id: string;
    email?: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
    };
  };
  isTenantAdmin?: boolean;
  tenantName?: string;
  onSignOut?: () => Promise<void>;
}

type UserStatus = 'online' | 'away' | 'busy' | 'offline';

export const UserMenu: React.FC<UserMenuProps> = ({
  user,
  isTenantAdmin = false,
  tenantName,
  onSignOut,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userStatus, setUserStatus] = useState<UserStatus>('online');

  const fullName = user.user_metadata?.full_name || 'Utilisateur';
  const email = user.email || '';
  const avatarUrl = user.user_metadata?.avatar_url;
  const initials = fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const statusConfig: Record<UserStatus, { label: string; icon: React.ReactNode; color: string }> =
    {
      online: {
        label: 'En ligne',
        icon: <CheckCircle2 className="h-4 w-4" />,
        color: 'bg-green-500',
      },
      away: { label: 'Absent', icon: <Clock className="h-4 w-4" />, color: 'bg-yellow-500' },
      busy: { label: 'Occupé', icon: <Coffee className="h-4 w-4" />, color: 'bg-red-500' },
      offline: { label: 'Hors ligne', icon: <Circle className="h-4 w-4" />, color: 'bg-gray-400' },
    };

  const handleStatusChange = (status: UserStatus) => {
    setUserStatus(status);
    toast({
      title: 'Statut mis à jour',
      description: `Votre statut est maintenant : ${statusConfig[status].label}`,
    });
  };

  const handleChangePassword = () => {
    navigate('/settings?tab=security');
    toast({
      title: 'Modification du mot de passe',
      description: 'Accédez aux paramètres de sécurité',
    });
  };

  const handleCompanySettings = () => {
    navigate('/settings?tab=company');
    toast({
      title: 'Paramètres entreprise',
      description: 'Gérez les informations de votre entreprise',
    });
  };

  const handleNotificationSettings = () => {
    navigate('/settings?tab=notifications');
  };

  const handleSignOut = async () => {
    if (onSignOut) {
      await onSignOut();
    } else {
      await supabase.auth.signOut();
      navigate('/auth');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-accent">
          <div className="relative">
            <Avatar className="h-8 w-8">
              <AvatarImage src={avatarUrl} alt={fullName} />
              <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            {/* Indicateur de statut */}
            <div
              className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background ${statusConfig[userStatus].color}`}
            />
          </div>
          <div className="hidden text-left md:block">
            <p className="text-sm font-medium leading-none">{fullName}</p>
            <p className="text-xs text-muted-foreground">{statusConfig[userStatus].label}</p>
          </div>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-72" align="end">
        {/* En-tête utilisateur */}
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center gap-3 py-2">
            <Avatar className="h-12 w-12">
              <AvatarImage src={avatarUrl} alt={fullName} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-semibold leading-none">{fullName}</p>
              <p className="text-xs text-muted-foreground">{email}</p>
              {isTenantAdmin && tenantName && (
                <Badge variant="secondary" className="w-fit text-xs">
                  Admin · {tenantName}
                </Badge>
              )}
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Choisir un statut */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <div className="flex items-center gap-2">
              {statusConfig[userStatus].icon}
              <span>Choisir un statut</span>
            </div>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {(Object.keys(statusConfig) as UserStatus[]).map(status => (
              <DropdownMenuItem
                key={status}
                onClick={() => handleStatusChange(status)}
                className="gap-2"
              >
                {statusConfig[status].icon}
                <span>{statusConfig[status].label}</span>
                {userStatus === status && <CheckCircle2 className="ml-auto h-4 w-4" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Désactiver les notifications */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <BellOff className="mr-2 h-4 w-4" />
            <span>Désactiver les notifications</span>
            <ChevronRight className="ml-auto h-4 w-4" />
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={handleNotificationSettings}>
              <Clock className="mr-2 h-4 w-4" />
              <span>30 minutes</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleNotificationSettings}>
              <Clock className="mr-2 h-4 w-4" />
              <span>1 heure</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleNotificationSettings}>
              <Clock className="mr-2 h-4 w-4" />
              <span>2 heures</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleNotificationSettings}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Gérer les notifications</span>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        {/* Actions utilisateur */}
        <DropdownMenuItem onClick={() => navigate('/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Paramètres</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleChangePassword}>
          <KeyRound className="mr-2 h-4 w-4" />
          <span>Modifier le mot de passe</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate('/settings?tab=appearance')}>
          <Palette className="mr-2 h-4 w-4" />
          <span>Thèmes</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate('/settings?tab=language')}>
          <Globe className="mr-2 h-4 w-4" />
          <span>Langue</span>
        </DropdownMenuItem>

        {/* Actions admin entreprise */}
        {isTenantAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Gestion Entreprise
            </DropdownMenuLabel>

            <DropdownMenuItem onClick={handleCompanySettings}>
              <Building2 className="mr-2 h-4 w-4" />
              <span>Modifier nom de l'entreprise</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => navigate('/settings?tab=company&section=logo')}>
              <Upload className="mr-2 h-4 w-4" />
              <span>Modifier le logo</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => navigate('/settings?tab=company&section=branding')}>
              <Palette className="mr-2 h-4 w-4" />
              <span>Personnaliser les couleurs</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => navigate('/settings?tab=team')}>
              <Users className="mr-2 h-4 w-4" />
              <span>Gérer l'équipe</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => navigate('/approvals')}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              <span>Approbations</span>
              <Zap className="ml-auto h-3 w-3 text-orange-500" />
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />

        {/* Outils personnels */}
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Outils personnels
        </DropdownMenuLabel>

        <DropdownMenuItem onClick={() => navigate('/tasks')}>
          <ListTodo className="mr-2 h-4 w-4" />
          <span>Mon travail</span>
          <Zap className="ml-auto h-3 w-3 text-yellow-500" />
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => {
            navigate('/tasks');
            // Ouvrir le tab calendar après navigation
            setTimeout(() => {
              const calendarTab = document.querySelector('[value="calendar"]') as HTMLElement;
              calendarTab?.click();
            }, 100);
          }}
        >
          <Calendar className="mr-2 h-4 w-4" />
          <span>Mon calendrier</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate('/my-timesheets')}>
          <Clock className="mr-2 h-4 w-4" />
          <span>Mes Timesheets</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate('/my-expenses')}>
          <Receipt className="mr-2 h-4 w-4" />
          <span>Mes Notes de Frais</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate('/my-absences')}>
          <AlertCircle className="mr-2 h-4 w-4" />
          <span>Mes Justificatifs</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate('/my-remote-work')}>
          <Home className="mr-2 h-4 w-4" />
          <span>Télétravail</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate('/my-admin-requests')}>
          <FileText className="mr-2 h-4 w-4" />
          <span>Demandes Admin</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => navigate('/my-skills')}>
          <Award className="mr-2 h-4 w-4" />
          <span>Mes Compétences</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate('/training-catalog')}>
          <BookOpen className="mr-2 h-4 w-4" />
          <span>Catalogue Formations</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate('/my-trainings')}>
          <BookOpen className="mr-2 h-4 w-4" />
          <span>Mes Formations</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => navigate('/notes')}>
          <FileText className="mr-2 h-4 w-4" />
          <span>Bloc-notes</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate('/analytics')}>
          <BarChart3 className="mr-2 h-4 w-4" />
          <span>Mes statistiques</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Aide et déconnexion */}
        <DropdownMenuItem onClick={() => navigate('/help')}>
          <HelpCircle className="mr-2 h-4 w-4" />
          <span>Aide</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleSignOut}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Se déconnecter</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
