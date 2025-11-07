/**
 * 📄 Dialog Demande Administrative - Pattern Workday
 */

import { useState } from 'react';
import { useHRSelfService } from '@/hooks/useHRSelfService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Upload } from 'lucide-react';

const REQUEST_TYPES = [
  { value: 'employment_certificate', label: 'Attestation de travail' },
  { value: 'salary_advance', label: 'Avance sur salaire' },
  { value: 'tax_certificate', label: 'Certificat fiscal' },
  { value: 'rib_change', label: 'Changement RIB' },
  { value: 'address_change', label: 'Changement d\'adresse' },
  { value: 'equipment_request', label: 'Demande de matériel' },
  { value: 'training_request', label: 'Demande de formation' },
  { value: 'other', label: 'Autre demande' },
];

const PRIORITIES = [
  { value: 'low', label: 'Basse', color: 'text-gray-500' },
  { value: 'normal', label: 'Normale', color: 'text-blue-500' },
  { value: 'high', label: 'Haute', color: 'text-orange-500' },
  { value: 'urgent', label: 'Urgente', color: 'text-red-500' },
];

interface AdministrativeRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AdministrativeRequestDialog({
  open,
  onOpenChange,
  onSuccess,
}: AdministrativeRequestDialogProps) {
  const { createAdministrativeRequest, loading } = useHRSelfService();

  const [requestType, setRequestType] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('normal');
  const [attachmentUrl, setAttachmentUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!requestType || !subject || !description) {
      return;
    }

    await createAdministrativeRequest({
      request_type: requestType,
      subject,
      description,
      priority,
      attachment_url: attachmentUrl || null,
    });

    // Reset form
    setRequestType('');
    setSubject('');
    setDescription('');
    setPriority('normal');
    setAttachmentUrl('');

    onSuccess?.();
    onOpenChange(false);
  };

  // Auto-remplir le sujet selon le type
  const handleTypeChange = (type: string) => {
    setRequestType(type);
    const selectedType = REQUEST_TYPES.find(t => t.value === type);
    if (selectedType && !subject) {
      setSubject(`Demande de ${selectedType.label.toLowerCase()}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Demande Administrative
          </DialogTitle>
          <DialogDescription>
            Faites une demande auprès du service RH
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type de demande */}
          <div className="space-y-2">
            <Label>Type de demande *</Label>
            <Select value={requestType} onValueChange={handleTypeChange} required>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                {REQUEST_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priorité */}
          <div className="space-y-2">
            <Label>Priorité</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    <span className={p.color}>{p.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sujet */}
          <div className="space-y-2">
            <Label htmlFor="subject">Sujet *</Label>
            <Input
              id="subject"
              placeholder="Résumé de votre demande"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description détaillée *</Label>
            <Textarea
              id="description"
              placeholder="Décrivez votre demande en détail..."
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
            {requestType === 'salary_advance' && (
              <p className="text-xs text-orange-600">
                Précisez le montant souhaité et la raison de la demande d'avance.
              </p>
            )}
            {requestType === 'rib_change' && (
              <p className="text-xs text-blue-600">
                N'oubliez pas de joindre votre nouveau RIB en pièce jointe.
              </p>
            )}
            {requestType === 'equipment_request' && (
              <p className="text-xs text-blue-600">
                Détaillez le matériel demandé (ordinateur, écran, clavier, etc.) et la justification.
              </p>
            )}
          </div>

          {/* Pièce jointe */}
          <div className="space-y-2">
            <Label htmlFor="attachment">Pièce jointe (optionnel)</Label>
            <div className="flex gap-2">
              <Input
                id="attachment"
                type="url"
                placeholder="https://... (URL du document)"
                value={attachmentUrl}
                onChange={(e) => setAttachmentUrl(e.target.value)}
              />
              <Button type="button" variant="outline" size="icon">
                <Upload className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Joignez tout document pertinent (RIB, justificatif, etc.)
            </p>
          </div>

          {/* Informations */}
          <div className="bg-muted/50 rounded-lg p-4 text-sm">
            <p className="font-medium mb-2">Délais de traitement :</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Attestations : 48h ouvrées</li>
              <li>Changements administratifs : 5 jours ouvrés</li>
              <li>Avances sur salaire : Traitement au cas par cas</li>
              <li>Demandes de matériel : Selon disponibilité</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading || !requestType || !subject || !description}
            >
              {loading ? 'Envoi en cours...' : 'Soumettre la demande'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
