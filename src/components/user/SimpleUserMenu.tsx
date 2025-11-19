/**
 * SimpleUserMenu - Menu Utilisateur Simplifié
 * Accessible à TOUS les utilisateurs avec options conditionnelles selon rôle
 *
 * Pour TOUS:
 * - Modifier mot de passe
 * - Déconnexion
 *
 * Pour TENANT_ADMIN:
 * - Modifier nom entreprise
 * - Modifier logo entreprise
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, KeyRound, Building2, Upload } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ChangePasswordDialog } from './ChangePasswordDialog';
import { ChangeCompanyNameDialog } from './ChangeCompanyNameDialog';
import { ChangeLogoDialog } from './ChangeLogoDialog';

interface SimpleUserMenuProps {
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

export const SimpleUserMenu: React.FC<SimpleUserMenuProps> = ({
  user,
  isTenantAdmin = false,
  tenantName,
  onSignOut,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // États des modals
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [companyNameDialogOpen, setCompanyNameDialogOpen] = useState(false);
  const [logoDialogOpen, setLogoDialogOpen] = useState(false);

  const fullName = user.user_metadata?.full_name || 'Utilisateur';
  const email = user.email || '';
  const avatarUrl = user.user_metadata?.avatar_url;
  const initials = fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleChangePassword = () => {
    setPasswordDialogOpen(true);
  };

  const handleChangeCompanyName = () => {
    setCompanyNameDialogOpen(true);
  };

  const handleChangeLogo = () => {
    setLogoDialogOpen(true);
  };

  const handleSignOut = async () => {
    if (onSignOut) {
      await onSignOut();
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="ring-primary/20 hover:ring-primary/40 relative h-10 w-10 rounded-full ring-2 transition-all duration-300"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={avatarUrl}
                alt={fullName}
                referrerPolicy="no-referrer"
                loading="lazy"
              />
              <AvatarFallback className="from-primary to-accent text-primary-foreground bg-gradient-to-br font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="max-h-[85vh] w-64" align="end">
          <ScrollArea className="max-h-[calc(85vh-4rem)]">
            {/* En-tête utilisateur */}
            <DropdownMenuLabel className="font-normal">
              <div className="flex items-center gap-3 py-2">
                <Avatar className="h-12 w-12">
                  <AvatarImage
                    src={avatarUrl}
                    alt={fullName}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                  <AvatarFallback className="from-primary to-accent text-primary-foreground bg-gradient-to-br">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm leading-none font-semibold">{fullName}</p>
                  <p className="text-muted-foreground text-xs">{email}</p>
                  {isTenantAdmin && tenantName && (
                    <Badge variant="secondary" className="w-fit text-xs">
                      Admin · {tenantName}
                    </Badge>
                  )}
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            {/* 🔑 Modifier le mot de passe - TOUS LES UTILISATEURS */}
            <DropdownMenuItem onClick={handleChangePassword}>
              <KeyRound className="mr-2 h-4 w-4" />
              <span>Modifier le mot de passe</span>
            </DropdownMenuItem>

            {/* 🏢 Options Tenant Admin */}
            {isTenantAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-muted-foreground text-xs">
                  Gestion Entreprise
                </DropdownMenuLabel>

                <DropdownMenuItem onClick={handleChangeCompanyName}>
                  <Building2 className="mr-2 h-4 w-4" />
                  <span>Modifier nom de l'entreprise</span>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handleChangeLogo}>
                  <Upload className="mr-2 h-4 w-4" />
                  <span>Modifier le logo</span>
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuSeparator />

            {/* 🚪 Déconnexion */}
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Se déconnecter</span>
            </DropdownMenuItem>
          </ScrollArea>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modals */}
      <ChangePasswordDialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen} />

      {isTenantAdmin && (
        <>
          <ChangeCompanyNameDialog
            open={companyNameDialogOpen}
            onOpenChange={setCompanyNameDialogOpen}
            currentName={tenantName}
          />

          <ChangeLogoDialog open={logoDialogOpen} onOpenChange={setLogoDialogOpen} />
        </>
      )}
    </>
  );
};
