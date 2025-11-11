import { useState, useEffect } from 'react';
import { Plus, FileText, Eye, Download } from '@/lib/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

interface Task {
  id: string;
  title: string;
  project_id?: string | null;
}

interface DocumentCellProps {
  task: Task;
  isSubtask?: boolean;
}

interface TaskDocument {
  id: string;
  file_name: string;
  file_path: string;
  created_at: string;
  uploader_id: string | null;
  tenant_id: string;
}

export const DocumentCellColumn = ({ task, isSubtask }: DocumentCellProps) => {
  const [documents, setDocuments] = useState<TaskDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { toast } = useToast();
  const { currentTenant } = useTenant();

  const loadDocuments = async () => {
    // Ne pas charger pour les tâches de démonstration (UUIDs fictifs)
    if (task.id.startsWith('00000000-0000-0000-0000')) {
      setDocuments([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('task_documents')
        .select('*')
        .eq('task_id', task.id);

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${task.id}/${Date.now()}.${fileExt}`;

      console.log('Uploading file:', fileName);
      const { error: uploadError } = await supabase.storage
        .from('task-documents')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }

      console.log('File uploaded successfully, inserting into database...');

      // Récupérer l'utilisateur actuel
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }

      if (!currentTenant?.id) {
        throw new Error('Aucun tenant actif');
      }

      const { error: dbError } = await supabase.from('task_documents').insert({
        task_id: task.id,
        project_id: task.project_id,
        file_name: file.name,
        file_path: fileName,
        file_size: file.size,
        mime_type: file.type,
        tenant_id: currentTenant.id,
        uploader_id: user.id,
      });

      if (dbError) throw dbError;

      toast({
        title: 'Succès',
        description: 'Document uploadé',
      });

      loadDocuments();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Erreur',
        description: "Échec de l'upload",
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const downloadDocument = async (doc: TaskDocument) => {
    try {
      const { data, error } = await supabase.storage.from('task-documents').download(doc.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: 'Erreur',
        description: 'Échec du téléchargement',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [task.id]);

  return (
    <div className="flex items-center gap-1">
      <label className="block">
        <Input
          type="file"
          onChange={handleFileUpload}
          disabled={uploading}
          className="hidden"
          id={`file-${task.id}`}
        />
        <Button
          variant="ghost"
          size="sm"
          disabled={uploading}
          className={`${isSubtask ? 'h-6 w-6 p-0' : 'h-8 w-8 p-0'}`}
          onClick={() => document.getElementById(`file-${task.id}`)?.click()}
        >
          <Plus className={`${isSubtask ? 'h-3 w-3' : 'h-4 w-4'}`} />
        </Button>
      </label>

      {documents.length > 0 && (
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={`${isSubtask ? 'h-6 px-1 text-xs' : 'h-8 px-2 text-sm'}`}
            >
              <FileText className={`${isSubtask ? 'mr-1 h-3 w-3' : 'mr-1 h-4 w-4'}`} />
              {documents.length}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Documents - {task.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {documents.map(doc => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded bg-muted/50 p-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{doc.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadDocument(doc)}
                    className="h-8 w-8 p-0"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
