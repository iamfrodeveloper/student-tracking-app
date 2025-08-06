'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Circle, AlertCircle } from 'lucide-react';
import { SETUP_STEPS, AppConfig, DEFAULT_API_CONFIG } from '@/types/config';
import { configManager } from '@/lib/config';
import { ResponsiveCard, ResponsiveButton } from '@/components/ui/responsive-layout';
import DatabaseSetup from './DatabaseSetup';
import APISetup from './APISetup';
import ConnectionTest from './ConnectionTest';
import SampleDataSetup from './SampleDataSetup';

interface SetupWizardProps {
  onComplete: () => void;
}

export default function SetupWizard({ onComplete }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState(SETUP_STEPS);
  const [config, setConfig] = useState<AppConfig>({
    database: {
      neon: { connectionString: '' },
      qdrant: { url: '', apiKey: '', collectionName: 'student_notes' }
    },
    api: DEFAULT_API_CONFIG,
    isSetupComplete: false
  });

  useEffect(() => {
    // Load existing config if available
    const existingConfig = configManager.getConfig();
    if (existingConfig) {
      setConfig(existingConfig);
      updateStepsFromConfig(existingConfig);
    }
  }, []);

  const updateStepsFromConfig = (config: AppConfig) => {
    const updatedSteps = [...steps];
    
    // Check database step
    if (config.database.neon.connectionString && config.database.qdrant.url && config.database.qdrant.apiKey) {
      updatedSteps[0].completed = true;
    }
    
    // Check API step
    if (config.api.transcription.apiKey && config.api.llm.apiKey && config.api.embeddings.apiKey) {
      updatedSteps[1].completed = true;
    }

    setSteps(updatedSteps);
  };

  const handleStepComplete = (stepIndex: number) => {
    const updatedSteps = [...steps];
    updatedSteps[stepIndex].completed = true;
    setSteps(updatedSteps);

    // Auto-advance to next step if not the last step
    if (stepIndex < steps.length - 1) {
      setCurrentStep(stepIndex + 1);
    }
  };

  const handleDatabaseConfigUpdate = (databaseConfig: any) => {
    const updatedConfig = { ...config, database: databaseConfig };
    setConfig(updatedConfig);
    configManager.updateDatabaseConfig(databaseConfig);
  };

  const handleAPIConfigUpdate = (apiConfig: any) => {
    const updatedConfig = { ...config, api: apiConfig };
    setConfig(updatedConfig);
    configManager.updateAPIConfig(apiConfig);
  };

  const handleFinishSetup = () => {
    configManager.markSetupComplete();
    onComplete();
  };

  const canProceedToNext = () => {
    const currentStepData = steps[currentStep];
    return currentStepData.completed || !currentStepData.required;
  };

  const allRequiredStepsComplete = () => {
    return steps.filter(step => step.required).every(step => step.completed);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Student Tracking App Setup</CardTitle>
            <CardDescription>
              Let's configure your application to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div className="flex items-center">
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                          step.completed
                            ? 'bg-green-500 border-green-500 text-white'
                            : currentStep === index
                            ? 'border-blue-500 text-blue-500'
                            : 'border-gray-300 text-gray-300'
                        }`}
                      >
                        {step.completed ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <span className="text-sm font-medium">{index + 1}</span>
                        )}
                      </div>
                      <div className="ml-2">
                        <div className={`text-sm font-medium ${
                          step.completed ? 'text-green-600' : 
                          currentStep === index ? 'text-blue-600' : 'text-gray-500'
                        }`}>
                          {step.title}
                        </div>
                        {!step.required && (
                          <div className="text-xs text-gray-400">Optional</div>
                        )}
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-12 h-0.5 mx-4 ${
                        step.completed ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Step Content */}
            <Tabs value={steps[currentStep].id} className="w-full">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1 h-auto p-1">
                {steps.map((step, index) => (
                  <TabsTrigger
                    key={step.id}
                    value={step.id}
                    onClick={() => setCurrentStep(index)}
                    disabled={index > currentStep && !steps[index - 1]?.completed}
                    className="mobile-touch-target text-xs sm:text-sm px-2 py-3 sm:px-3 sm:py-2 flex flex-col sm:flex-row items-center gap-1 sm:gap-2"
                  >
                    <div className="flex items-center gap-1">
                      {step.completed ? (
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                      ) : index === currentStep ? (
                        <Circle className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 fill-current" />
                      ) : (
                        <Circle className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                      )}
                      <span className="hidden sm:inline">{step.title}</span>
                    </div>
                    <span className="sm:hidden text-center leading-tight">{step.title}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="database" className="mt-6">
                <DatabaseSetup
                  config={config.database}
                  onUpdate={handleDatabaseConfigUpdate}
                  onComplete={() => handleStepComplete(0)}
                />
              </TabsContent>

              <TabsContent value="api" className="mt-6">
                <APISetup
                  config={config.api}
                  onUpdate={handleAPIConfigUpdate}
                  onComplete={() => handleStepComplete(1)}
                />
              </TabsContent>

              <TabsContent value="test" className="mt-6">
                <ConnectionTest
                  config={config}
                  onComplete={() => handleStepComplete(2)}
                />
              </TabsContent>

              <TabsContent value="sample-data" className="mt-6">
                <SampleDataSetup
                  onComplete={() => handleStepComplete(3)}
                />
              </TabsContent>
            </Tabs>

            {/* Navigation */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8">
              <ResponsiveButton
                variant="outline"
                size="lg"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="order-2 sm:order-1"
              >
                Previous
              </ResponsiveButton>

              <div className="flex flex-col sm:flex-row gap-2 order-1 sm:order-2">
                {currentStep < steps.length - 1 ? (
                  <ResponsiveButton
                    variant="primary"
                    size="lg"
                    onClick={() => setCurrentStep(currentStep + 1)}
                    disabled={!canProceedToNext()}
                    fullWidth={true}
                    className="sm:w-auto"
                  >
                    Next Step
                  </ResponsiveButton>
                ) : (
                  <ResponsiveButton
                    variant="primary"
                    size="lg"
                    onClick={handleFinishSetup}
                    disabled={!allRequiredStepsComplete()}
                    fullWidth={true}
                    className="sm:w-auto bg-green-600 hover:bg-green-700 focus:ring-green-500"
                  >
                    Complete Setup
                  </ResponsiveButton>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
