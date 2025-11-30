import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const CURRENCIES = [
  { code: 'DJF', symbol: 'Fdj', name: 'Franc Djibouti' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
];

interface CurrencySelectProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export const CurrencySelect: React.FC<CurrencySelectProps> = ({
  value,
  onValueChange,
  className,
}) => {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Devise" />
      </SelectTrigger>
      <SelectContent>
        {CURRENCIES.map(currency => (
          <SelectItem key={currency.code} value={currency.code}>
            {currency.code} ({currency.symbol})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export const formatCurrency = (amount: number, currencyCode: string) => {
  const currency = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0];
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: currencyCode === 'DJF' ? 0 : 2,
    maximumFractionDigits: currencyCode === 'DJF' ? 0 : 2,
  }).format(amount);
};
