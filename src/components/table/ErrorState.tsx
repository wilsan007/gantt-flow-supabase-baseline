import { Card, CardContent } from '@/components/ui/card';

interface ErrorStateProps {
  error: string;
}

export const ErrorState = ({ error }: ErrorStateProps) => (
  <Card className="w-full">
    <CardContent className="p-8">
      <div className="text-center text-destructive">
        <p>Erreur lors du chargement des tâches</p>
        <p className="text-sm text-muted-foreground mt-2">{error}</p>
      </div>
    </CardContent>
  </Card>
);