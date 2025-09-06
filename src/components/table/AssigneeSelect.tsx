import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { UserPlus, Check } from 'lucide-react';
import { useProfiles } from '@/hooks/useProfiles';

interface AssigneeSelectProps {
  assignee: string;
  onChange: (value: string) => void;
  taskId: string;
}

export const AssigneeSelect = ({ assignee, onChange, taskId }: AssigneeSelectProps) => {
  const { profiles, loading } = useProfiles();
  const [isOpen, setIsOpen] = useState(false);
  const [newAssignee, setNewAssignee] = useState('');

  const handleProfileSelect = (profileName: string) => {
    onChange(profileName);
    setIsOpen(false);
  };

  const handleNewAssignee = () => {
    if (newAssignee.trim()) {
      onChange(newAssignee.trim());
      setNewAssignee('');
      setIsOpen(false);
    }
  };

  const currentAssignees = assignee.split(', ').filter(Boolean);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="w-full justify-start text-left font-normal">
          {assignee || 'Sélectionner...'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-background border" align="start">
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Responsables disponibles</h4>
            {loading ? (
              <div className="text-sm text-muted-foreground">Chargement...</div>
            ) : (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {profiles.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => handleProfileSelect(profile.full_name)}
                    className="w-full text-left px-2 py-1 hover:bg-accent rounded-sm text-sm flex items-center justify-between"
                  >
                    <span>{profile.full_name}</span>
                    {currentAssignees.includes(profile.full_name) && (
                      <Check className="h-4 w-4 text-success" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Ajouter nouveau responsable</h4>
            <div className="flex gap-2">
              <Input
                placeholder="Nom du responsable..."
                value={newAssignee}
                onChange={(e) => setNewAssignee(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleNewAssignee()}
              />
              <Button onClick={handleNewAssignee} size="sm">
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};