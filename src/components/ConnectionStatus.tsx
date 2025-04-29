import React, { useState, useEffect } from 'react';
import { Database, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { testSupabaseConnection, isSupabaseConfigured } from '../lib/supabase';

interface ConnectionStatusProps {
  onStatusChange?: (isConnected: boolean) => void;
  className?: string;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  onStatusChange,
  className = ''
}) => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  useEffect(() => {
    checkConnection();
    
    // Check connection every 5 minutes
    const interval = setInterval(() => {
      checkConnection();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const checkConnection = async () => {
    setIsChecking(true);
    
    try {
      // First check if Supabase is configured
      const configured = isSupabaseConfigured();
      if (!configured) {
        setIsConnected(false);
        if (onStatusChange) onStatusChange(false);
        return;
      }
      
      // Test the connection
      const connected = await testSupabaseConnection();
      setIsConnected(connected);
      setLastChecked(new Date());
      
      if (onStatusChange) onStatusChange(connected);
    } catch (error) {
      console.error('Connection check error:', error);
      setIsConnected(false);
      if (onStatusChange) onStatusChange(false);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div 
        className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center ${
          isConnected === null
            ? 'bg-gray-700 text-gray-300'
            : isConnected
              ? 'bg-green-600/80 text-white'
              : 'bg-red-600/80 text-white'
        }`}
      >
        {isChecking ? (
          <RefreshCw size={14} className="mr-1.5 animate-spin" />
        ) : isConnected ? (
          <Wifi size={14} className="mr-1.5" />
        ) : (
          <WifiOff size={14} className="mr-1.5" />
        )}
        <span>
          {isChecking
            ? 'Checking...'
            : isConnected === null
              ? 'Unknown'
              : isConnected
                ? 'Connected'
                : 'Disconnected'}
        </span>
      </div>
      
      <button
        onClick={checkConnection}
        disabled={isChecking}
        className="p-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-full transition-colors"
        title="Check connection"
      >
        <RefreshCw size={14} className={isChecking ? 'animate-spin' : ''} />
      </button>
    </div>
  );
};

export default ConnectionStatus;