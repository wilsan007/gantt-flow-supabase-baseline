/**
 * Composant: ActionAttachmentUpload
 * Upload de fichiers de preuve pour les actions
 * Pattern: Dropbox/Google Drive file upload
 */

import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  File, 
  FileImage, 
  FileText, 
  X, 
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

interface ActionAttachmentUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionTemplateId: string;
  actionTitle: string;
  taskId?: string;
  onUploadSuccess?: () => void;
}

interface FileToUpload {
  file: File;
  description: string;
  preview?: string;
}

const ACCEPTED_FILE_TYPES = {
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  pdf: ['application/pdf'],
  doc: [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.oasis.opendocument.text',
  ],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const ActionAttachmentUpload: React.FC<ActionAttachmentUploadProps> = ({
  open,
  onOpenChange,
  actionTemplateId,
  actionTitle,
  taskId,
  onUploadSuccess,
}) => {
  const [files, setFiles] = useState<FileToUpload[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentTenant } = useTenant();

  const getFileType = (mimeType: string): 'image' | 'pdf' | 'doc' | 'other' => {
    if (ACCEPTED_FILE_TYPES.image.includes(mimeType)) return 'image';
    if (ACCEPTED_FILE_TYPES.pdf.includes(mimeType)) return 'pdf';
    if (ACCEPTED_FILE_TYPES.doc.includes(mimeType)) return 'doc';
    return 'other';
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <FileImage className="h-8 w-8 text-blue-500" />;
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-500" />;
      case 'doc':
        return <FileText className="h-8 w-8 text-blue-600" />;
      default:
        return <File className="h-8 w-8 text-gray-500" />;
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    
    const validFiles = selectedFiles.filter(file => {
      // Vérifier la taille
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`Fichier trop volumineux: ${file.name}`, {
          description: 'Taille maximale: 10MB',
        });
        return false;
      }
      
      // Vérifier le type
      const allAcceptedTypes = [
        ...ACCEPTED_FILE_TYPES.image,
        ...ACCEPTED_FILE_TYPES.pdf,
        ...ACCEPTED_FILE_TYPES.doc,
      ];
      
      if (!allAcceptedTypes.includes(file.type)) {
        toast.error(`Type de fichier non supporté: ${file.name}`, {
          description: 'Formats acceptés: images, PDF, documents Word',
        });
        return false;
      }
      
      return true;
    });

    // Créer les previews pour les images
    const newFiles: FileToUpload[] = validFiles.map(file => {
      const fileToUpload: FileToUpload = {
        file,
        description: '',
      };

      // Preview pour les images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFiles(prev =>
            prev.map(f =>
              f.file === file ? { ...f, preview: e.target?.result as string } : f
            )
          );
        };
        reader.readAsDataURL(file);
      }

      return fileToUpload;
    });

    setFiles(prev => [...prev, ...newFiles]);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDescriptionChange = (index: number, description: string) => {
    setFiles(prev =>
      prev.map((f, i) => (i === index ? { ...f, description } : f))
    );
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Aucun fichier sélectionné');
      return;
    }

    if (!currentTenant) {
      toast.error('Session invalide', {
        description: 'Veuillez vous reconnecter',
      });
      return;
    }

    // Obtenir l'utilisateur actuel
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      toast.error('Utilisateur non authentifié', {
        description: 'Veuillez vous reconnecter',
      });
      return;
    }

    setUploading(true);
    const uploadedFiles: string[] = [];

    try {
      for (const { file, description } of files) {
        // 1. Upload vers Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${actionTemplateId}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${currentTenant.id}/${fileName}`;

        const { data: storageData, error: storageError } = await supabase.storage
          .from('action-attachments')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (storageError) throw storageError;

        // 2. Insérer dans la table
        const { error: dbError } = await supabase
          .from('operational_action_attachments')
          .insert({
            tenant_id: currentTenant.id,
            action_template_id: actionTemplateId,
            task_id: taskId || null,
            file_name: file.name,
            file_type: getFileType(file.type),
            file_size: file.size,
            file_extension: `.${fileExt}`,
            mime_type: file.type,
            storage_path: filePath,
            storage_bucket: 'action-attachments',
            uploaded_by: user.id,
            description: description || null,
          });

        if (dbError) throw dbError;

        uploadedFiles.push(file.name);
      }

      toast.success('Fichiers uploadés avec succès ! 🎉', {
        description: `${uploadedFiles.length} fichier(s) ajouté(s)`,
      });

      // Reset et fermer
      setFiles([]);
      onOpenChange(false);
      
      // Callback
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error: any) {
      console.error('Erreur upload:', error);
      toast.error('Erreur lors de l\'upload', {
        description: error.message || 'Une erreur inattendue s\'est produite',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajouter des preuves de réalisation</DialogTitle>
          <DialogDescription>
            Action : <span className="font-semibold">{actionTitle}</span>
            <br />
            <span className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              L'action ne peut être validée sans au moins un fichier
            </span>
          </DialogDescription>
        </DialogHeader>

        {/* Zone de sélection */}
        <div className="space-y-4">
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.odt"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm font-medium mb-1">
              Cliquez pour sélectionner ou glissez-déposez
            </p>
            <p className="text-xs text-muted-foreground">
              Images, PDF, Documents Word • Max 10MB par fichier
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="mt-4"
              disabled={uploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Parcourir
            </Button>
          </div>

          {/* Liste des fichiers */}
          {files.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Fichiers sélectionnés ({files.length})</Label>
                <Badge variant="secondary">{files.length} fichier(s)</Badge>
              </div>

              {files.map((fileItem, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 space-y-3 bg-muted/30"
                >
                  <div className="flex items-start gap-3">
                    {/* Icon/Preview */}
                    <div className="flex-shrink-0">
                      {fileItem.preview ? (
                        <img
                          src={fileItem.preview}
                          alt={fileItem.file.name}
                          className="h-16 w-16 object-cover rounded"
                        />
                      ) : (
                        getFileIcon(getFileType(fileItem.file.type))
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{fileItem.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(fileItem.file.size / 1024).toFixed(1)} KB •{' '}
                        {getFileType(fileItem.file.type).toUpperCase()}
                      </p>
                    </div>

                    {/* Bouton supprimer */}
                    <Button
                      onClick={() => handleRemoveFile(index)}
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      disabled={uploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <Label className="text-xs">
                      Description (optionnelle)
                    </Label>
                    <Textarea
                      value={fileItem.description}
                      onChange={(e) =>
                        handleDescriptionChange(index, e.target.value)
                      }
                      placeholder="Décrivez ce fichier..."
                      rows={2}
                      disabled={uploading}
                      className="text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            disabled={uploading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Upload en cours...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Uploader {files.length > 0 && `(${files.length})`}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
