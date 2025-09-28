import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Save, X } from 'lucide-react';

interface ProjectCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateProject: (projectData: {
    name: string;
    description: string;
    manager: string;
    status: 'en_cours' | 'a_venir' | 'termine';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    skills_required: string[];
    budget?: number;
  }) => void;
}

export const ProjectCreationDialog: React.FC<ProjectCreationDialogProps> = ({
  open,
  onOpenChange,
  onCreateProject
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [manager, setManager] = useState('Ahmed Waleh');
  const [status, setStatus] = useState<'en_cours' | 'a_venir' | 'termine'>('a_venir');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [budget, setBudget] = useState<number | undefined>();
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [loading, setLoading] = useState(false);

  const availableManagers = ['Ahmed Waleh', 'Sarah Martin', 'Jean Dupont', 'Marie Dubois'];
  const commonSkills = ['React', 'TypeScript', 'Node.js', 'Python', 'Design', 'Marketing', 'DevOps'];

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const handleSubmit = async () => {
    if (!name.trim() || !manager) {
      alert('Le nom et le manager sont obligatoires');
      return;
    }

    setLoading(true);
    try {
      await onCreateProject({
        name: name.trim(),
        description: description.trim(),
        manager,
        status,
        priority,
        skills_required: skills,
        budget
      });
      
      // Reset form
      setName('');
      setDescription('');
      setManager('Ahmed Waleh');
      setStatus('a_venir');
      setPriority('medium');
      setBudget(undefined);
      setSkills([]);
      
      onOpenChange(false);
    } catch (error) {
      alert('Erreur lors de la création du projet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Créer un Nouveau Projet
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nom du projet *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom du projet..."
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description du projet..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Manager *</Label>
              <Select value={manager} onValueChange={setManager}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableManagers.map((person) => (
                    <SelectItem key={person} value={person}>{person}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a_venir">À venir</SelectItem>
                  <SelectItem value="en_cours">En cours</SelectItem>
                  <SelectItem value="termine">Terminé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priorité</Label>
              <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">🟢 Faible</SelectItem>
                  <SelectItem value="medium">🟡 Moyenne</SelectItem>
                  <SelectItem value="high">🟠 Élevée</SelectItem>
                  <SelectItem value="urgent">🔴 Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Budget (€)</Label>
              <Input
                type="number"
                value={budget || ''}
                onChange={(e) => setBudget(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Budget estimé..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Compétences requises</Label>
            <div className="flex gap-2">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Ajouter une compétence..."
                onKeyPress={(e) => e.key === 'Enter' && addSkill()}
              />
              <Button type="button" onClick={addSkill} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-2">
              {commonSkills.map((skill) => (
                <Badge
                  key={skill}
                  variant={skills.includes(skill) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => {
                    if (skills.includes(skill)) {
                      removeSkill(skill);
                    } else {
                      setSkills([...skills, skill]);
                    }
                  }}
                >
                  {skill}
                </Badge>
              ))}
            </div>
            
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {skills.map((skill) => (
                  <Badge key={skill} className="cursor-pointer" onClick={() => removeSkill(skill)}>
                    {skill} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !name.trim() || !manager}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Création...' : 'Créer le Projet'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
