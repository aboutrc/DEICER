import React, { useState, useEffect } from 'react';
import { supabase, testSupabaseConnection, isSupabaseConfigured } from '../lib/supabase';
import { AlertTriangle, Database, RefreshCw, Check, X, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DebugProps {
  language?: 'en' | 'es' | 'zh' | 'hi' | 'ar';
}

const Debug: React.FC<DebugProps> = ({ language = 'en' }) => {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [envVars, setEnvVars] = useState<{[key: string]: string}>({});
  const navigate = useNavigate();

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

  const translations = {
    en: {
      title: 'Debug Panel',
      connectionStatus: 'Connection Status',
      configuration: 'Configuration',
      connection: 'Connection',
      configured: 'Configured',
      notConfigured: 'Not Configured',
      connected: 'Connected',
      disconnected: 'Disconnected',
      testConnection: 'Test Connection',
      testQuery: 'Test Query',
      environmentVariables: 'Environment Variables',
      debugLogs: 'Debug Logs',
      noLogs: 'No logs yet',
      error: 'Error',
      connectionWorking: 'Connection is working properly',
      connectionIssues: 'Connection issues detected',
      back: 'Back to Home',
      checking: 'Checking...'
    },
    es: {
      title: 'Panel de Depuración',
      connectionStatus: 'Estado de Conexión',
      configuration: 'Configuración',
      connection: 'Conexión',
      configured: 'Configurado',
      notConfigured: 'No Configurado',
      connected: 'Conectado',
      disconnected: 'Desconectado',
      testConnection: 'Probar Conexión',
      testQuery: 'Probar Consulta',
      environmentVariables: 'Variables de Entorno',
      debugLogs: 'Registros de Depuración',
      noLogs: 'Aún no hay registros',
      error: 'Error',
      connectionWorking: 'La conexión funciona correctamente',
      connectionIssues: 'Se detectaron problemas de conexión',
      back: 'Volver al Inicio',
      checking: 'Verificando...'
    },
    zh: {
      title: '调试面板',
      connectionStatus: '连接状态',
      configuration: '配置',
      connection: '连接',
      configured: '已配置',
      notConfigured: '未配置',
      connected: '已连接',
      disconnected: '未连接',
      testConnection: '测试连接',
      testQuery: '测试查询',
      environmentVariables: '环境变量',
      debugLogs: '调试日志',
      noLogs: '暂无日志',
      error: '错误',
      connectionWorking: '连接正常工作',
      connectionIssues: '检测到连接问题',
      back: '返回首页',
      checking: '检查中...'
    },
    hi: {
      title: 'डीबग पैनल',
      connectionStatus: 'कनेक्शन स्थिति',
      configuration: 'कॉन्फ़िगरेशन',
      connection: 'कनेक्शन',
      configured: 'कॉन्फ़िगर किया गया',
      notConfigured: 'कॉन्फ़िगर नहीं किया गया',
      connected: 'कनेक्टेड',
      disconnected: 'डिस्कनेक्टेड',
      testConnection: 'कनेक्शन टेस्ट करें',
      testQuery: 'क्वेरी टेस्ट करें',
      environmentVariables: 'एनवायरनमेंट वेरिएबल्स',
      debugLogs: 'डीबग लॉग्स',
      noLogs: 'अभी तक कोई लॉग नहीं',
      error: 'त्रुटि',
      connectionWorking: 'कनेक्शन ठीक से काम कर रहा है',
      connectionIssues: 'कनेक्शन में समस्याएं पाई गईं',
      back: 'होम पेज पर वापस जाएं',
      checking: 'जांच हो रही है...'
    },
    ar: {
      title: 'لوحة التصحيح',
      connectionStatus: 'حالة الاتصال',
      configuration: 'التكوين',
      connection: 'الاتصال',
      configured: 'تم التكوين',
      notConfigured: 'لم يتم التكوين',
      connected: 'متصل',
      disconnected: 'غير متصل',
      testConnection: 'اختبار الاتصال',
      testQuery: 'اختبار الاستعلام',
      environmentVariables: 'متغيرات البيئة',
      debugLogs: 'سجلات التصحيح',
      noLogs: 'لا توجد سجلات حتى الآن',
      error: 'خطأ',
      connectionWorking: 'الاتصال يعمل بشكل صحيح',
      connectionIssues: 'تم اكتشاف مشاكل في الاتصال',
      back: 'العودة إلى الصفحة الرئيسية',
      checking: 'جاري الفحص...'
    }
  };

  const t = translations[language];

  return (
    <div className={`min-h-screen bg-gray-900 p-4 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center">
            <Database className="mr-2" size={24} />
            {t.title}
          </h1>
          <button 
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 flex items-center"
          >
            <ArrowLeft size={18} className="mr-2" />
            {t.back}
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-3">{t.connectionStatus}</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">{t.configuration}:</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${isConfigured ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
                    {isConfigured ? t.configured : t.notConfigured}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">{t.connection}:</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${isConnected ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
                    {isConnected ? t.connected : t.disconnected}
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
                  {t.testConnection}
                </button>
                
                <button
                  onClick={testQuery}
                  disabled={isLoading || !isConnected}
                  className={`px-3 py-1.5 text-white rounded text-sm flex items-center ${
                    isLoading || !isConnected ? 'bg-gray-700 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  <Database size={16} className="mr-1.5" />
                  {t.testQuery}
                </button>
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-3">{t.environmentVariables}</h3>
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
            <h3 className="text-lg font-medium text-white mb-3">{t.debugLogs}</h3>
            <div className="bg-black/50 rounded p-3 h-[300px] overflow-y-auto font-mono text-xs">
              {logs.map((log, index) => (
                <div key={index} className="text-gray-300 mb-1">{log}</div>
              ))}
              {logs.length === 0 && (
                <div className="text-gray-500 italic">{t.noLogs}</div>
              )}
            </div>
          </div>
        </div>
        
        {error && (
          <div className="mt-6 bg-red-900/30 border border-red-800 rounded-lg p-4 text-red-200 flex items-start">
            <AlertTriangle size={20} className="mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">{t.error}</p>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          </div>
        )}
        
        <div className="mt-6 p-4 border-t border-gray-700 bg-gray-800/50 rounded-lg flex justify-between">
          <div className="text-sm text-gray-400">
            {isConfigured && isConnected ? (
              <span className="flex items-center text-green-400">
                <Check size={16} className="mr-1.5" />
                {t.connectionWorking}
              </span>
            ) : (
              <span className="flex items-center text-yellow-400">
                <AlertTriangle size={16} className="mr-1.5" />
                {t.connectionIssues}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Debug;