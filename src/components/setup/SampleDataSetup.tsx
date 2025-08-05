'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Loader2, Users, BookOpen, CreditCard, FileText } from 'lucide-react';

interface SampleDataSetupProps {
  onComplete: () => void;
}

export default function SampleDataSetup({ onComplete }: SampleDataSetupProps) {
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [results, setResults] = useState<{
    students?: { success: boolean; count: number };
    payments?: { success: boolean; count: number };
    tests?: { success: boolean; count: number };
    notes?: { success: boolean; count: number };
  }>({});
  const [error, setError] = useState<string>('');

  const loadSampleData = async () => {
    setLoading(true);
    setError('');
    setResults({});

    try {
      // Load students
      setLoadingStep('Loading sample students...');
      const studentsResult = await loadStudents();
      setResults(prev => ({ ...prev, students: studentsResult }));

      if (studentsResult.success) {
        // Load payments
        setLoadingStep('Loading sample payments...');
        const paymentsResult = await loadPayments();
        setResults(prev => ({ ...prev, payments: paymentsResult }));

        // Load tests
        setLoadingStep('Loading sample test scores...');
        const testsResult = await loadTests();
        setResults(prev => ({ ...prev, tests: testsResult }));

        // Load notes
        setLoadingStep('Loading sample notes...');
        const notesResult = await loadNotes();
        setResults(prev => ({ ...prev, notes: notesResult }));

        if (paymentsResult.success && testsResult.success && notesResult.success) {
          onComplete();
        }
      }
    } catch (error) {
      setError('Failed to load sample data. Please try again.');
      console.error('Sample data loading error:', error);
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const loadStudents = async () => {
    const response = await fetch('/api/setup/sample-data/students', {
      method: 'POST',
    });
    return await response.json();
  };

  const loadPayments = async () => {
    const response = await fetch('/api/setup/sample-data/payments', {
      method: 'POST',
    });
    return await response.json();
  };

  const loadTests = async () => {
    const response = await fetch('/api/setup/sample-data/tests', {
      method: 'POST',
    });
    return await response.json();
  };

  const loadNotes = async () => {
    const response = await fetch('/api/setup/sample-data/notes', {
      method: 'POST',
    });
    return await response.json();
  };

  const skipSampleData = () => {
    onComplete();
  };

  const allDataLoaded = () => {
    return results.students?.success && 
           results.payments?.success && 
           results.tests?.success && 
           results.notes?.success;
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Users className="w-12 h-12 mx-auto mb-4 text-blue-600" />
        <h3 className="text-lg font-semibold">Sample Data Setup</h3>
        <p className="text-gray-600">Load sample student data to test your application (optional)</p>
      </div>

      {/* Loading Status */}
      {loading && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <span className="text-blue-800">{loadingStep}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800">Error Loading Sample Data</h4>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sample Data Description */}
      <Card>
        <CardHeader>
          <CardTitle>What's Included</CardTitle>
          <CardDescription>
            The sample data includes realistic student information to help you test the application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <h4 className="font-medium">Students</h4>
                <p className="text-sm text-gray-600">10 sample students with contact info</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-green-600" />
              <div>
                <h4 className="font-medium">Payments</h4>
                <p className="text-sm text-gray-600">Payment records for recent months</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-purple-600" />
              <div>
                <h4 className="font-medium">Test Scores</h4>
                <p className="text-sm text-gray-600">Academic performance data</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-orange-600" />
              <div>
                <h4 className="font-medium">Notes</h4>
                <p className="text-sm text-gray-600">Behavioral and achievement notes</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Display */}
      {Object.keys(results).length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">Loading Results:</h4>
          
          {results.students && (
            <div className={`flex items-center gap-2 p-3 rounded ${
              results.students.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {results.students.success ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span className="text-sm">
                Students: {results.students.success ? `${results.students.count} loaded` : 'Failed to load'}
              </span>
            </div>
          )}

          {results.payments && (
            <div className={`flex items-center gap-2 p-3 rounded ${
              results.payments.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {results.payments.success ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span className="text-sm">
                Payments: {results.payments.success ? `${results.payments.count} loaded` : 'Failed to load'}
              </span>
            </div>
          )}

          {results.tests && (
            <div className={`flex items-center gap-2 p-3 rounded ${
              results.tests.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {results.tests.success ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span className="text-sm">
                Test Scores: {results.tests.success ? `${results.tests.count} loaded` : 'Failed to load'}
              </span>
            </div>
          )}

          {results.notes && (
            <div className={`flex items-center gap-2 p-3 rounded ${
              results.notes.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {results.notes.success ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span className="text-sm">
                Notes: {results.notes.success ? `${results.notes.count} loaded` : 'Failed to load'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Success Message */}
      {allDataLoaded() && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <h4 className="font-medium text-green-800">Sample Data Loaded Successfully!</h4>
                <p className="text-sm text-green-700">
                  You can now test the application with realistic student data.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <Button
          variant="outline"
          onClick={skipSampleData}
          disabled={loading}
        >
          Skip Sample Data
        </Button>
        <Button
          onClick={loadSampleData}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Loading Data...
            </>
          ) : (
            'Load Sample Data'
          )}
        </Button>
      </div>

      {/* Note */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="pt-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <strong>Note:</strong> Sample data is completely optional. You can skip this step and add your own data later through the application interface.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
