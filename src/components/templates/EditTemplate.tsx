import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '../../store';
import { createTemplate, updateTemplate } from '../../store/slices/templatesSlice';
import { TemplateDTO } from '../../types';
import { FileText, X, AlertCircle } from 'lucide-react';

interface TemplateEditorModalProps {
  isOpen: boolean;
  templateToEdit?: TemplateDTO | null;
  onClose: () => void;
}

export const EditTemplate: React.FC<TemplateEditorModalProps> = ({
  isOpen,
  templateToEdit,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (templateToEdit) {
      setName(templateToEdit.name);
      setSubject(templateToEdit.subject);
      setBody(templateToEdit.body);
    } else {
      setName('');
      setSubject('');
      setBody('');
    }
    setError(null);
  }, [templateToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !subject.trim() || !body.trim()) {
      setError('Please fill in the template name, subject line, and email body.');
      return;
    }

    try {
      if (templateToEdit) {
        await dispatch(
          updateTemplate({
            id: templateToEdit.id,
            data: {
              name: name.trim(),
              subject: subject.trim(),
              body: body.trim(),
            },
          })
        ).unwrap();
      } else {
        await dispatch(
          createTemplate({
            name: name.trim(),
            subject: subject.trim(),
            body: body.trim(),
          })
        ).unwrap();
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save template');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0A2540]">
                {templateToEdit ? 'Edit Template' : 'New Email Template'}
              </h2>
              <p className="text-xs text-slate-500">
                Write a reusable email message for your campaigns
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="px-6 py-2.5 bg-rose-50 border-b border-rose-100 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Template Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Welcome Message, Monthly Newsletter"
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs text-slate-900"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Subject Line *
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Welcome to our community!"
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs text-slate-900"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Email Message *
            </label>
            <textarea
              rows={8}
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type your email message here..."
              className="w-full p-3.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs text-slate-800 leading-relaxed resize-y"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs transition-all active:scale-95"
            >
              {templateToEdit ? 'Save Changes' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

