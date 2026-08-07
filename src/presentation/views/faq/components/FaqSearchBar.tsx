import React from 'react';
import { Search } from 'lucide-react';
import { FAQ_TEXT } from '../constant/faqText';
import { FAQ_SEMANTIC_ID } from '../constant/faqSemanticId';

interface FaqSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  loading: boolean;
}

export const FaqSearchBar: React.FC<FaqSearchBarProps> = ({ value, onChange, loading }) => {
  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-slate-400 dark:text-slate-550" />
      </div>
      <input
        id={FAQ_SEMANTIC_ID.SEARCH_INPUT}
        type="text"
        placeholder={FAQ_TEXT.SEARCH_PLACEHOLDER}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full pl-11 pr-12 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-sm font-medium"
      />
      {loading && (
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
          <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

export default FaqSearchBar;
