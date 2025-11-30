import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useOnboardingOffboarding } from '@/hooks/useOnboardingOffboarding';
import { useExpenseManagement } from '@/hooks/useExpenseManagement';
import { usePayrollManagement } from '@/hooks/usePayrollManagement';
import { useSkillsTraining } from '@/hooks/useSkillsTraining';
import { useHealthSafety } from '@/hooks/useHealthSafety';
import { usePerformance } from '@/hooks/usePerformance';
import { useUserAuth } from '@/hooks/useUserAuth';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Upload, Lock, FileSpreadsheet } from 'lucide-react';
import { CurrencySelect } from '@/components/common/CurrencySelect';

// === ONBOARDING DIALOG ===
export const CreateOnboardingDialog = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const { createOnboardingProcess } = useOnboardingOffboarding();
  // We would ideally use useEmployees here, but let's keep it simple for now or import it if needed.
  // Assuming the user wants to enter data manually or select from a list.
  // Let's add the fields from the JSON: employee_name, position, department, start_date.

  const [formData, setFormData] = useState({
    employee_name: '',
    employee_id: '',
    position: '',
    department: '',
    start_date: new Date().toISOString().split('T')[0],
    status: 'pending' as const, // Default from JSON example
    progress: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createOnboardingProcess(formData);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="glass-panel sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nouveau processus d'onboarding</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employee_name">Nom de l'employé</Label>
            <Input
              id="employee_name"
              value={formData.employee_name}
              onChange={e => setFormData({ ...formData, employee_name: e.target.value })}
              placeholder="Ex: Jean Martin"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="position">Poste</Label>
            <Input
              id="position"
              value={formData.position}
              onChange={e => setFormData({ ...formData, position: e.target.value })}
              placeholder="Ex: Chef de projet"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">Département</Label>
            <Select
              value={formData.department}
              onValueChange={val => setFormData({ ...formData, department: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Operations">Opérations</SelectItem>
                <SelectItem value="IT">IT</SelectItem>
                <SelectItem value="RH">Ressources Humaines</SelectItem>
                <SelectItem value="Sales">Commercial</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="start_date">Date de début</Label>
            <Input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={e => setFormData({ ...formData, start_date: e.target.value })}
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit">Créer le processus</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// === EXPENSE DIALOG ===
export const CreateExpenseReportDialog = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const { createExpenseReport } = useExpenseManagement();
  const { profile } = useUserAuth();
  const [formData, setFormData] = useState({
    title: '', // Maps to description in JSON example
    expense_date: new Date().toISOString().split('T')[0],
    category_name: '',
    amount: '', // String to handle decimals better in input
    currency: 'DJF',
    status: 'draft' as const,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Adapt to hook expectation
    await createExpenseReport({
      title: formData.title,
      total_amount: parseFloat(formData.amount) || 0,
      currency: formData.currency,
      status: formData.status,
      employee_id: profile?.employeeId || '',
      employee_name: profile?.fullName || 'Unknown',
      // Additional fields would need to be handled by the hook or backend
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="glass-panel sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nouvelle note de frais</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="expense_date">Date</Label>
            <Input
              id="expense_date"
              type="date"
              value={formData.expense_date}
              onChange={e => setFormData({ ...formData, expense_date: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Description</Label>
            <Input
              id="title"
              placeholder="Ex: Déjeuner client"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Catégorie</Label>
            <Select
              value={formData.category_name}
              onValueChange={val => setFormData({ ...formData, category_name: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Repas">Repas</SelectItem>
                <SelectItem value="Transport">Transport</SelectItem>
                <SelectItem value="Hébergement">Hébergement</SelectItem>
                <SelectItem value="Fournitures">Fournitures</SelectItem>
                <SelectItem value="Autre">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Montant</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Devise</Label>
              <CurrencySelect
                value={formData.currency}
                onValueChange={val => setFormData({ ...formData, currency: val })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Créer la note</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// === PAYROLL DIALOGS ===
export const CreatePayrollPeriodDialog = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const { createPayrollPeriod } = usePayrollManagement();
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    status: 'draft' as const,
    totalGross: 0,
    totalNet: 0,
    totalEmployees: 0,
    totalCharges: 0,
    currency: 'DJF',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createPayrollPeriod(formData);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="glass-panel sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nouvelle période de paie</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="month">Mois</Label>
              <Select
                value={formData.month.toString()}
                onValueChange={val => setFormData({ ...formData, month: parseInt(val) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <SelectItem key={m} value={m.toString()}>
                      {new Date(2024, m - 1).toLocaleDateString('fr-FR', { month: 'long' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Année</Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Devise de la période</Label>
            <CurrencySelect
              value={formData.currency}
              onValueChange={val => setFormData({ ...formData, currency: val })}
            />
          </div>
          <DialogFooter>
            <Button type="submit">Initialiser la période</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// === SKILLS & TRAINING DIALOGS ===
export const CreateSkillDialog = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const { createSkill } = useSkillsTraining();
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createSkill({
      ...formData,
      updated_at: new Date().toISOString(),
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="glass-panel sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nouvelle compétence</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: React.js"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Catégorie</Label>
            <Select
              value={formData.category}
              onValueChange={val => setFormData({ ...formData, category: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Technique">Technique</SelectItem>
                <SelectItem value="Soft Skill">Soft Skill</SelectItem>
                <SelectItem value="Langue">Langue</SelectItem>
                <SelectItem value="Gestion">Gestion</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description de la compétence..."
            />
          </div>
          <DialogFooter>
            <Button type="submit">Créer</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const CreateSkillAssessmentDialog = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const { createEvaluation } = usePerformance();
  const [formData, setFormData] = useState({
    employee_id: '',
    period: '',
    type: 'annual' as const,
    overall_score: 5,
    strengths: '',
    areas_for_improvement: '',
    status: 'draft' as const,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createEvaluation({
      ...formData,
      evaluator_id: 'current_user_id', // Should be fetched from auth context
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="glass-panel sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nouvelle évaluation</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employee_id">Employé</Label>
              <Select
                onValueChange={val => setFormData({ ...formData, employee_id: val })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {/* TODO: Use real employees list */}
                  <SelectItem value="emp_1">Employé 1</SelectItem>
                  <SelectItem value="emp_2">Employé 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="period">Période</Label>
              <Input
                id="period"
                value={formData.period}
                onChange={e => setFormData({ ...formData, period: e.target.value })}
                placeholder="Ex: Q1 2024"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(val: any) => setFormData({ ...formData, type: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual">Annuelle</SelectItem>
                  <SelectItem value="quarterly">Trimestrielle</SelectItem>
                  <SelectItem value="360">360°</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="overall_score">Score Global (1-10)</Label>
              <Input
                id="overall_score"
                type="number"
                min="1"
                max="10"
                value={formData.overall_score}
                onChange={e =>
                  setFormData({ ...formData, overall_score: parseInt(e.target.value) })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="strengths">Points Forts</Label>
              <Textarea
                id="strengths"
                value={formData.strengths}
                onChange={e => setFormData({ ...formData, strengths: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="areas_for_improvement">Points d'Amélioration</Label>
              <Textarea
                id="areas_for_improvement"
                value={formData.areas_for_improvement}
                onChange={e => setFormData({ ...formData, areas_for_improvement: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Fermer</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// === HEALTH & SAFETY DIALOGS ===
export const CreateIncidentDialog = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const { createIncident } = useHealthSafety();
  const { profile } = useUserAuth();
  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    type: '',
    severity: 'low' as const,
    description: '',
    location: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createIncident({
      ...formData,
      reportedBy: profile?.fullName || 'Unknown',
      reportedDate: formData.date,
      affectedEmployee: undefined, // Optional
    } as any); // Type cast to avoid strict check issues for now
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="glass-panel sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Déclarer un incident</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="severity">Sévérité</Label>
              <Select
                value={formData.severity}
                onValueChange={(val: any) => setFormData({ ...formData, severity: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Faible</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Élevée</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={formData.type}
              onValueChange={val => setFormData({ ...formData, type: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Accident">Accident</SelectItem>
                <SelectItem value="Incident">Incident</SelectItem>
                <SelectItem value="Near Miss">Presque accident</SelectItem>
                <SelectItem value="Hazard">Danger</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Lieu</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button type="submit">Déclarer</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const CreateSafetyDocumentDialog = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const { uploadDocument } = useHealthSafety();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'policy' as const,
    category: '',
    version: '1.0',
    publishedDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    status: 'active' as const,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('safety-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('safety-documents').getPublicUrl(filePath);

      await uploadDocument({
        ...formData,
        downloadUrl: publicUrl,
        expiryDate: formData.expiryDate || undefined,
      });

      setOpen(false);
      setFile(null);
      setFormData({
        title: '',
        type: 'policy',
        category: '',
        version: '1.0',
        publishedDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        status: 'active',
      });
    } catch (error) {
      console.error('Error uploading document:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="glass-panel sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nouveau document sécurité</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(val: any) => setFormData({ ...formData, type: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="policy">Politique</SelectItem>
                  <SelectItem value="procedure">Procédure</SelectItem>
                  <SelectItem value="training">Formation</SelectItem>
                  <SelectItem value="certificate">Certificat</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                placeholder="Ex: Incendie"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                value={formData.version}
                onChange={e => setFormData({ ...formData, version: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(val: any) => setFormData({ ...formData, status: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="expired">Expiré</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="publishedDate">Date de publication</Label>
              <Input
                id="publishedDate"
                type="date"
                value={formData.publishedDate}
                onChange={e => setFormData({ ...formData, publishedDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Date d'expiration</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="file">Fichier</Label>
            <Input id="file" type="file" onChange={handleFileChange} required />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={uploading}>
              {uploading ? 'Upload en cours...' : 'Uploader'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
