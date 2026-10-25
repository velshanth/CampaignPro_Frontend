import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  updateCampaign,
  sendCampaign,
  scheduleCampaign,
  cancelCampaign,
  fetchCampaignDetails
} from '../../store/slices/campaignsSlice';
import { CampaignDTO } from '../../types';
import {
  X,
  Edit3,
  AlertCircle,
  FileText,
  Clock,
  Send,
  Save,
  CheckCircle2,
  Calendar
} from 'lucide-react';

interface CampaignEditModalProps {
  isOpen: boolean;
  campaign: CampaignDTO | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditCampaign: React.FC<CampaignEditModalProps> = ({
  isOpen,
  campaign,
  onClose,
  onSuccess,
}) => {
  const dispatch = useAppDispatch();
  const { templates, defaultTemplates } = useAppSelector((state) => state.templates);
  const { contacts, groups } = useAppSelector((state) => state.contacts);

  const [name, setName] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedGroupName, setSelectedGroupName] = useState('ALL');
  const [dispatchAction, setDispatchAction] = useState<'keep' | 'immediate' | 'schedule' | 'draft'>('keep');
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

  const formatDateTimeForInput = (isoStr?: string | null) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return '';
      const pad = (n: number) => String(n).padStart(2, '0');
      const year = d.getFullYear();
      const month = pad(d.getMonth() + 1);
      const day = pad(d.getDate());
      const hours = pad(d.getHours());
      const minutes = pad(d.getMinutes());
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return '';
    }
  };

  useEffect(() => {
    if (isOpen && campaign) {
      setName(campaign.name || '');
      setSelectedTemplateId(campaign.templateId || '');

      const initialGroup = campaign.groupIds && campaign.groupIds.length > 0 ? campaign.groupIds[0] : 'ALL';
      setSelectedGroupName(initialGroup);

      if (campaign.status === 'SCHEDULED') {
        setDispatchAction('schedule');
        setScheduledDateTime(formatDateTimeForInput(campaign.scheduledTime));
      } else if (campaign.status === 'DRAFT') {
        setDispatchAction('draft');
        setScheduledDateTime('');
      } else {
        setDispatchAction('keep');
        setScheduledDateTime('');
      }

      setIsSubmitting(false);
      setFormError(null);
    }
  }, [isOpen, campaign]);

  if (!isOpen || !campaign || (campaign.status !== 'DRAFT' && campaign.status !== 'SCHEDULED')) return null;

  const isSent = false;

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

    if (dispatchAction === 'schedule') {
      if (!scheduledDateTime) {
        setFormError('Please choose a valid upcoming date & time.');
        return;
      }
      const schedTimestamp = new Date(scheduledDateTime).getTime();
      if (isNaN(schedTimestamp) || schedTimestamp <= Date.now()) {
        setFormError('Campaign cannot be scheduled in the past. Choose a future date & time.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      let targetContactIds: string[] = [];
      let groupIds: string[] = [];

      if (!isSent) {
        if (selectedGroupName === 'ALL') {
          targetContactIds = contacts.map((c) => c.id);
          groupIds = [];
        } else {
          targetContactIds = contacts
            .filter((c) => c.groups && c.groups.includes(selectedGroupName))
            .map((c) => c.id);
          groupIds = [selectedGroupName];
        }

        if (targetContactIds.length === 0 && contacts.length > 0) {
          targetContactIds.push(contacts[0].id);
        }
      }

      const newStatus =
        dispatchAction === 'schedule'
          ? 'SCHEDULED'
          : dispatchAction === 'immediate'
          ? 'SENT'
          : 'DRAFT';

      const updatedScheduleTime =
        dispatchAction === 'schedule' ? new Date(scheduledDateTime).toISOString() : null;

      await dispatch(
        updateCampaign({
          id: campaign.id,
          data: {
            name: name.trim(),
            subject: selectedTemplate.subject,
            body: selectedTemplate.body,
            templateId: selectedTemplate.id,
            contactIds: !isSent ? targetContactIds : undefined,
            groupIds: !isSent ? groupIds : undefined,
            status: dispatchAction === 'immediate' ? campaign.status : newStatus,
            scheduledTime: updatedScheduleTime,
          },
        })
      ).unwrap();

      if (!isSent) {
        if (dispatchAction === 'immediate') {
          try {
            await dispatch(sendCampaign(campaign.id)).unwrap();
          } catch (sendErr) {
            console.warn('Immediate dispatch warning on edit:', sendErr);
          }
        } else if (dispatchAction === 'schedule') {
          try {
            await dispatch(
              scheduleCampaign({ id: campaign.id, scheduledTime: new Date(scheduledDateTime).toISOString() })
            ).unwrap();
          } catch (schedErr) {
            console.warn('Schedule warning on edit:', schedErr);
          }
        } else if (dispatchAction === 'draft' && campaign.status === 'SCHEDULED') {
          try {
            await dispatch(cancelCampaign(campaign.id)).unwrap();
          } catch (cancelErr) {
            console.warn('Cancel schedule warning on edit:', cancelErr);
          }
        }
      }

      await dispatch(fetchCampaignDetails(campaign.id));
      onSuccess();
      onClose();
    } catch (err: any) {
      setFormError(typeof err === 'string' ? err : err.message || 'Failed to update campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#0A2540]">Edit Campaign</h2>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    campaign.status === 'SCHEDULED'
                      ? 'bg-blue-50 text-blue-800 border border-blue-200'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {campaign.status}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Update campaign settings, template, and dispatch timing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
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
              placeholder="e.g. October Product Announcement"
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs text-slate-900"
            />
          </div>

          {!isSent ? (
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
          ) : (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-700 block">Recipients Dispatched:</span>
              <p className="text-slate-600 mt-0.5">
                Sent to <span className="font-bold text-[#0A2540]">{campaign.totalRecipients}</span> contacts ({campaign.sentCount - campaign.failedCount} delivered).
              </p>
            </div>
          )}

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

          {!isSent && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="font-bold text-slate-700 block">
                Dispatch Status / Schedule:
              </label>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-slate-800">
                  <input
                    type="radio"
                    name="editDispatchType"
                    value="draft"
                    checked={dispatchAction === 'draft'}
                    onChange={() => setDispatchAction('draft')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Save as Draft (Do not schedule or send yet)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-800">
                  <input
                    type="radio"
                    name="editDispatchType"
                    value="schedule"
                    checked={dispatchAction === 'schedule'}
                    onChange={() => setDispatchAction('schedule')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Schedule for a Specific Date/Time</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-800">
                  <input
                    type="radio"
                    name="editDispatchType"
                    value="immediate"
                    checked={dispatchAction === 'immediate'}
                    onChange={() => setDispatchAction('immediate')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-bold text-emerald-800">Send Immediately Now</span>
                </label>
              </div>

              {dispatchAction === 'schedule' && (
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
          )}

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
                <span>Saving...</span>
              ) : dispatchAction === 'immediate' ? (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Campaign Now</span>
                </>
              ) : dispatchAction === 'schedule' ? (
                <>
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Update Schedule</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
