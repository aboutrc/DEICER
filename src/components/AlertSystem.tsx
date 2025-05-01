import React, { useState, useEffect, useRef } from 'react';
import { Bell, X } from 'lucide-react';

export interface Alert {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number; // in milliseconds
}

interface AlertSystemProps {
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  maxAlerts?: number;
}

// Create a global alerts state that can be accessed from anywhere
let alertsQueue: Alert[] = [];
let setAlertsFunction: React.Dispatch<React.SetStateAction<Alert[]>> | null = null;

// Function to add an alert that can be called from anywhere
export const addAlert = (alert: Omit<Alert, 'id'>) => {
  const newAlert: Alert = {
    ...alert,
    id: Math.random().toString(36).substring(2, 9),
    duration: alert.duration || 5000, // Default 5 seconds
  };
  
  alertsQueue = [...alertsQueue, newAlert];
  
  if (setAlertsFunction) {
    setAlertsFunction([...alertsQueue]);
  }
  
  return newAlert.id;
};

// Function to remove an alert
export const removeAlert = (id: string) => {
  alertsQueue = alertsQueue.filter(alert => alert.id !== id);
  
  if (setAlertsFunction) {
    setAlertsFunction([...alertsQueue]);
  }
};

const AlertSystem: React.FC<AlertSystemProps> = ({ 
  position = 'top-center',
  maxAlerts = 5
}) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const alertsRef = useRef<Alert[]>([]);
  
  // Set the global setAlertsFunction
  useEffect(() => {
    setAlertsFunction = setAlerts;
    
    return () => {
      setAlertsFunction = null;
    };
  }, []);
  
  // Update ref when alerts change
  useEffect(() => {
    alertsRef.current = alerts;
  }, [alerts]);
  
  // Auto-remove alerts after their duration
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    
    alerts.forEach(alert => {
      const timer = setTimeout(() => {
        removeAlert(alert.id);
      }, alert.duration);
      
      timers.push(timer);
    });
    
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [alerts]);
  
  // Limit the number of visible alerts
  const visibleAlerts = alerts.slice(-maxAlerts);
  
  // Position classes
  const positionClasses = {
    'top-left': 'top-24 left-4',
    'top-center': 'top-24 left-1/2 transform -translate-x-1/2',
    'top-right': 'top-24 right-4',
    'bottom-left': 'bottom-24 left-4',
    'bottom-center': 'bottom-24 left-1/2 transform -translate-x-1/2',
    'bottom-right': 'bottom-24 right-4'
  };
  
  // Alert type classes
  const alertTypeClasses = {
    'info': 'bg-blue-900/90 text-white',
    'success': 'bg-green-900/90 text-white',
    'warning': 'bg-yellow-900/90 text-white',
    'error': 'bg-red-900/90 text-white'
  };
  
  return (
    <div className={`fixed z-[1002] ${positionClasses[position]} flex flex-col gap-2`}>
      {visibleAlerts.map(alert => (
        <div 
          key={alert.id}
          className={`${alertTypeClasses[alert.type]} backdrop-blur-sm px-4 py-3 rounded-lg shadow-lg 
                      flex items-center justify-between min-w-[250px] max-w-md animate-fade-in`}
        >
          <div className="flex items-center">
            <Bell size={20} className="mr-2 flex-shrink-0" />
            <span>{alert.message}</span>
          </div>
          <button 
            onClick={() => removeAlert(alert.id)}
            className="ml-2 p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default AlertSystem;