/**
 * LanguageSettings - Sélection de la langue
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';

export const LanguageSettings = () => {
  const [language, setLanguage] = useState('fr');
  const { toast } = useToast();

  const languages = [
    { value: 'fr', label: 'Français', flag: '🇫🇷' },
    { value: 'en', label: 'English', flag: '🇬🇧' },
    { value: 'ar', label: 'العربية', flag: '🇸🇦' },
  ];

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    toast({
      title: 'Langue modifiée',
      description: `La langue de l'interface a été changée (fonctionnalité en développement).`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Langue de l'interface</CardTitle>
        <CardDescription>
          Sélectionnez la langue de l'application
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup value={language} onValueChange={handleLanguageChange} className="space-y-4">
          {languages.map((lang) => (
            <div key={lang.value} className="flex items-center space-x-3">
              <RadioGroupItem value={lang.value} id={lang.value} />
              <Label htmlFor={lang.value} className="flex items-center gap-3 cursor-pointer">
                <span className="text-2xl">{lang.flag}</span>
                <span className="text-base font-medium">{lang.label}</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
        <p className="text-sm text-muted-foreground mt-4">
          Note : La traduction complète de l'interface est en cours de développement.
        </p>
      </CardContent>
    </Card>
  );
};
