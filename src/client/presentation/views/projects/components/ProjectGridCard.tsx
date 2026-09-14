'use client';


import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  Code2,
  MoreVertical,
  ExternalLink,
  Edit2,
  Copy,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { Project } from '@/src/client/domain/project/entity/project';
import { StatusSwitch } from '@/src/client/presentation/components/shared/StatusSwitch';
import { formatDate } from '@/src/core/utils/date';
import { PROJECTS_TEXT } from '../constant';

interface ProjectGridCardProps {
  project: Project;
  onNavigateDetail: () => void;
  onToggleStatus: (id: string) => void;
  onEdit: (project: Project) => void;
  onDuplicate: (project: Project) => void;
  onRestore: (id: string) => void;
  onSoftDelete: (id: string) => void;
  onHardDeleteRequest: (project: { id: string; name: string; isPermanent: boolean }) => void;
}

export const ProjectGridCard: React.FC<ProjectGridCardProps> = ({
  project,
  onNavigateDetail,
  onToggleStatus,
  onEdit,
  onDuplicate,
  onRestore,
  onSoftDelete,
  onHardDeleteRequest,
}) => {
  return (
    <div
      onClick={onNavigateDetail}
      data-tour="project-item"
      className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500/80 dark:hover:border-purple-500/80 rounded-2xl p-5 shadow-xs transition-all space-y-4 flex flex-col justify-between cursor-pointer"
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
              <Code2 className="w-4 h-4" />
            </div>
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-slate-100 hover:text-purple-400 truncate transition-colors">
              {project.name}
            </h3>
          </div>

          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <StatusSwitch
              checked={project.status}
              onCheckedChange={() => onToggleStatus(project.id)}
              size="sm"
              disabled={!!project.deletedAt}
            />

            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button type="button" className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  className="w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1 shadow-xl z-50 text-xs text-slate-700 dark:text-slate-300 space-y-0.5"
                >
                  <DropdownMenu.Item
                    onClick={onNavigateDetail}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{PROJECTS_TEXT.ACTION_OPEN_DETAIL}</span>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    onClick={() => onEdit(project)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>{PROJECTS_TEXT.ACTION_EDIT_DETAILS}</span>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    onClick={() => onDuplicate(project)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{PROJECTS_TEXT.ACTION_DUPLICATE}</span>
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                  {project.deletedAt ? (
                    <>
                      <DropdownMenu.Item
                        onClick={() => onRestore(project.id)}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{PROJECTS_TEXT.ACTION_RESTORE}</span>
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        onClick={() =>
                          onHardDeleteRequest({ id: project.id, name: project.name, isPermanent: true })
                        }
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer font-medium"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{PROJECTS_TEXT.ACTION_PERMANENTLY_DELETE}</span>
                      </DropdownMenu.Item>
                    </>
                  ) : (
                    <DropdownMenu.Item
                      onClick={() => onSoftDelete(project.id)}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{PROJECTS_TEXT.ACTION_SOFT_DELETE}</span>
                    </DropdownMenu.Item>
                  )}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 min-h-8">
          {project.description || PROJECTS_TEXT.NO_DESCRIPTION}
        </p>
      </div>

      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-mono text-slate-500 gap-2">
        <span className="text-[10px] shrink-0">{formatDate(project.createdAt)}</span>
        {project.pics && project.pics.length > 0 && (
          <div className="flex flex-wrap gap-1 justify-end max-w-[70%]">
            {project.pics.map((pic) => (
              <span
                key={pic.id}
                className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-sans font-medium truncate max-w-25"
                title={`${pic.name} (@${pic.username})`}
              >
                {pic.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};