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
  RotateCcw,
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
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [selectedGroupName, setSelectedGroupName] = useState('ALL');
  const [dispatchAction, setDispatchAction] = useState<'keep' | 'immediate' | 'schedule' | 'draft'>('keep');
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const allAvailableTemplates = Array.from(
    new Map([...defaultTemplates, ...templates].map((t) => [t.id, t])).values()
  );

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
      setSubject(campaign.subject || '');
      setBody(campaign.body || '');
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

  const handleTemplateChange = (tmplId: string) => {
    setSelectedTemplateId(tmplId);
    if (tmplId) {
      const found = allAvailableTemplates.find((t) => t.id === tmplId);
      if (found) {
        setSubject(found.subject);
        setBody(found.body);
      }
    }
  };

  const handlePopulateTemplate = () => {
    if (!selectedTemplateId) return;
    const found = allAvailableTemplates.find((t) => t.id === selectedTemplateId);
    if (found) {
      setSubject(found.subject);
      setBody(found.body);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Please enter a campaign name.');
      return;
    }

    if (!subject.trim()) {
      setFormError('Please enter an email subject line.');
      return;
    }

    if (!body.trim()) {
      setFormError('Please enter the email content / body.');
      return;
    }

    // Determine target contacts from group (if not already sent)
    let targetContactIds: string[] = campaign.contactIds || [];
    let groupIds: string[] = campaign.groupIds || [];

    if (!isSent) {
      const targetGroup = selectedGroupName;
      targetContactIds =
        targetGroup === 'ALL'
          ? contacts.map((c) => c.id)
          : contacts.filter((c) => c.groups?.includes(targetGroup)).map((c) => c.id);

      if (targetContactIds.length === 0 && contacts.length > 0) {
        targetContactIds = [contacts[0].id];
      }
      groupIds = targetGroup && targetGroup !== 'ALL' ? [targetGroup] : [];
    }

    // Scheduling validation
    if (!isSent && dispatchAction === 'schedule') {
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
      const newStatus =
        isSent
          ? campaign.status
          : dispatchAction === 'schedule'
          ? 'SCHEDULED'
          : dispatchAction === 'immediate'
          ? 'SENT'
          : 'DRAFT';

      const updatedScheduleTime =
        dispatchAction === 'schedule' ? new Date(scheduledDateTime).toISOString() : null;

      // 1. Update basic campaign fields
      await dispatch(
        updateCampaign({
          id: campaign.id,
          data: {
            name: name.trim(),
            subject: subject.trim(),
            body: body.trim(),
            templateId: selectedTemplateId || undefined,
            contactIds: !isSent ? targetContactIds : undefined,
            groupIds: !isSent ? groupIds : undefined,
            status: dispatchAction === 'immediate' ? campaign.status : newStatus,
            scheduledTime: updatedScheduleTime,
          },
        })
      ).unwrap();

      // 2. Handle dispatch action transitions
      if (!isSent) {
        if (dispatchAction === 'immediate') {
          await dispatch(sendCampaign(campaign.id)).unwrap();
        } else if (dispatchAction === 'schedule') {
          await dispatch(
            scheduleCampaign({ id: campaign.id, scheduledTime: new Date(scheduledDateTime).toISOString() })
          ).unwrap();
        } else if (dispatchAction === 'draft' && campaign.status === 'SCHEDULED') {
          await dispatch(cancelCampaign(campaign.id)).unwrap();
        }
      }

      await dispatch(fetchCampaignDetails(campaign.id));
      onSuccess();
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
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
                Modify campaign settings, target recipients, and content
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

        {isSent && (
          <div className="px-6 py-2.5 bg-amber-50/80 border-b border-amber-200/80 text-xs text-amber-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              This campaign has already been dispatched. You can modify its name, subject, and content for your archives and reporting.
            </span>
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

          {/* Select Recipient Group */}
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

          {/* Select Template (OPTIONAL) */}
          <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Email Template</span>
                <span className="font-normal text-[11px] text-slate-500">(Optional)</span>
              </label>

              {selectedTemplateId && (
                <button
                  type="button"
                  onClick={handlePopulateTemplate}
                  className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline cursor-pointer"
                  title="Reload template subject and body text into inputs"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Re-populate text</span>
                </button>
              )}
            </div>

            <select
              value={selectedTemplateId}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs text-slate-900"
            >
              <option value="">-- No Template (Custom Email) --</option>
              {allAvailableTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} (Subject: {t.subject})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500">
              Selecting a template will populate subject and content. You can modify them as needed.
            </p>
          </div>

          {/* Email Subject Line */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Email Subject *
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Exclusive Update for {{firstName}} from CampaignPro"
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs text-slate-900"
            />
          </div>

          {/* Email Content / Body */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Email Content / Body *
            </label>
            <textarea
              required
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type your email content here (supports text or HTML markup)..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs text-slate-900 font-sans leading-relaxed resize-y"
            />
          </div>

          {/* Dispatch Options for Draft / Scheduled campaigns */}
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
                  <span>Schedule for Specific Date & Time</span>
                </label>

                {dispatchAction === 'schedule' && (
                  <div className="pl-6 pt-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                      <input
                        type="datetime-local"
                        required={dispatchAction === 'schedule'}
                        min={getMinDateTimeLocal()}
                        value={scheduledDateTime}
                        onChange={(e) => {
                          const val = e.target.value;
                          setScheduledDateTime(val);
                          if (val) {
                            const t = new Date(val).getTime();
                            if (!isNaN(t) && t <= Date.now()) {
                              setFormError('Cannot schedule to a past date or time. Please select an upcoming date and time.');
                            } else {
                              setFormError(null);
                            }
                          }
                        }}
                        className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600"
                      />
                    </div>
                    {scheduledDateTime && new Date(scheduledDateTime).getTime() <= Date.now() ? (
                      <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>Past date/time selected! Please select an upcoming date and time.</span>
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-500">
                        Campaign will automatically dispatch when this time is reached.
                      </p>
                    )}
                  </div>
                )}

                <label className="flex items-center gap-2 cursor-pointer text-slate-800">
                  <input
                    type="radio"
                    name="editDispatchType"
                    value="immediate"
                    checked={dispatchAction === 'immediate'}
                    onChange={() => setDispatchAction('immediate')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Send Immediately (Save changes and dispatch right now)</span>
                </label>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isSubmitting ||
                (!isSent && dispatchAction === 'schedule' && (!scheduledDateTime || new Date(scheduledDateTime).getTime() <= Date.now()))
              }
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
            >
              {dispatchAction === 'immediate' ? (
                <Send className="w-3.5 h-3.5" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>
                {isSubmitting
                  ? 'Saving Changes...'
                  : dispatchAction === 'immediate'
                  ? 'Save & Dispatch Now'
                  : 'Save Campaign Changes'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const CampaignEditModal = EditCampaign;

