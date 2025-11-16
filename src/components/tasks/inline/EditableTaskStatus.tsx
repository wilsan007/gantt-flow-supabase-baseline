/**
 * 🎯 Édition Inline du Statut
 * Pattern: Jira / ClickUp
 */

import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Clock, AlertCircle, CheckCircle2 } from '@/lib/icons';
import { Ban } from 'lucide-react';

interface EditableTaskStatusProps {
  value: string;
  onChange: (value: string) => Promise<void>;
  readOnly?: boolean;
}

const STATUS_OPTIONS = [
  { value: 'todo', label: 'À faire', color: 'bg-gray-100 text-gray-800', icon: Clock },
  { value: 'doing', label: 'En cours', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
  { value: 'blocked', label: 'Bloqué', color: 'bg-red-100 text-red-800', icon: Ban },
  { value: 'done', label: 'Terminé', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
];

export const EditableTaskStatus = ({
  value,
  onChange,
  readOnly = false,
}: EditableTaskStatusProps) => {
  const currentStatus =
    STATUS_OPTIONS.find(s => s.value === value?.toLowerCase()) || STATUS_OPTIONS[0];
  const StatusIcon = currentStatus.icon;

  if (readOnly) {
    return (
      <Badge className={currentStatus.color}>
        <StatusIcon className="mr-1 h-3 w-3" />
        {currentStatus.label}
      </Badge>
    );
  }

  return (
    <Select value={value?.toLowerCase() || 'todo'} onValueChange={newValue => onChange(newValue)}>
      <SelectTrigger className="h-auto w-auto border-0 px-2 py-1 hover:bg-accent">
        <Badge className={currentStatus.color}>
          <StatusIcon className="mr-1 h-3 w-3" />
          {currentStatus.label}
        </Badge>
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map(status => {
          const Icon = status.icon;
          return (
            <SelectItem key={status.value} value={status.value}>
              <Badge className={status.color}>
                <Icon className="mr-1 h-3 w-3" />
                {status.label}
              </Badge>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};
