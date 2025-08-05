'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Loader2, Database, Zap, Shield } from 'lucide-react';
import { AppConfig } from '@/types/config';

interface ConnectionTestProps {
  config: AppConfig;
  onComplete: () => void;
}

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
}

interface TestResults {
  database?: TestResult;
  api?: TestResult;
  schema?: TestResult;
}

export default function ConnectionTest({ config, onComplete }: ConnectionTestProps) {
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<TestResults>({});
  const [currentTest, setCurrentTest] = useState<string>('');

  const runAllTests = async () => {
    setTesting(true);
    setTestResults({});

    try {
      // Test database connections
      setCurrentTest('Testing database connections...');
      const dbResult = await testDatabaseConnections();
      setTestResults(prev => ({ ...prev, database: dbResult }));

      if (dbResult.success) {
        // Test schema setup
        setCurrentTest('Setting up database schema...');
        const schemaResult = await setupDatabaseSchema();
        setTestResults(prev => ({ ...prev, schema: schemaResult }));

        // Test API connections
        setCurrentTest('Testing API connections...');
        const apiResult = await testAPIConnections();
        setTestResults(prev => ({ ...prev, api: apiResult }));

        if (schemaResult.success && apiResult.success) {
          onComplete();
        }
      }
    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      setTesting(false);
      setCurrentTest('');
    }
  };

  const testDatabaseConnections = async (): Promise<TestResult> => {
    try {
      const response = await fetch('/api/test/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config.database),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        message: 'Failed to connect to databases',
        details: error
      };
    }
  };

  const setupDatabaseSchema = async (): Promise<TestResult> => {
    try {
      const response = await fetch('/api/setup/schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config.database),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        message: 'Failed to setup database schema',
        details: error
      };
    }
  };

  const testAPIConnections = async (): Promise<TestResult> => {
    try {
      const response = await fetch('/api/test/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config.api),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        message: 'Failed to test API connections',
        details: error
      };
    }
  };

  const allTestsPassed = () => {
    return testResults.database?.success && 
           testResults.schema?.success && 
           testResults.api?.success;
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Shield className="w-12 h-12 mx-auto mb-4 text-blue-600" />
        <h3 className="text-lg font-semibold">Connection Testing</h3>
        <p className="text-gray-600">Verify all your configurations are working correctly</p>
      </div>

      {/* Test Status */}
      {testing && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <span className="text-blue-800">{currentTest}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Results */}
      <div className="space-y-4">
        {/* Database Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Database Connections
            </CardTitle>
            <CardDescription>
              Testing Neon PostgreSQL and Qdrant vector database connections
            </CardDescription>
          </CardHeader>
          <CardContent>
            {testResults.database ? (
              <div className={`flex items-center gap-2 p-3 rounded ${
                testResults.database.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {testResults.database.success ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <div>
                  <div className="font-medium">
                    {testResults.database.success ? 'Connection Successful' : 'Connection Failed'}
                  </div>
                  <div className="text-sm">{testResults.database.message}</div>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-sm">Not tested yet</div>
            )}
          </CardContent>
        </Card>

        {/* Schema Setup Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Database Schema
            </CardTitle>
            <CardDescription>
              Setting up required database tables and indexes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {testResults.schema ? (
              <div className={`flex items-center gap-2 p-3 rounded ${
                testResults.schema.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {testResults.schema.success ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <div>
                  <div className="font-medium">
                    {testResults.schema.success ? 'Schema Setup Complete' : 'Schema Setup Failed'}
                  </div>
                  <div className="text-sm">{testResults.schema.message}</div>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-sm">Not tested yet</div>
            )}
          </CardContent>
        </Card>

        {/* API Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              API Services
            </CardTitle>
            <CardDescription>
              Testing transcription, LLM, and embedding service connections
            </CardDescription>
          </CardHeader>
          <CardContent>
            {testResults.api ? (
              <div className={`flex items-center gap-2 p-3 rounded ${
                testResults.api.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {testResults.api.success ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <div>
                  <div className="font-medium">
                    {testResults.api.success ? 'API Connections Successful' : 'API Connections Failed'}
                  </div>
                  <div className="text-sm">{testResults.api.message}</div>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-sm">Not tested yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Success Message */}
      {allTestsPassed() && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <h4 className="font-medium text-green-800">All Tests Passed!</h4>
                <p className="text-sm text-green-700">
                  Your application is properly configured and ready to use.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Button */}
      <div className="flex justify-center">
        <Button
          onClick={runAllTests}
          disabled={testing}
          className="w-full max-w-md"
        >
          {testing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Running Tests...
            </>
          ) : (
            'Run All Tests'
          )}
        </Button>
      </div>

      {/* Configuration Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Summary</CardTitle>
          <CardDescription>Review your current configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Database:</strong>
              <div className="text-gray-600">
                Neon PostgreSQL + Qdrant Vector DB
              </div>
            </div>
            <div>
              <strong>Transcription:</strong>
              <div className="text-gray-600">
                {config.api.transcription.provider} ({config.api.transcription.model || 'default'})
              </div>
            </div>
            <div>
              <strong>Language Model:</strong>
              <div className="text-gray-600">
                {config.api.llm.provider} ({config.api.llm.model || 'default'})
              </div>
            </div>
            <div>
              <strong>Embeddings:</strong>
              <div className="text-gray-600">
                {config.api.embeddings.provider} ({config.api.embeddings.model || 'default'})
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
