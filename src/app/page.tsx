'use client';

import { useEffect, useState } from 'react';
import { configManager } from '@/lib/config';
import SetupWizard from '@/components/setup/SetupWizard';
import Dashboard from '@/components/Dashboard';

export default function Home() {
  const [isSetupComplete, setIsSetupComplete] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if setup is complete
    try {
      const setupComplete = configManager.isSetupComplete();
      setIsSetupComplete(setupComplete);
    } catch (error) {
      console.error('Error checking setup status:', error);
      setIsSetupComplete(false);
    }
  }, []);

  const handleSetupComplete = () => {
    setIsSetupComplete(true);
  };

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
