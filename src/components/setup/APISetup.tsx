'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Zap, CheckCircle, Loader2, Shield, Info, ExternalLink } from 'lucide-react';
import { APIConfig, API_PROVIDERS } from '@/types/config';
import { testAPIConnection } from '@/lib/config';

interface APISetupProps {
  config: APIConfig;
  onUpdate: (config: APIConfig) => void;
  onComplete: () => void;
}

export default function APISetup({ config, onUpdate, onComplete }: APISetupProps) {
  const [formData, setFormData] = useState<APIConfig>(config);
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<{
    transcription?: { success: boolean; message: string };
    llm?: { success: boolean; message: string };
    embeddings?: { success: boolean; message: string };
  }>({});
  const [errors, setErrors] = useState<string[]>([]);

  const handleProviderChange = (service: 'transcription' | 'llm' | 'embeddings', provider: string) => {
    const updatedConfig = {
      ...formData,
      [service]: {
        ...formData[service],
        provider,
        // Reset custom endpoint when switching providers
        customEndpoint: provider === 'custom' ? formData[service].customEndpoint : undefined
      }
    };
    setFormData(updatedConfig);
    onUpdate(updatedConfig);
  };

  const handleFieldChange = (service: 'transcription' | 'llm' | 'embeddings', field: string, value: string) => {
    const updatedConfig = {
      ...formData,
      [service]: {
        ...formData[service],
        [field]: value
      }
    };
    setFormData(updatedConfig);
    onUpdate(updatedConfig);
  };

  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    // Validate transcription service
    if (!formData.transcription.apiKey && formData.transcription.provider !== 'custom') {
      newErrors.push('Transcription API key is required');
    }
    if (formData.transcription.provider === 'custom' && !formData.transcription.customEndpoint) {
      newErrors.push('Custom transcription endpoint is required');
    }

    // Validate LLM service
    if (!formData.llm.apiKey && formData.llm.provider !== 'custom') {
      newErrors.push('LLM API key is required');
    }
    if (formData.llm.provider === 'custom' && !formData.llm.customEndpoint) {
      newErrors.push('Custom LLM endpoint is required');
    }

    // Validate embeddings service
    if (!formData.embeddings.apiKey && formData.embeddings.provider !== 'custom') {
      newErrors.push('Embeddings API key is required');
    }
    if (formData.embeddings.provider === 'custom' && !formData.embeddings.customEndpoint) {
      newErrors.push('Custom embeddings endpoint is required');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleTestAPIs = async () => {
    if (!validateForm()) return;

    setTesting(true);
    setTestResults({});

    try {
      const result = await testAPIConnection(formData);
      
      if (result.success) {
        setTestResults({
          transcription: { success: true, message: 'API connection successful' },
          llm: { success: true, message: 'API connection successful' },
          embeddings: { success: true, message: 'API connection successful' }
        });
        onComplete();
      } else {
        setTestResults({
          transcription: { success: false, message: result.message },
          llm: { success: false, message: result.message },
          embeddings: { success: false, message: result.message }
        });
      }
    } catch (error) {
      setTestResults({
        transcription: { success: false, message: 'API test failed' },
        llm: { success: false, message: 'API test failed' },
        embeddings: { success: false, message: 'API test failed' }
      });
    } finally {
      setTesting(false);
    }
  };

  const getModelPlaceholder = (service: 'transcription' | 'llm' | 'embeddings', provider: string) => {
    const defaults = {
      transcription: {
        openai: 'whisper-1',
        google: 'latest_long',
        azure: 'whisper',
        custom: 'your-model-name'
      },
      llm: {
        openai: 'gpt-4',
        anthropic: 'claude-3-sonnet-20240229',
        google: 'gemini-pro',
        custom: 'your-model-name'
      },
      embeddings: {
        openai: 'text-embedding-ada-002',
        'sentence-transformers': 'all-MiniLM-L6-v2',
        custom: 'your-model-name'
      }
    };
    return defaults[service][provider as keyof typeof defaults[typeof service]] || 'model-name';
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Zap className="w-12 h-12 mx-auto mb-4 text-blue-600" />
        <h3 className="text-lg font-semibold">API Configuration</h3>
        <p className="text-gray-600">Configure your AI service providers for transcription, language models, and embeddings</p>
      </div>

      {/* Security Warning */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800 mb-2">🔒 API Security Guidelines</h4>
              <div className="text-sm text-amber-700 space-y-1">
                <p>• <strong>Keep API keys confidential</strong> - Never share them publicly or commit to version control</p>
                <p>• <strong>Use API key restrictions</strong> when available (IP restrictions, usage limits)</p>
                <p>• <strong>Monitor API usage</strong> regularly for unexpected activity</p>
                <p>• <strong>Rotate keys periodically</strong> and revoke unused keys immediately</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Provider Information */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800 mb-2">📚 How to Get API Keys</h4>
              <div className="text-sm text-blue-700 space-y-2">
                <div>
                  <strong>Google Gemini:</strong> Visit{' '}
                  <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer"
                     className="inline-flex items-center gap-1 underline hover:no-underline">
                    Google AI Studio <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div>
                  <strong>OpenAI:</strong> Visit{' '}
                  <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer"
                     className="inline-flex items-center gap-1 underline hover:no-underline">
                    OpenAI Platform <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div>
                  <strong>Environment Variables:</strong> For production, set{' '}
                  <code className="bg-blue-100 px-1 rounded">GOOGLE_GEMINI_API_KEY</code>,{' '}
                  <code className="bg-blue-100 px-1 rounded">OPENAI_API_KEY</code>, etc.
                </div>
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

      {/* Transcription Service */}
      <Card>
        <CardHeader>
          <CardTitle>Speech-to-Text Service</CardTitle>
          <CardDescription>Configure your audio transcription service</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="transcription-provider">Provider</Label>
            <Select
              value={formData.transcription.provider}
              onValueChange={(value) => handleProviderChange('transcription', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent>
                {API_PROVIDERS.transcription.map((provider) => (
                  <SelectItem key={provider.value} value={provider.value}>
                    {provider.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="transcription-api-key">API Key</Label>
            <Input
              id="transcription-api-key"
              type="password"
              placeholder="Your API key"
              value={formData.transcription.apiKey}
              onChange={(e) => handleFieldChange('transcription', 'apiKey', e.target.value)}
              className="mt-1"
              disabled={formData.transcription.provider === 'custom'}
            />
          </div>

          {formData.transcription.provider === 'custom' && (
            <div>
              <Label htmlFor="transcription-endpoint">Custom Endpoint</Label>
              <Input
                id="transcription-endpoint"
                placeholder="https://your-api-endpoint.com"
                value={formData.transcription.customEndpoint || ''}
                onChange={(e) => handleFieldChange('transcription', 'customEndpoint', e.target.value)}
                className="mt-1"
              />
            </div>
          )}

          <div>
            <Label htmlFor="transcription-model">Model (Optional)</Label>
            <Input
              id="transcription-model"
              placeholder={getModelPlaceholder('transcription', formData.transcription.provider)}
              value={formData.transcription.model || ''}
              onChange={(e) => handleFieldChange('transcription', 'model', e.target.value)}
              className="mt-1"
            />
          </div>

          {testResults.transcription && (
            <div className={`flex items-center gap-2 p-2 rounded ${
              testResults.transcription.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {testResults.transcription.success ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span className="text-sm">{testResults.transcription.message}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* LLM Service */}
      <Card>
        <CardHeader>
          <CardTitle>Language Model Service</CardTitle>
          <CardDescription>Configure your LLM for query processing and response generation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="llm-provider">Provider</Label>
            <Select
              value={formData.llm.provider}
              onValueChange={(value) => handleProviderChange('llm', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent>
                {API_PROVIDERS.llm.map((provider) => (
                  <SelectItem key={provider.value} value={provider.value}>
                    {provider.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="llm-api-key">API Key</Label>
            <Input
              id="llm-api-key"
              type="password"
              placeholder="Your API key"
              value={formData.llm.apiKey}
              onChange={(e) => handleFieldChange('llm', 'apiKey', e.target.value)}
              className="mt-1"
              disabled={formData.llm.provider === 'custom'}
            />
          </div>

          {formData.llm.provider === 'custom' && (
            <div>
              <Label htmlFor="llm-endpoint">Custom Endpoint</Label>
              <Input
                id="llm-endpoint"
                placeholder="https://your-api-endpoint.com"
                value={formData.llm.customEndpoint || ''}
                onChange={(e) => handleFieldChange('llm', 'customEndpoint', e.target.value)}
                className="mt-1"
              />
            </div>
          )}

          <div>
            <Label htmlFor="llm-model">Model (Optional)</Label>
            <Input
              id="llm-model"
              placeholder={getModelPlaceholder('llm', formData.llm.provider)}
              value={formData.llm.model || ''}
              onChange={(e) => handleFieldChange('llm', 'model', e.target.value)}
              className="mt-1"
            />
          </div>

          {testResults.llm && (
            <div className={`flex items-center gap-2 p-2 rounded ${
              testResults.llm.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {testResults.llm.success ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span className="text-sm">{testResults.llm.message}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test APIs Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleTestAPIs}
          disabled={testing}
          className="w-full max-w-md"
        >
          {testing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Testing API Connections...
            </>
          ) : (
            'Test API Connections'
          )}
        </Button>
      </div>
    </div>
  );
}
