import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Edit } from 'lucide-react';
import { useProfiles } from '@/hooks/useProfiles';

interface AssigneeSelectProps {
  currentAssignee: string;
  taskId: string;
  onUpdateAssignee: (taskId: string, assignee: string) => void;
}

export const AssigneeSelect = ({ currentAssignee, taskId, onUpdateAssignee }: AssigneeSelectProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const { profiles, loading } = useProfiles();

  const handleAssigneeChange = (newAssignee: string) => {
    onUpdateAssignee(taskId, newAssignee);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Select onValueChange={handleAssigneeChange} defaultValue={currentAssignee}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sélectionner..." />
          </SelectTrigger>
          <SelectContent>
            {loading ? (
              <SelectItem value="loading" disabled>Chargement...</SelectItem>
            ) : (
              profiles.map((profile) => (
                <SelectItem key={profile.id} value={profile.full_name}>
                  {profile.full_name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsEditing(false)}
        >
          Annuler
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <User className="h-4 w-4 text-muted-foreground" />
      <span>{currentAssignee}</span>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setIsEditing(true)}
        className="h-6 w-6 p-0"
      >
        <Edit className="h-3 w-3" />
      </Button>
    </div>
  );
};