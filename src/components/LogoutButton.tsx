import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LogoutButtonProps {
  onSignOut: () => Promise<void>;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({ onSignOut }) => {
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await onSignOut();
      toast({
        title: "Déconnexion réussie",
        description: "Vous avez été déconnecté en toute sécurité",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la déconnexion",
        variant: "destructive"
      });
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleLogout}
      className="flex items-center gap-2"
    >
      <LogOut className="h-4 w-4" />
      Se déconnecter
    </Button>
  );
};
