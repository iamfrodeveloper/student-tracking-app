'use client';

import { useEffect, useState } from 'react';
import { configManager } from '@/lib/config';
import SetupWizard from '@/components/setup/SetupWizard';
import Dashboard from '@/components/Dashboard';

export default function Home() {
  const [isSetupComplete, setIsSetupComplete] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if setup is complete
    const setupComplete = configManager.isSetupComplete();
    setIsSetupComplete(setupComplete);
  }, []);

  const handleSetupComplete = () => {
    setIsSetupComplete(true);
  };

  // Show loading state while checking setup status
  if (isSetupComplete === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show setup wizard if setup is not complete
  if (!isSetupComplete) {
    return <SetupWizard onComplete={handleSetupComplete} />;
  }

  // Show main dashboard if setup is complete
  return <Dashboard />;
}
