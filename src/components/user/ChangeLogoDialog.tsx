/**
 * ChangeLogoDialog - Modal d'upload de logo entreprise
 * Accessible uniquement aux TENANT_ADMIN
 */

import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';

interface ChangeLogoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentLogoUrl?: string;
}

export const ChangeLogoDialog: React.FC<ChangeLogoDialogProps> = ({
  open,
  onOpenChange,
  currentLogoUrl,
}) => {
  const { toast } = useToast();
  const { currentTenant } = useTenant();
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Fichier sélectionné

    // Valider l'extension (plus fiable que file.type)
    const ext = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];

    if (!ext || !validExtensions.includes(ext)) {
      toast({
        title: '❌ Extension invalide',
        description: `Extensions acceptées: ${validExtensions.join(', ')}`,
        variant: 'destructive',
      });
      return;
    }

    // Valider la taille (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: '❌ Fichier trop volumineux',
        description: 'La taille maximale est de 2 MB',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);

    // Créer aperçu
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
      // Aperçu créé
    };
    reader.onerror = () => {
      // Erreur lecture fichier
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast({
        title: '❌ Aucun fichier',
        description: 'Veuillez sélectionner un logo',
        variant: 'destructive',
      });
      return;
    }

    if (!currentTenant?.id) {
      toast({
        title: '❌ Erreur',
        description: 'Tenant non trouvé',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // 1. Upload DIRECT du fichier sans transformation
      const fileExt = selectedFile.name.split('.').pop()?.toLowerCase();
      const fileName = `${currentTenant.id}/logo-${Date.now()}.${fileExt}`;

      // Upload logo direct

      // Upload DIRECT du File sans options
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // 2. Obtenir l'URL publique
      const {
        data: { publicUrl },
      } = supabase.storage.from('company-logos').getPublicUrl(fileName);

      // 3. Mettre à jour le tenant avec la nouvelle URL
      // UPDATE tenants.logo_url

      const { data: updateData, error: updateError } = await supabase
        .from('tenants')
        .update({ logo_url: publicUrl })
        .eq('id', currentTenant.id)
        .select();

      if (updateError) {
        throw updateError;
      }

      // Logo uploadé et enregistré avec succès

      toast({
        title: '✅ Logo modifié',
        description: 'Rechargement de la page...',
      });

      // Fermer le dialog
      onOpenChange(false);

      // Rafraîchir la page pour voir le logo
      window.location.reload();
    } catch (error: any) {
      console.error('Erreur upload logo:', error);
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de modifier le logo',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePreview = () => {
    setSelectedFile(null);
    setPreviewUrl(currentLogoUrl || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Modifier le logo de l'entreprise</DialogTitle>
          <DialogDescription>Téléchargez un nouveau logo (PNG, JPG - Max 2 MB)</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Zone de prévisualisation */}
          <div className="flex flex-col items-center gap-4">
            <div className="border-muted-foreground/25 bg-muted/10 relative h-32 w-32 overflow-hidden rounded-lg border-2 border-dashed">
              {previewUrl ? (
                <>
                  <img
                    src={previewUrl}
                    alt="Aperçu logo"
                    className="h-full w-full object-contain p-2"
                  />
                  {selectedFile && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 rounded-full p-0"
                      onClick={handleRemovePreview}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <ImageIcon className="text-muted-foreground/50 h-12 w-12" />
                </div>
              )}
            </div>

            {/* Bouton de sélection */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              <Upload className="mr-2 h-4 w-4" />
              Choisir un fichier
            </Button>

            {selectedFile && (
              <div className="text-muted-foreground text-sm">
                <span className="font-medium">Fichier sélectionné :</span> {selectedFile.name}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={loading || !selectedFile}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
