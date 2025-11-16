/**
 * 🎯 Édition Inline de la Priorité
 * Pattern: Linear / Asana
 */

import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface EditableTaskPriorityProps {
  value: string;
  onChange: (value: string) => Promise<void>;
  readOnly?: boolean;
}

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Basse', color: 'bg-gray-100 text-gray-800' },
  { value: 'medium', label: 'Moyenne', color: 'bg-blue-100 text-blue-800' },
  { value: 'high', label: 'Haute', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgent', label: 'Urgente', color: 'bg-red-100 text-red-800' },
];

export const EditableTaskPriority = ({
  value,
  onChange,
  readOnly = false,
}: EditableTaskPriorityProps) => {
  const currentPriority =
    PRIORITY_OPTIONS.find(p => p.value === value?.toLowerCase()) || PRIORITY_OPTIONS[1];

  if (readOnly) {
    return <Badge className={currentPriority.color}>{currentPriority.label}</Badge>;
  }

  return (
    <Select value={value?.toLowerCase() || 'medium'} onValueChange={newValue => onChange(newValue)}>
      <SelectTrigger className="h-auto w-auto border-0 px-2 py-1 hover:bg-accent">
        <Badge className={currentPriority.color}>{currentPriority.label}</Badge>
      </SelectTrigger>
      <SelectContent>
        {PRIORITY_OPTIONS.map(priority => (
          <SelectItem key={priority.value} value={priority.value}>
            <Badge className={priority.color}>{priority.label}</Badge>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
