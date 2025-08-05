'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import components to avoid SSR issues
const SetupWizard = dynamic(() => import('@/components/setup/SetupWizard'), {
  ssr: false,
  loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>Loading Setup...</div>
});

const Dashboard = dynamic(() => import('@/components/Dashboard'), {
  ssr: false,
  loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>Loading Dashboard...</div>
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
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f9fafb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#6b7280' }}>Loading...</p>
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
