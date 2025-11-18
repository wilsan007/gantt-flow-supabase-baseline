import { Card, CardContent } from '@/components/ui/card';

interface ErrorStateProps {
  error: string;
}

export const ErrorState = ({ error }: ErrorStateProps) => (
  <Card className="w-full">
    <CardContent className="p-8">
      <div className="text-destructive text-center">
        <p>Erreur lors du chargement des tâches</p>
        <p className="text-muted-foreground mt-2 text-sm">{error}</p>
      </div>
    </CardContent>
  </Card>
);
