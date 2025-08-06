'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { ResponsiveLayout } from '@/components/ui/responsive-layout';

// Dynamically import components to avoid SSR issues
const SetupWizard = dynamic(() => import('@/components/setup/SetupWizard'), {
  ssr: false,
  loading: () => (
    <ResponsiveLayout>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Setup...</p>
        </div>
      </div>
    </ResponsiveLayout>
  )
});

const Dashboard = dynamic(() => import('@/components/Dashboard'), {
  ssr: false,
  loading: () => (
    <ResponsiveLayout>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Dashboard...</p>
        </div>
      </div>
    </ResponsiveLayout>
  )
});

export default function Home() {
  const [isSetupComplete, setIsSetupComplete] = useState<boolean | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Check if setup is complete
    try {
      // Import configManager dynamically to avoid SSR issues
      import('@/lib/config').then(({ configManager }) => {
        const setupComplete = configManager.isSetupComplete();
        setIsSetupComplete(setupComplete);
      }).catch((error) => {
        console.error('Error loading config manager:', error);
        setIsSetupComplete(false);
      });
    } catch (error) {
      console.error('Error checking setup status:', error);
      setIsSetupComplete(false);
    }
  }, [mounted]);

  const handleSetupComplete = () => {
    setIsSetupComplete(true);
  };

  // Don't render anything until mounted (avoid hydration mismatch)
  if (!mounted) {
    return null;
  }

  // Show loading state while checking setup status
  if (isSetupComplete === null) {
    return (
      <ResponsiveLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Initializing Student Tracking App...</p>
            <p className="text-sm text-gray-500 mt-2">Please wait while we load your configuration</p>
          </div>
        </div>
      </ResponsiveLayout>
    );
  }

  // Show setup wizard if setup is not complete
  if (!isSetupComplete) {
    return (
      <ResponsiveLayout maxWidth="2xl" padding="md">
        <SetupWizard onComplete={handleSetupComplete} />
      </ResponsiveLayout>
    );
  }

  // Show main dashboard if setup is complete
  return (
    <ResponsiveLayout maxWidth="full" padding="sm">
      <Dashboard />
    </ResponsiveLayout>
  );
}
