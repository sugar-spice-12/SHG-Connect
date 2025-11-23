
import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, Server, Smartphone, Check } from 'lucide-react';
import { Conflict } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface ConflictResolverProps {
  conflict: Conflict;
  onResolve: (id: string, strategy: 'local' | 'server') => void;
}

export const ConflictResolver: React.FC<ConflictResolverProps> = ({ conflict, onResolve }) => {
  const { t } = useLanguage();

  // Helper to render object differences neatly
  const renderDiff = (local: any, server: any) => {
    return (
      <div className="text-xs space-y-2">
        {Object.keys(local).map((key) => {
          if (typeof local[key] === 'object') return null; // Skip complex objects for simplicity
          const isDifferent = local[key] !== server[key];
          if (!isDifferent && key !== 'name' && key !== 'amount') return null;

          return (
            <div key={key} className={`flex justify-between ${isDifferent ? 'bg-white/5 p-1 rounded' : ''}`}>
               <span className="text-white/40 capitalize">{key}:</span>
               <div className="flex gap-2">
                   <span className={isDifferent ? 'text-orange-400' : 'text-white/60'}>{String(local[key])}</span>
                   {isDifferent && (
                      <>
                        <span className="text-white/20">→</span>
                        <span className="text-blue-400">{String(server[key])}</span>
                      </>
                   )}
               </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel p-6 rounded-2xl border border-orange-500/30 relative overflow-hidden"
    >
      {/* Background Stripe */}
      <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
      
      <div className="flex items-start gap-4 mb-6">
        <div className="p-3 bg-orange-500/20 rounded-full text-orange-500">
           <AlertTriangle size={24} />
        </div>
        <div>
           <h3 className="font-bold text-lg text-white">{t('conflictsFound')}</h3>
           <p className="text-white/50 text-sm">{conflict.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
         {/* Local Version */}
         <div className="bg-[#0D0D0F] p-4 rounded-xl border border-white/10">
            <div className="flex items-center gap-2 mb-3 text-orange-400">
                <Smartphone size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">{t('localVersion')}</span>
            </div>
            <div className="mb-4">
               {renderDiff(conflict.localData, conflict.serverData)}
            </div>
            <button 
                onClick={() => onResolve(conflict.id, 'local')}
                className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-white border border-white/5 flex items-center justify-center gap-2"
            >
                {t('keepLocal')}
            </button>
         </div>

         {/* Server Version */}
         <div className="bg-blue-900/20 p-4 rounded-xl border border-blue-500/30">
            <div className="flex items-center gap-2 mb-3 text-blue-400">
                <Server size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">{t('serverVersion')}</span>
            </div>
            <div className="mb-4">
                {/* We render the diff again but visually server is focus, logic is same */}
                <div className="text-xs space-y-2">
                    {Object.keys(conflict.serverData).map((key) => {
                        if (typeof conflict.serverData[key] === 'object') return null;
                        const isDifferent = conflict.localData[key] !== conflict.serverData[key];
                        if (!isDifferent && key !== 'name' && key !== 'amount') return null;
                        return (
                            <div key={key} className={`flex justify-between ${isDifferent ? 'bg-blue-500/20 p-1 rounded' : ''}`}>
                                <span className="text-white/40 capitalize">{key}:</span>
                                <span className="text-white">{String(conflict.serverData[key])}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
            <button 
                onClick={() => onResolve(conflict.id, 'server')}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold text-white flex items-center justify-center gap-2"
            >
                {t('keepServer')} <Check size={12} />
            </button>
         </div>
      </div>

      <div className="flex justify-center">
          <span className="text-[10px] text-white/30 bg-white/5 px-3 py-1 rounded-full">ID: {conflict.id}</span>
      </div>
    </motion.div>
  );
};
