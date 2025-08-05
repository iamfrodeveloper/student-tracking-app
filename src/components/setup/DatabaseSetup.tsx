'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Database, CheckCircle, Loader2, Shield, Info } from 'lucide-react';
import { DatabaseConfig } from '@/types/config';
import { testDatabaseConnection } from '@/lib/config';

interface DatabaseSetupProps {
  config: DatabaseConfig;
  onUpdate: (config: DatabaseConfig) => void;
  onComplete: () => void;
}

export default function DatabaseSetup({ config, onUpdate, onComplete }: DatabaseSetupProps) {
  const [formData, setFormData] = useState<DatabaseConfig>(config);
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<{
    neon?: { success: boolean; message: string };
    qdrant?: { success: boolean; message: string };
  }>({});
  const [errors, setErrors] = useState<string[]>([]);

  const handleInputChange = (section: 'neon' | 'qdrant', field: string, value: string) => {
    const updatedConfig = {
      ...formData,
      [section]: {
        ...formData[section],
        [field]: value
      }
    };
    setFormData(updatedConfig);
    onUpdate(updatedConfig);
  };

  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    if (!formData.neon.connectionString.trim()) {
      newErrors.push('Neon connection string is required');
    }

    if (!formData.qdrant.url.trim()) {
      newErrors.push('Qdrant URL is required');
    }

    if (!formData.qdrant.apiKey.trim()) {
      newErrors.push('Qdrant API key is required');
    }

    // Validate URL format
    if (formData.qdrant.url && !formData.qdrant.url.startsWith('http')) {
      newErrors.push('Qdrant URL must start with http:// or https://');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleTestConnection = async () => {
    if (!validateForm()) return;

    setTesting(true);
    setTestResults({});

    try {
      const result = await testDatabaseConnection(formData);
      
      if (result.success) {
        setTestResults({
          neon: { success: true, message: 'Connection successful' },
          qdrant: { success: true, message: 'Connection successful' }
        });
        onComplete();
      } else {
        setTestResults({
          neon: { success: false, message: result.message },
          qdrant: { success: false, message: result.message }
        });
      }
    } catch (error) {
      setTestResults({
        neon: { success: false, message: 'Connection failed' },
        qdrant: { success: false, message: 'Connection failed' }
      });
    } finally {
      setTesting(false);
    }
  };

  const parseConnectionString = (connectionString: string) => {
    try {
      const url = new URL(connectionString.replace('psql ', '').replace(/'/g, ''));
      return {
        host: url.hostname,
        port: url.port || '5432',
        database: url.pathname.slice(1),
        username: url.username,
        password: url.password
      };
    } catch {
      return null;
    }
  };

  const connectionDetails = parseConnectionString(formData.neon.connectionString);

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Database className="w-12 h-12 mx-auto mb-4 text-blue-600" />
        <h3 className="text-lg font-semibold">Database Configuration</h3>
        <p className="text-gray-600">Configure your Neon PostgreSQL and Qdrant vector database connections</p>
      </div>

      {/* Security Warning */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800 mb-2">🔒 Security Notice</h4>
              <div className="text-sm text-amber-700 space-y-1">
                <p>• <strong>Never share your credentials</strong> with anyone or commit them to version control</p>
                <p>• <strong>Use strong, unique passwords</strong> for your database accounts</p>
                <p>• <strong>Regularly rotate your API keys</strong> and monitor for unusual activity</p>
                <p>• <strong>Use environment variables</strong> for production deployments</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Environment Variables Info */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800 mb-2">💡 Production Deployment</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p>For production deployments, you can use environment variables instead of this setup wizard:</p>
                <p>• Set <code className="bg-blue-100 px-1 rounded">NEON_DATABASE_URL</code> for your PostgreSQL connection</p>
                <p>• Set <code className="bg-blue-100 px-1 rounded">QDRANT_URL</code> and <code className="bg-blue-100 px-1 rounded">QDRANT_API_KEY</code> for Qdrant</p>
                <p>• See <code className="bg-blue-100 px-1 rounded">.env.example</code> for all available environment variables</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {errors.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800">Please fix the following errors:</h4>
                <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Neon PostgreSQL Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Neon PostgreSQL Database
          </CardTitle>
          <CardDescription>
            Configure your Neon serverless PostgreSQL database connection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="neon-connection">Connection String</Label>
            <Textarea
              id="neon-connection"
              placeholder="postgresql://your_username:your_password@your_host:5432/your_database?sslmode=require"
              value={formData.neon.connectionString}
              onChange={(e) => handleInputChange('neon', 'connectionString', e.target.value)}
              className="mt-1"
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-1">
              Paste your Neon connection string here. You can find this in your Neon dashboard.
            </p>
          </div>

          {connectionDetails && (
            <div className="bg-gray-50 p-3 rounded-md">
              <h4 className="text-sm font-medium mb-2">Parsed Connection Details:</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><strong>Host:</strong> {connectionDetails.host}</div>
                <div><strong>Port:</strong> {connectionDetails.port}</div>
                <div><strong>Database:</strong> {connectionDetails.database}</div>
                <div><strong>Username:</strong> {connectionDetails.username}</div>
              </div>
            </div>
          )}

          {testResults.neon && (
            <div className={`flex items-center gap-2 p-2 rounded ${
              testResults.neon.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {testResults.neon.success ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span className="text-sm">{testResults.neon.message}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Qdrant Vector Database Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Qdrant Vector Database
          </CardTitle>
          <CardDescription>
            Configure your Qdrant vector database for storing unstructured data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="qdrant-url">Qdrant URL</Label>
            <Input
              id="qdrant-url"
              placeholder="https://your-cluster.qdrant.io"
              value={formData.qdrant.url}
              onChange={(e) => handleInputChange('qdrant', 'url', e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="qdrant-api-key">API Key</Label>
            <Input
              id="qdrant-api-key"
              type="password"
              placeholder="Your Qdrant API key"
              value={formData.qdrant.apiKey}
              onChange={(e) => handleInputChange('qdrant', 'apiKey', e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="qdrant-collection">Collection Name (Optional)</Label>
            <Input
              id="qdrant-collection"
              placeholder="student_notes"
              value={formData.qdrant.collectionName || ''}
              onChange={(e) => handleInputChange('qdrant', 'collectionName', e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Default: student_notes. The collection will be created automatically if it doesn't exist.
            </p>
          </div>

          {testResults.qdrant && (
            <div className={`flex items-center gap-2 p-2 rounded ${
              testResults.qdrant.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {testResults.qdrant.success ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span className="text-sm">{testResults.qdrant.message}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Connection Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleTestConnection}
          disabled={testing || !formData.neon.connectionString || !formData.qdrant.url || !formData.qdrant.apiKey}
          className="w-full max-w-md"
        >
          {testing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Testing Connections...
            </>
          ) : (
            'Test Database Connections'
          )}
        </Button>
      </div>
    </div>
  );
}
