import { CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Target } from 'lucide-react';

interface TaskTableHeaderProps {
  newActionTitle: string;
  setNewActionTitle: (value: string) => void;
  onAddActionColumn: () => void;
  selectedTaskId?: string;
  isActionButtonEnabled: boolean;
}

export const TaskTableHeader = ({ 
  newActionTitle, 
  setNewActionTitle, 
  onAddActionColumn,
  selectedTaskId,
  isActionButtonEnabled
}: TaskTableHeaderProps) => (
  <CardHeader>
    <div className="flex justify-between items-center">
      <CardTitle className="flex items-center gap-2">
        <Target className="h-5 w-5" />
        Tableau Dynamique d'Exécution
      </CardTitle>
      <div className="flex gap-2">
        {selectedTaskId && (
          <div className="text-sm text-muted-foreground self-center">
            Tâche sélectionnée
          </div>
        )}
        <Input 
          placeholder="Nouvelle action..." 
          value={newActionTitle}
          onChange={(e) => setNewActionTitle(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && isActionButtonEnabled && onAddActionColumn()}
          className="w-40"
        />
        <Button 
          onClick={onAddActionColumn} 
          size="sm"
          disabled={!isActionButtonEnabled}
          title={!selectedTaskId ? "Sélectionnez d'abord une tâche" : !newActionTitle.trim() ? "Entrez un nom pour l'action" : ""}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  </CardHeader>
);