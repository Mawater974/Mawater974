'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function TestConnection() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<string>('');
  const [config, setConfig] = useState<any>(null);

  const checkConnection = async () => {
    setStatus('checking');
    setError(null);
    setDetails('');

    try {
      // Get environment variables
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      // Store config for display
      const configInfo = {
        hasUrl: !!supabaseUrl,
        hasAnonKey,
        url: supabaseUrl
      };
      setConfig(configInfo);
      console.log('Config check:', configInfo);

      setDetails('Checking Supabase configuration...');

      if (!supabaseUrl || !hasAnonKey) {
        throw new Error('Missing Supabase configuration. Please check your environment variables.');
      }

      // First test if we can reach the Supabase REST endpoint
      try {
        setDetails('Testing Supabase URL accessibility...');
        const apiUrl = `${supabaseUrl}/rest/v1/`;
        const response = await fetch(apiUrl, {
          method: 'HEAD',
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to reach Supabase API: ${response.statusText}`);
        }
      } catch (fetchErr: any) {
        throw new Error(`Cannot reach Supabase API: ${fetchErr.message}`);
      }

      setDetails('Testing database connection...');
      
      // Try a simple ping to the database
      const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });

      if (error) throw error;
      
      setStatus('connected');
      setError(null);
      setDetails('Connected successfully!');
      
    } catch (err: any) {
      console.error('Connection error:', err);
      setStatus('error');
      setError(err.message);
      
      if (err.message.includes('Cannot reach Supabase API')) {
        setDetails('Cannot reach Supabase API. This could mean:\n1. The project is paused\n2. The URL is incorrect\n3. The API key is invalid');
      } else if (err.message.includes('fetch failed')) {
        setDetails('Network error. Please check your internet connection.');
      } else if (err.message.includes('Missing Supabase configuration')) {
        setDetails('Environment variables are not properly set. Check .env.local file.');
      } else {
        setDetails('Failed to connect to the database. Check console for details.');
      }
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-lg w-full">
        <h1 className="text-2xl font-bold mb-4">Database Connection Status</h1>
        
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Configuration</h2>
          {config && (
            <div className="text-sm bg-gray-100 dark:bg-gray-700 p-4 rounded mb-4 space-y-2">
              <div>Supabase URL set: {config.hasUrl ? '✓' : '✗'}</div>
              <div>Anon Key set: {config.hasAnonKey ? '✓' : '✗'}</div>
              {config.hasUrl && (
                <div className="break-all">
                  <strong>URL:</strong> {config.url}
                </div>
              )}
              <div className="text-xs text-gray-500">
                Note: URL should end with .supabase.co
              </div>
            </div>
          )}
        </div>

        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
          {details}
        </div>
        
        {status === 'checking' && (
          <div className="text-yellow-500 flex items-center">
            <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Checking connection...
          </div>
        )}
        
        {status === 'connected' && (
          <div className="text-green-500 flex items-center">
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            Connected to database successfully!
          </div>
        )}
        
        {status === 'error' && (
          <div>
            <div className="text-red-500 mb-2 flex items-center">
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
              Connection error
            </div>
            {error && (
              <div className="text-sm bg-red-100 dark:bg-red-900 p-4 rounded">
                <strong>Error message:</strong><br/>
                {error}
              </div>
            )}
          </div>
        )}

        {/* Retest Connection Button */}
        <div className="mt-4">
          <button 
            onClick={checkConnection} 
            disabled={status === 'checking'}
            className={`w-full py-2 rounded transition-colors ${
              status === 'checking' 
                ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {status === 'checking' ? 'Retesting...' : 'Retest Connection'}
          </button>
        </div>
      </div>
    </div>
  );
}
