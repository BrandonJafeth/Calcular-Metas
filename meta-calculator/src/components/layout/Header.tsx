import React from 'react';
import { Menu, Calendar } from 'lucide-react';

interface HeaderProps {
  date: string;
  onDateChange: (date: string) => void;
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ date, onDateChange, onMenuClick }) => {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between lg:px-8">
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-md"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2 text-gray-500">
          <Calendar className="w-5 h-5" />
          <span className="hidden sm:inline text-sm font-medium">Fecha de Sesión:</span>
        </div>
      </div>

      <input 
        type="date" 
        value={date}
        onChange={(e) => onDateChange(e.target.value)}
        className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
      />
    </header>
  );
};
