import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { createCampaign, sendCampaign, scheduleCampaign } from '../../store/slices/campaignsSlice';
import { Send, X, AlertCircle, FileText, Clock, Sparkles } from 'lucide-react';

interface CampaignWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialTemplateId?: string;
}

export const AddCampaign: React.FC<CampaignWizardModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialTemplateId,
}) => {
  const dispatch = useAppDispatch();
  const { templates, defaultTemplates } = useAppSelector((state) => state.templates);
  const { contacts, groups } = useAppSelector((state) => state.contacts);

  const [name, setName] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedGroupName, setSelectedGroupName] = useState('');
  const [dispatchType, setDispatchType] = useState<'immediate' | 'schedule' | 'draft'>('immediate');
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const allAvailableTemplates = Array.from(
    new Map([...defaultTemplates, ...templates].map((t) => [t.id, t])).values()
  );

  const selectedTemplate = allAvailableTemplates.find((t) => t.id === selectedTemplateId);

  const getMinDateTimeLocal = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    const pad = (n: number) => String(n).padStart(2, '0');
    const year = now.getFullYear();
    const month = pad(now.getMonth() + 1);
    const day = pad(now.getDate());
    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  useEffect(() => {
    if (isOpen) {
      setName('');
      setSelectedGroupName(groups[0]?.name || 'ALL');
      setDispatchType('immediate');
      setScheduledDateTime('');
      setIsSubmitting(false);
      setFormError(null);

      if (initialTemplateId) {
        const found = allAvailableTemplates.find((t) => t.id === initialTemplateId);
        setSelectedTemplateId(found ? found.id : '');
      } else {
        setSelectedTemplateId('');
      }
    }
  }, [isOpen, initialTemplateId, groups]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Please enter a campaign name.');
      return;
    }

    if (!selectedTemplateId || !selectedTemplate) {
      setFormError('Please select an email template (required).');
      return;
    }

    const targetGroup = selectedGroupName;
    const targetContactIds = targetGroup === 'ALL'
      ? contacts.map((c) => c.id)
      : contacts.filter((c) => c.groups?.includes(targetGroup)).map((c) => c.id);

    if (targetContactIds.length === 0 && contacts.length > 0) {
      targetContactIds.push(contacts[0].id);
    }

    if (dispatchType === 'schedule') {
      if (!scheduledDateTime) {
        setFormError('Please select a valid scheduled date and time.');
        return;
      }
      const schedTimestamp = new Date(scheduledDateTime).getTime();
      if (isNaN(schedTimestamp) || schedTimestamp <= Date.now()) {
        setFormError('Campaign cannot be scheduled to a past date or time. Please select an upcoming date and time.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const scheduledTimeValue = dispatchType === 'schedule' ? scheduledDateTime : null;

      const created = await dispatch(
        createCampaign({
          name: name.trim(),
          templateId: selectedTemplate.id,
          contactIds: targetContactIds,
          groupIds: targetGroup && targetGroup !== 'ALL' ? [targetGroup] : [],
          scheduledTime: scheduledTimeValue,
          subject: selectedTemplate.subject,
          body: selectedTemplate.body,
        })
      ).unwrap();

      if (dispatchType === 'immediate') {
        try {
          await dispatch(sendCampaign(created.id)).unwrap();
        } catch (sendErr) {
          console.warn('Campaign created, immediate send warning:', sendErr);
        }
      } else if (dispatchType === 'schedule') {
        try {
          await dispatch(
            scheduleCampaign({ id: created.id, scheduledTime: scheduledDateTime })
          ).unwrap();
        } catch (schedErr) {
          console.warn('Campaign created, schedule warning:', schedErr);
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setFormError(typeof err === 'string' ? err : err?.message || 'Failed to create campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Create New Campaign
              </h2>
              <p className="text-xs text-slate-500">
                Select your template and configure recipient dispatch
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

        {formError && (
          <div className="px-6 py-2.5 bg-rose-50 border-b border-rose-100 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto">
          {/* Campaign Name */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Campaign Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. October Product Announcement, Welcome Series"
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs text-slate-900"
            />
          </div>

          {/* Send To Group */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Send To Group *
            </label>
            <select
              value={selectedGroupName}
              onChange={(e) => setSelectedGroupName(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs text-slate-900"
            >
              <option value="ALL">All Contacts ({contacts.length} recipients)</option>
              {groups.map((g) => (
                <option key={g.id} value={g.name}>
                  {g.name} ({contacts.filter((c) => c.groups?.includes(g.name)).length} contacts)
                </option>
              ))}
            </select>
          </div>

          {/* Mandatory Template Selection */}
          <div>
            <label className="font-bold text-slate-700 flex items-center gap-1.5 mb-1">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Email Template *</span>
            </label>
            <select
              required
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs text-slate-900 font-medium"
            >
              <option value="">-- Select a Template (Required) --</option>
              {allAvailableTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Display Template Subject and Body as Text */}
          {selectedTemplate ? (
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Template Subject:
                </span>
                <p className="text-xs font-semibold text-slate-900 mt-1">
                  {selectedTemplate.subject}
                </p>
              </div>
              <div className="border-t border-slate-200/80 pt-3">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Template Content Body:
                </span>
                <div className="bg-white rounded-lg p-3 border border-slate-200 text-xs text-slate-700 whitespace-pre-wrap font-sans max-h-48 overflow-y-auto leading-relaxed">
                  {selectedTemplate.body}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-dashed border-slate-300 text-center text-slate-400 bg-slate-50/50">
              Please select a template above to preview its subject and body.
            </div>
          )}

          {/* When to send */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="font-bold text-slate-700 block">
              When to Send:
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-slate-800">
                <input
                  type="radio"
                  name="dispatchType"
                  value="immediate"
                  checked={dispatchType === 'immediate'}
                  onChange={() => setDispatchType('immediate')}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <span>Send Immediately</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-800">
                <input
                  type="radio"
                  name="dispatchType"
                  value="draft"
                  checked={dispatchType === 'draft'}
                  onChange={() => setDispatchType('draft')}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <span>Save as Draft (Send later)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-800">
                <input
                  type="radio"
                  name="dispatchType"
                  value="schedule"
                  checked={dispatchType === 'schedule'}
                  onChange={() => setDispatchType('schedule')}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <span>Schedule for a Specific Date/Time</span>
              </label>
            </div>

            {dispatchType === 'schedule' && (
              <div className="mt-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="font-bold text-slate-700 flex items-center gap-1.5 text-xs">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Choose Future Date and Time:</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  min={getMinDateTimeLocal()}
                  value={scheduledDateTime}
                  onChange={(e) => setScheduledDateTime(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs text-slate-900"
                />
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedTemplateId}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Processing...</span>
              ) : dispatchType === 'immediate' ? (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Launch Campaign</span>
                </>
              ) : dispatchType === 'schedule' ? (
                <>
                  <Clock className="w-3.5 h-3.5" />
                  <span>Schedule Campaign</span>
                </>
              ) : (
                <span>Save Draft</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
