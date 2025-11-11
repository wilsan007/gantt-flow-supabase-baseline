/**
 * Composant: OneOffActivityDialog
 * Formulaire simplifié pour créer une activité ponctuelle
 * Une seule occurrence à une date précise
 */

import React, { useState } from 'react';
import { CalendarDays, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ActionTemplateList, type ActionTemplate } from './ActionTemplateList';
import { useOperationalActivities } from '@/hooks/useOperationalActivities';
import { supabase } from '@/integrations/supabase/client';

interface OneOffActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const OneOffActivityDialog: React.FC<OneOffActivityDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { createActivity } = useOperationalActivities({ autoFetch: false });

  // États du formulaire
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scope, setScope] = useState<'org' | 'department' | 'team' | 'person'>('org');
  const [dueDate, setDueDate] = useState<Date>(new Date());
  const [actionTemplates, setActionTemplates] = useState<ActionTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) {
      setError('Le nom est requis');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Créer l'activité
      const activityData = await createActivity({
        name: name.trim(),
        description: description.trim() || null,
        kind: 'one_off',
        scope,
        task_title_template: name.trim(),
        is_active: true,
      });

      if (!activityData) {
        throw new Error("Erreur lors de la création de l'activité");
      }

      // 2. Créer les templates d'actions si présents
      if (actionTemplates.length > 0) {
        const validTemplates = actionTemplates.filter(t => t.title.trim() !== '');

        for (const template of validTemplates) {
          await supabase.from('operational_action_templates').insert({
            activity_id: activityData.id,
            title: template.title,
            description: template.description || null,
            position: template.position,
          });
        }
      }

      // 3. Appeler la RPC pour générer la tâche immédiatement
      const { error: rpcError } = await supabase.rpc('instantiate_one_off_activity', {
        p_activity_id: activityData.id,
        p_due_date: format(dueDate, 'yyyy-MM-dd'),
        p_title_override: null, // Utiliser le template
      });

      if (rpcError) {
        throw rpcError;
      }

      // Succès !
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      console.error('❌ Erreur création activité ponctuelle:', err);
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setScope('org');
    setDueDate(new Date());
    setActionTemplates([]);
    setError(null);
  };

  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-purple-600" />
            Nouvelle Activité Ponctuelle
          </DialogTitle>
          <DialogDescription>
            Créez une activité unique à réaliser à une date précise. La tâche sera générée
            immédiatement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Nom */}
          <div className="space-y-2">
            <Label htmlFor="name">Nom de l'activité *</Label>
            <Input
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Audit de sécurité annuel"
              className={error && !name.trim() ? 'border-destructive' : ''}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Décrivez brièvement l'objectif de cette activité..."
              rows={3}
            />
          </div>

          {/* Scope et Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Portée</Label>
              <Select value={scope} onValueChange={(value: any) => setScope(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="org">Organisation</SelectItem>
                  <SelectItem value="department">Département</SelectItem>
                  <SelectItem value="team">Équipe</SelectItem>
                  <SelectItem value="person">Personne</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date d'échéance *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dueDate, 'PP', { locale: fr })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={date => date && setDueDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Actions Templates */}
          <div className="space-y-2">
            <Label>Actions à effectuer (optionnel)</Label>
            <p className="mb-3 text-sm text-muted-foreground">
              Définissez une checklist d'actions qui seront automatiquement ajoutées à la tâche
            </p>
            <ActionTemplateList templates={actionTemplates} onChange={setActionTemplates} />
          </div>

          {/* Erreur */}
          {error && (
            <div className="rounded border border-destructive bg-destructive/10 px-4 py-3 text-destructive">
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Info */}
          <div className="rounded border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-950">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              💡 <strong>Bon à savoir :</strong> Cette activité générera une tâche unique le{' '}
              <strong>{format(dueDate, 'dd MMMM yyyy', { locale: fr })}</strong>.
              {actionTemplates.filter(t => t.title.trim() !== '').length > 0 && (
                <>
                  {' '}
                  Elle contiendra {actionTemplates.filter(t => t.title.trim() !== '').length}{' '}
                  action(s) prédéfinie(s).
                </>
              )}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !name.trim()}>
            {loading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Création...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Créer et générer la tâche
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
