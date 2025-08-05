'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import components to avoid SSR issues
const SetupWizard = dynamic(() => import('@/components/setup/SetupWizard'), {
  ssr: false,
  loading: () => <div className="setup-loading">Loading Setup...</div>
});

const Dashboard = dynamic(() => import('@/components/Dashboard'), {
  ssr: false,
  loading: () => <div className="setup-loading">Loading Dashboard...</div>
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
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading...</p>
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
