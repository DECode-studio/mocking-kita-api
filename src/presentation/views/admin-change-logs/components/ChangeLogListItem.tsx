'use client';

import React from 'react';
import { Eye, Database, Activity, FileCode2 } from 'lucide-react';
import { formatDate } from '@/src/core/utils/date';
import { ChangeLogEntry } from '../hook/useAdminChangeLogs';
import { ChangeLogActionBadge } from './ChangeLogActionBadge';
import { CHANGE_LOGS_ADMIN_TEXT, CHANGE_LOGS_ADMIN_SEMANTIC_ID } from '../constant';

interface ChangeLogListItemProps {
  log: ChangeLogEntry;
  onViewDetails: (log: ChangeLogEntry) => void;
}

export const ChangeLogListItem: React.FC<ChangeLogListItemProps> = ({
  log,
  onViewDetails,
}) => {
  const getEntityTypeIcon = (type: ChangeLogEntry['entity_type']) => {
    switch (type) {
      case 'database':
        return <Database className="w-4 h-4 text-slate-500" />;
      case 'project':
        return <Activity className="w-4 h-4 text-indigo-500" />;
      default:
        return <FileCode2 className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <tr
      id={CHANGE_LOGS_ADMIN_SEMANTIC_ID.LOG_CARD}
      className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition"
    >
      <td className="py-3.5 px-4.5 whitespace-nowrap text-xs text-slate-400 dark:text-slate-500 font-medium">
        {formatDate(log.created_at)}
      </td>
      <td className="py-3.5 px-4.5 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs uppercase">
            {log.operator.charAt(0)}
          </span>
          <span className="font-medium text-slate-900 dark:text-slate-200">{log.operator}</span>
        </div>
      </td>
      <td className="py-3.5 px-4.5 whitespace-nowrap">
        <ChangeLogActionBadge action={log.action} />
      </td>
      <td className="py-3.5 px-4.5 whitespace-nowrap">
        <div className="flex items-center gap-1.5 capitalize text-xs">
          {getEntityTypeIcon(log.entity_type)}
          <span>{log.entity_type.replace('_', ' ')}</span>
        </div>
      </td>
      <td className="py-3.5 px-4.5 max-w-sm truncate text-slate-900 dark:text-slate-100 font-medium">
        {log.description}
      </td>
      <td className="py-3.5 px-4.5 text-right whitespace-nowrap">
        <button
          onClick={() => onViewDetails(log)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          {CHANGE_LOGS_ADMIN_TEXT.DETAILS}
        </button>
      </td>
    </tr>
  );
};
