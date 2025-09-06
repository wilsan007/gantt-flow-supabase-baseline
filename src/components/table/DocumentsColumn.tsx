import { useState } from "react";
import { Upload, FileText, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

interface Task {
  id: string;
  title: string;
  project_id?: string | null;
}

interface DocumentsColumnProps {
  task: Task;
}

interface TaskDocument {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  created_at: string;
  uploader_id: string | null;
}

export const DocumentsColumn = ({ task }: DocumentsColumnProps) => {
  const [documents, setDocuments] = useState<TaskDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadDocuments = async () => {
    if (loading) return;
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from("task_documents")
        .select("*")
        .eq("task_id", task.id);

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error("Error loading documents:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les documents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${task.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("task-documents")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from("task_documents")
        .insert({
          task_id: task.id,
          project_id: task.project_id,
          file_name: file.name,
          file_path: fileName,
          file_size: file.size,
          mime_type: file.type,
          // Le tenant_id sera automatiquement rempli par le trigger
        });

      if (dbError) throw dbError;

      toast({
        title: "Succès",
        description: "Document uploadé avec succès",
      });

      loadDocuments();
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Erreur",
        description: "Échec de l'upload du document",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const downloadDocument = async (doc: TaskDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from("task-documents")
        .download(doc.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.file_name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      toast({
        title: "Erreur",
        description: "Échec du téléchargement",
        variant: "destructive",
      });
    }
  };

  const deleteDocument = async (doc: TaskDocument) => {
    try {
      const { error: storageError } = await supabase.storage
        .from("task-documents")
        .remove([doc.file_path]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from("task_documents")
        .delete()
        .eq("id", doc.id);

      if (dbError) throw dbError;

      toast({
        title: "Succès",
        description: "Document supprimé",
      });

      loadDocuments();
    } catch (error) {
      console.error("Error deleting file:", error);
      toast({
        title: "Erreur",
        description: "Échec de la suppression",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-64 p-2 border-l">
      <div className="flex items-center gap-2 mb-2">
        <FileText className="h-4 w-4" />
        <span className="text-sm font-medium">Documents</span>
      </div>
      
      <div className="space-y-2">
        <label className="block">
          <Input
            type="file"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
            id={`file-${task.id}`}
          />
          <Button
            variant="outline"
            size="sm"
            disabled={uploading}
            className="w-full"
            onClick={() => document.getElementById(`file-${task.id}`)?.click()}
          >
            <Upload className="h-3 w-3 mr-1" />
            {uploading ? "Upload..." : "Upload"}
          </Button>
        </label>

        <Button
          variant="ghost"
          size="sm"
          onClick={loadDocuments}
          disabled={loading}
          className="w-full"
        >
          {loading ? "Chargement..." : `Docs (${documents.length})`}
        </Button>

        {documents.length > 0 && (
          <div className="max-h-32 overflow-y-auto space-y-1">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center gap-1 p-1 bg-muted/50 rounded text-xs">
                <span className="flex-1 truncate">{doc.file_name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => downloadDocument(doc)}
                  className="h-6 w-6 p-0"
                >
                  <Download className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteDocument(doc)}
                  className="h-6 w-6 p-0"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};