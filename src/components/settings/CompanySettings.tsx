/**
 * CompanySettings - Gestion des paramètres de l'entreprise (Admin uniquement)
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Loader2, Building2, Image as ImageIcon } from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';

export const CompanySettings = () => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const { tenantId } = useTenant();
  const { toast } = useToast();

  useEffect(() => {
    loadCompanyInfo();
  }, [tenantId]);

  const loadCompanyInfo = async () => {
    if (!tenantId) return;

    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('name, logo_url')
        .eq('id', tenantId)
        .single();

      if (error) throw error;

      if (data) {
        setCompanyName(data.name || '');
        setLogoUrl(data.logo_url || '');
      }
    } catch (error) {
      console.error('Error loading company info:', error);
    }
  };

  const handleUpdateCompanyName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('tenants')
        .update({ name: companyName })
        .eq('id', tenantId);

      if (error) throw error;

      toast({
        title: 'Entreprise mise à jour',
        description: 'Le nom de votre entreprise a été modifié avec succès.',
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadLogo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!tenantId) return;

    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${tenantId}-${Math.random()}.${fileExt}`;
      const filePath = `company-logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('company-logos').getPublicUrl(filePath);
      
      const { error: updateError } = await supabase
        .from('tenants')
        .update({ logo_url: data.publicUrl })
        .eq('id', tenantId);

      if (updateError) throw updateError;

      setLogoUrl(data.publicUrl);

      toast({
        title: 'Logo mis à jour',
        description: 'Le logo de votre entreprise a été modifié avec succès.',
      });
    } catch (error: any) {
      toast({
        title: 'Erreur lors du téléchargement',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Nom de l'entreprise */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Informations de l'entreprise
          </CardTitle>
          <CardDescription>
            Gérez les informations de votre entreprise
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateCompanyName} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Nom de l'entreprise</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Nom de votre entreprise"
              />
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enregistrement...</>
              ) : (
                'Enregistrer les modifications'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Logo de l'entreprise */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Logo de l'entreprise
          </CardTitle>
          <CardDescription>
            Téléchargez le logo de votre entreprise
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Aperçu du logo */}
          {logoUrl && (
            <div className="flex items-center justify-center p-6 bg-muted rounded-lg">
              <img
                src={logoUrl}
                alt="Logo de l'entreprise"
                className="max-h-32 object-contain"
              />
            </div>
          )}

          {/* Upload */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="logo-upload" className="cursor-pointer">
              <Button type="button" variant="outline" disabled={uploading} asChild>
                <span>
                  {uploading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Téléchargement...</>
                  ) : (
                    <><Upload className="h-4 w-4 mr-2" /> {logoUrl ? 'Changer le logo' : 'Télécharger un logo'}</>
                  )}
                </span>
              </Button>
            </Label>
            <input
              id="logo-upload"
              type="file"
              accept="image/*"
              onChange={handleUploadLogo}
              className="hidden"
              disabled={uploading}
            />
            <p className="text-xs text-muted-foreground">
              PNG, SVG ou JPG. Recommandé : fond transparent, 500x500px max.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Branding (à venir) */}
      <Card>
        <CardHeader>
          <CardTitle>Personnalisation avancée</CardTitle>
          <CardDescription>
            Couleurs de marque et personnalisation complète
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Cette fonctionnalité sera bientôt disponible. Vous pourrez personnaliser :
          </p>
          <ul className="list-disc list-inside mt-2 text-sm text-muted-foreground space-y-1">
            <li>Couleurs primaires et secondaires</li>
            <li>Polices personnalisées</li>
            <li>Favicon personnalisé</li>
            <li>URL personnalisée</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
