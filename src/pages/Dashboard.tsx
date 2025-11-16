import React from 'react';
import { useTenantOwnerSetup } from '@/hooks/useTenantOwnerSetup';
import TenantOwnerWelcome from '@/components/auth/TenantOwnerWelcome';
import { Loader2 } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { isLoading, isPendingTenantOwner, hasCompletedSetup, userEmail, error } =
    useTenantOwnerSetup();

  // Affichage de chargement
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin" />
          <p>Chargement de votre espace de travail...</p>
        </div>
      </div>
    );
  }

  // Si c'est un tenant owner en attente, afficher l'écran de bienvenue
  if (isPendingTenantOwner && userEmail) {
    return <TenantOwnerWelcome userEmail={userEmail} />;
  }

  // Dashboard normal pour les utilisateurs existants
  return (
    <div className="h-full">
      <div className="container mx-auto">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">Tableau de bord</h1>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Vos composants de dashboard existants */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Projets</h2>
            <p className="text-gray-600">Gérez vos projets en cours</p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Équipe</h2>
            <p className="text-gray-600">Gérez votre équipe et les employés</p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Statistiques</h2>
            <p className="text-gray-600">Consultez vos métriques</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
