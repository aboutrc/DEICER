import React from 'react';
import { Plus, RefreshCw, MapPin } from 'lucide-react';
import { addAlert } from './AlertSystem';
import { translations } from '../translations';

interface MapControlsProps {
  isAddingMarker: boolean;
  setIsAddingMarker: (value: boolean) => void;
  isRefreshing: boolean;
  refreshMarkers: () => void;
  language?: 'en' | 'es' | 'zh' | 'hi' | 'ar';
  language?: 'en' | 'es' | 'zh' | 'hi' | 'ar';
}

const MapControls: React.FC<MapControlsProps> = ({
  isAddingMarker,
  setIsAddingMarker,
  isRefreshing,
  refreshMarkers,
  language = 'en'

}) => {
  const t = translations[language];



  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => {
          setIsAddingMarker(!isAddingMarker);
          if (!isAddingMarker) {
            addAlert({
              message: t.clickToPlace || "Click on map to place mark",
              type: 'info',
              duration: 5000
            });
          }
        }}
        className={`px-4 py-3 rounded-lg shadow-lg flex items-center justify-center ${
          isAddingMarker 
            ? 'bg-gray-700 text-white' 
            : 'bg-gray-800 text-white hover:bg-gray-700'
        }`}
        title={isAddingMarker ? (language === 'es' ? "Cancelar" : language === 'zh' ? "取消" : language === 'hi' ? "रद्द करें" : language === 'ar' ? "إلغاء" : "Cancel") : (language === 'es' ? "Añadir Marca" : language === 'zh' ? "添加标记" : language === 'hi' ? "मार्क जोड़ें" : language === 'ar' ? "إضافة علامة" : "Add Mark")}
      >
        <Plus size={20} className="mr-2" /> 
        <span>{language === 'es' ? 'Añadir Marca' : 
               language === 'zh' ? '添加标记' : 
               language === 'hi' ? 'मार्क जोड़ें' : 
               language === 'ar' ? 'إضافة علامة' : 
               'Add Mark'}</span>
      </button>
      
      <button
        onClick={refreshMarkers}
        disabled={isRefreshing}
        className="px-4 py-3 rounded-lg shadow-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center"
        title={language === 'es' ? "Actualizar Marcadores" : language === 'zh' ? "刷新标记" : language === 'hi' ? "मार्कर रिफ्रेश करें" : language === 'ar' ? "تحديث العلامات" : "Refresh Markers"}
      >
        <RefreshCw size={20} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
        <span>{isRefreshing ? 
                (language === 'es' ? 'Actualizando...' : 
                 language === 'zh' ? '刷新中...' : 
                 language === 'hi' ? 'रिफ्रेश हो रहा है...' : 
                 language === 'ar' ? 'جاري التحديث...' : 
                 'Refreshing...') : 
                (language === 'es' ? 'Actualizar Marcadores' : 
                 language === 'zh' ? '刷新标记' : 
                 language === 'hi' ? 'मार्कर रिफ्रेश करें' : 
                 language === 'ar' ? 'تحديث العلامات' : 
                 'Refresh Markers')}
        </span>
      </button>
      
      <button
        onClick={() => {
          document.getElementById('location-search-button')?.click();
        }}
        className="px-4 py-3 rounded-lg shadow-lg bg-gray-800 text-white hover:bg-gray-700 flex items-center justify-center"
      >
        <MapPin size={20} className="mr-2" />
        <span>{language === 'es' ? 'Buscar' : 
               language === 'zh' ? '搜索' : 
               language === 'hi' ? 'खोज' : 
               language === 'ar' ? 'بحث' : 
               'Search'}</span>
      </button>
      
      <button
        onClick={() => {
          document.getElementById('university-selector-button')?.click();
        }}
        className="px-4 py-3 rounded-lg shadow-lg bg-gray-800 text-white hover:bg-gray-700 flex items-center justify-center"
      >
        <MapPin size={20} className="mr-2" />
        <span>{language === 'es' ? 'Universidad' : 
               language === 'zh' ? '大学' : 
               language === 'hi' ? 'विश्वविद्यालय' : 
               language === 'ar' ? 'جامعة' : 
               'University'}</span>
      </button>
    </div>
  );
};

export default MapControls;