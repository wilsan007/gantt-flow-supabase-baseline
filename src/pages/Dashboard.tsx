import React from 'react';
import { useTenantOwnerSetup } from '@/hooks/useTenantOwnerSetup';
import TenantOwnerWelcome from '@/components/auth/TenantOwnerWelcome';
import { Loader2 } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { isLoading, isPendingTenantOwner, hasCompletedSetup, userEmail, error } = useTenantOwnerSetup();

  // Affichage de chargement
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Tableau de bord
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Vos composants de dashboard existants */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Projets</h2>
            <p className="text-gray-600">Gérez vos projets en cours</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Équipe</h2>
            <p className="text-gray-600">Gérez votre équipe et les employés</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Statistiques</h2>
            <p className="text-gray-600">Consultez vos métriques</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
