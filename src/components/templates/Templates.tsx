import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { deleteTemplate } from '../../store/slices/templatesSlice';
import { TemplateDTO } from '../../types';
import { EditTemplate } from './EditTemplate';
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
} from 'lucide-react';

interface TemplateManagerProps {
  onUseTemplateInCampaign: (templateId: string) => void;
}

export const Templates: React.FC<TemplateManagerProps> = ({
  onUseTemplateInCampaign,
}) => {
  const dispatch = useAppDispatch();
  const { templates, defaultTemplates } = useAppSelector((state) => state.templates);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState<TemplateDTO | null>(null);

  const allTemplates: TemplateDTO[] = [
    ...(defaultTemplates || []),
    ...templates.filter((t) => !(defaultTemplates || []).some((d) => d.id === t.id)),
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Email Templates
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
            <span>Dynamic HTML & Plain text email layouts</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{allTemplates.length} templates available</span>
          </div>
        </div>

        <button
          onClick={() => {
            setTemplateToEdit(null);
            setIsEditorOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs transition-all active:scale-[0.98] self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Template</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {allTemplates.map((tmpl) => (
          <div
            key={tmpl.id}
            className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between overflow-hidden group"
          >
            <div className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-bold text-[#0A2540] group-hover:text-emerald-700 transition-colors">
                  {tmpl.name}
                </h3>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] font-mono font-bold text-emerald-800 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200">
                    {tmpl.isDefault ? 'Standard Default' : 'Custom'}
                  </span>
                  {!tmpl.isDefault && (
                    <div className="flex items-center gap-1 ml-1">
                      <button
                        onClick={() => {
                          setTemplateToEdit(tmpl);
                          setIsEditorOpen(true);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit template"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => dispatch(deleteTemplate(tmpl.id))}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-xs text-slate-600">
                <span className="text-slate-400 font-medium">Subject:</span>{' '}
                <span className="font-medium text-slate-800">{tmpl.subject}</span>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                  {tmpl.body.replace(/<[^>]*>?/gm, '')}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <EditTemplate
        isOpen={isEditorOpen}
        templateToEdit={templateToEdit}
        onClose={() => setIsEditorOpen(false)}
      />
    </div>
  );
};

