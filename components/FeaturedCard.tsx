import React from 'react';
import { ArrowRight, Calendar } from 'lucide-react';

interface FeaturedCardProps {
  title: string;
  subtitle: string;
  date: string;
  onClick?: () => void;
}

export const FeaturedCard: React.FC<FeaturedCardProps> = ({ title, subtitle, date, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="mx-6 mb-6 relative overflow-hidden rounded-3xl h-48 group cursor-pointer"
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-700 z-0 transition-transform duration-500 group-hover:scale-105" />
      
      {/* Decorative Circles */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
      <div className="absolute bottom-0 left-10 w-20 h-20 bg-blue-400/20 rounded-full blur-xl" />

      <div className="relative z-10 p-6 flex flex-col justify-between h-full">
        <div className="flex justify-between items-start">
          <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-white flex items-center gap-1">
             <Calendar size={12} /> {date}
          </span>
          <div className="w-8 h-8 rounded-full bg-white text-blue-600 flex items-center justify-center">
             <ArrowRight size={16} />
          </div>
        </div>

        <div className="mb-2">
            <p className="text-blue-100/80 text-sm font-medium mb-1">{subtitle}</p>
            <h3 className="text-2xl font-bold text-white w-3/4 leading-tight">{title}</h3>
        </div>
      </div>
    </div>
  );
};