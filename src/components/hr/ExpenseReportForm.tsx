/**
 * 💰 Formulaire Note de Frais - Pattern Expensify/SAP Concur
 */

import { useState } from 'react';
import { useHRSelfService } from '@/hooks/useHRSelfService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Receipt, CalendarIcon, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const EXPENSE_CATEGORIES = [
  { value: 'transport', label: 'Transport' },
  { value: 'repas', label: 'Repas' },
  { value: 'hebergement', label: 'Hébergement' },
  { value: 'materiel', label: 'Matériel' },
  { value: 'formation', label: 'Formation' },
  { value: 'autres', label: 'Autres' },
];

const CURRENCIES = [
  { value: 'EUR', label: '€ Euro' },
  { value: 'USD', label: '$ Dollar' },
  { value: 'GBP', label: '£ Livre' },
];

interface ExpenseReportFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ExpenseReportForm({ onSuccess, onCancel }: ExpenseReportFormProps) {
  const { createExpenseReport, loading } = useHRSelfService();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [expenseDate, setExpenseDate] = useState<Date | undefined>(new Date());
  const [receiptUrl, setReceiptUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !category || !amount || !expenseDate) {
      return;
    }

    await createExpenseReport({
      title,
      description,
      category,
      amount: parseFloat(amount),
      currency,
      expense_date: format(expenseDate, 'yyyy-MM-dd'),
      receipt_url: receiptUrl || null,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setCategory('');
    setAmount('');
    setReceiptUrl('');
    setExpenseDate(new Date());

    onSuccess?.();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Nouvelle Note de Frais
        </CardTitle>
        <CardDescription>Soumettez vos frais professionnels pour remboursement</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Titre */}
          <div className="space-y-2">
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              placeholder="Ex: Déplacement client Paris"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Catégorie */}
          <div className="space-y-2">
            <Label>Catégorie *</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Montant et Devise */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Montant *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Devise</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(curr => (
                    <SelectItem key={curr.value} value={curr.value}>
                      {curr.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>Date de la dépense *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !expenseDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {expenseDate ? (
                    format(expenseDate, 'PPP', { locale: fr })
                  ) : (
                    <span>Sélectionner une date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={expenseDate}
                  onSelect={setExpenseDate}
                  initialFocus
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Détails de la dépense..."
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          {/* Reçu/Facture */}
          <div className="space-y-2">
            <Label htmlFor="receipt">Reçu / Facture (URL)</Label>
            <div className="flex gap-2">
              <Input
                id="receipt"
                type="url"
                placeholder="https://..."
                value={receiptUrl}
                onChange={e => setReceiptUrl(e.target.value)}
              />
              <Button type="button" variant="outline" size="icon">
                <Upload className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-muted-foreground text-xs">
              Téléchargez ou collez le lien du justificatif
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                Annuler
              </Button>
            )}
            <Button type="submit" disabled={loading || !title || !category || !amount}>
              {loading ? 'Enregistrement...' : 'Soumettre pour approbation'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
