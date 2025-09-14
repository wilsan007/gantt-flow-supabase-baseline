import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Settings } from 'lucide-react';
import { RoleManagementDialog } from './RoleManagementDialog';
import { useRoleManagement } from '@/hooks/useRoleManagement';

export const RoleManagementButton: React.FC = () => {
  const [showRoleManagement, setShowRoleManagement] = useState(false);
  const { userRoles } = useRoleManagement();

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="relative"
        onClick={() => setShowRoleManagement(true)}
      >
        <Shield className="h-4 w-4 mr-2" />
        Rôles & Permissions
        {userRoles.length > 0 && (
          <Badge 
            variant="secondary" 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            {userRoles.length}
          </Badge>
        )}
      </Button>

      <RoleManagementDialog
        open={showRoleManagement}
        onOpenChange={setShowRoleManagement}
      />
    </>
  );
};