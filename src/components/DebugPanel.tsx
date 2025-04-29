import React, { useState, useEffect } from 'react';
import { supabase, testSupabaseConnection, isSupabaseConfigured } from '../lib/supabase';
import { AlertTriangle, Database, RefreshCw, Check, X } from 'lucide-react';

interface DebugPanelProps {
  onClose: () => void;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [envVars, setEnvVars] = useState<{[key: string]: string}>({});

  useEffect(() => {
    checkConfiguration();
    testConnection();
    getEnvironmentVariables();
  }, []);

  const checkConfiguration = () => {
    const configured = isSupabaseConfigured();
    setIsConfigured(configured);
    addLog(`Supabase configuration check: ${configured ? 'Configured' : 'Not configured'}`);
  };

  const testConnection = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      addLog('Testing Supabase connection...');
      const connected = await testSupabaseConnection();
      setIsConnected(connected);
      addLog(`Supabase connection test result: ${connected ? 'Connected' : 'Failed'}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      addLog(`Connection error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getEnvironmentVariables = () => {
    const vars: {[key: string]: string} = {};
    
    // Get all environment variables that start with VITE_
    Object.keys(import.meta.env).forEach(key => {
      if (key.startsWith('VITE_')) {
        const value = import.meta.env[key];
        if (key.includes('KEY') || key.includes('SECRET')) {
          // Mask sensitive values
          vars[key] = value ? `${value.substring(0, 5)}...${value.substring(value.length - 5)}` : 'undefined';
        } else {
          vars[key] = value || 'undefined';
        }
      }
    });
    
    setEnvVars(vars);
  };

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toISOString()}] ${message}`]);
  };

  const testQuery = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      addLog('Executing test query...');
      const { data, error } = await supabase
        .from('markers')
        .select('id')
        .limit(1);
      
      if (error) {
        throw error;
      }
      
      addLog(`Query successful. Received ${data?.length || 0} records.`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      addLog(`Query error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg border border-gray-700 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center">
            <Database className="mr-2" size={20} />
            Supabase Connection Debugger
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-medium text-white mb-3">Connection Status</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Configuration:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${isConfigured ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
                      {isConfigured ? 'Configured' : 'Not Configured'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Connection:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${isConnected ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={testConnection}
                    disabled={isLoading}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm flex items-center"
                  >
                    {isLoading ? (
                      <RefreshCw size={16} className="mr-1.5 animate-spin" />
                    ) : (
                      <RefreshCw size={16} className="mr-1.5" />
                    )}
                    Test Connection
                  </button>
                  
                  <button
                    onClick={testQuery}
                    disabled={isLoading || !isConnected}
                    className={`px-3 py-1.5 text-white rounded text-sm flex items-center ${
                      isLoading || !isConnected ? 'bg-gray-700 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    <Database size={16} className="mr-1.5" />
                    Test Query
                  </button>
                </div>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-medium text-white mb-3">Environment Variables</h3>
                <div className="space-y-2 text-sm">
                  {Object.entries(envVars).map(([key, value]) => (
                    <div key={key} className="flex flex-col">
                      <span className="text-blue-400 font-mono">{key}</span>
                      <span className="text-gray-300 font-mono break-all">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-3">Debug Logs</h3>
              <div className="bg-black/50 rounded p-3 h-[300px] overflow-y-auto font-mono text-xs">
                {logs.map((log, index) => (
                  <div key={index} className="text-gray-300 mb-1">{log}</div>
                ))}
                {logs.length === 0 && (
                  <div className="text-gray-500 italic">No logs yet</div>
                )}
              </div>
            </div>
          </div>
          
          {error && (
            <div className="mt-6 bg-red-900/30 border border-red-800 rounded-lg p-4 text-red-200 flex items-start">
              <AlertTriangle size={20} className="mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Error</p>
                <p className="mt-1 text-sm">{error}</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-700 bg-gray-800 flex justify-between">
          <div className="text-sm text-gray-400">
            {isConfigured && isConnected ? (
              <span className="flex items-center text-green-400">
                <Check size={16} className="mr-1.5" />
                Connection is working properly
              </span>
            ) : (
              <span className="flex items-center text-yellow-400">
                <AlertTriangle size={16} className="mr-1.5" />
                Connection issues detected
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;