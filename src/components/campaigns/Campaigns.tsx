import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  setFilterStatus,
  setSearchQuery,
  sendCampaign,
  cancelCampaign,
  deleteCampaign,
  setSelectedCampaign
} from '../../store/slices/campaignsSlice';
import { CampaignDTO, CampaignStatus } from '../../types';
import {
  Search,
  Plus,
  Send,
  Calendar,
  Clock,
  Trash2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  X,
  Play,
  ArrowUpRight,
  Edit3
} from 'lucide-react';

interface CampaignListProps {
  onOpenNewCampaign: () => void;
  onViewCampaign: (campaign: CampaignDTO) => void;
  onEditCampaign: (campaign: CampaignDTO) => void;
}

export const Campaigns: React.FC<CampaignListProps> = ({
  onOpenNewCampaign,
  onViewCampaign,
  onEditCampaign,
}) => {
  const dispatch = useAppDispatch();
  const { campaigns, filterStatus, searchQuery, isLoading, isSending } = useAppSelector(
    (state) => state.campaigns
  );

  const [confirmSendId, setConfirmSendId] = useState<string | null>(null);

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesStatus = filterStatus === 'ALL' || c.status === filterStatus;
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.subject && c.subject.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const handleSendNow = async (id: string) => {
    await dispatch(sendCampaign(id));
    setConfirmSendId(null);
  };

  const statusFilters: Array<{ id: 'ALL' | CampaignStatus; label: string; count?: number }> = [
    { id: 'ALL', label: 'All Campaigns', count: campaigns.length },
    { id: 'SENT', label: 'Sent', count: campaigns.filter((c) => c.status === 'SENT').length },
    { id: 'SCHEDULED', label: 'Scheduled', count: campaigns.filter((c) => c.status === 'SCHEDULED').length },
    { id: 'DRAFT', label: 'Drafts', count: campaigns.filter((c) => c.status === 'DRAFT').length },
    { id: 'FAILED', label: 'Failed', count: campaigns.filter((c) => c.status === 'FAILED').length },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#0A2540]">
            Campaign Management
          </h1>
        </div>

        <button
          onClick={onOpenNewCampaign}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs transition-all active:scale-[0.98] self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Campaign</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        <div className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-xl overflow-x-auto border border-slate-200">
          {statusFilters.map((tab) => {
            const isActive = filterStatus === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => dispatch(setFilterStatus(tab.id))}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-700 hover:text-emerald-800 hover:bg-white/80'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`font-mono text-[10px] tabular-nums ${isActive ? 'text-emerald-100' : 'text-slate-500'}`}>
                  ({tab.count})
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => dispatch(setSearchQuery(e.target.value))}
            placeholder="Search campaigns or subjects..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition-all text-slate-900"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3">Campaign & Subject</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Recipients</th>
                <th className="px-4 py-3 text-right">Sent / Delivered</th>
                <th className="px-4 py-3">Schedule / Sent Time</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <p className="text-sm font-semibold text-slate-600">No campaigns found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchQuery
                        ? 'Try clearing the search query or changing filters'
                        : 'Click "New Campaign" to create your first dispatch'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCampaigns.map((camp) => (
                  <tr
                    key={camp.id}
                    className="hover:bg-emerald-50/20 transition-colors cursor-pointer group"
                    onClick={() => onViewCampaign(camp)}
                  >
                    {/* Name & Subject */}
                    <td className="px-5 py-4 font-medium text-slate-900 max-w-sm">
                      <div className="font-bold text-[#0A2540] group-hover:text-emerald-700 transition-colors">
                        {camp.name}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {camp.subject || 'No subject configured'}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`font-bold text-[11px] inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md ${
                          camp.status === 'SENT'
                            ? 'text-emerald-800 bg-emerald-50 border border-emerald-200'
                            : camp.status === 'SCHEDULED'
                            ? 'text-blue-800 bg-blue-50 border border-blue-200'
                            : camp.status === 'FAILED'
                            ? 'text-rose-800 bg-rose-50 border border-rose-200'
                            : 'text-slate-700 bg-slate-100 border border-slate-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            camp.status === 'SENT'
                              ? 'bg-emerald-600'
                              : camp.status === 'SCHEDULED'
                              ? 'bg-blue-600'
                              : camp.status === 'FAILED'
                              ? 'bg-rose-600'
                              : 'bg-slate-400'
                          }`}
                        />
                        <span>{camp.status}</span>
                      </span>
                    </td>

                    {/* Total Recipients */}
                    <td className="px-4 py-4 text-right font-mono tabular-nums text-slate-700 font-semibold">
                      {camp.totalRecipients}
                    </td>

                    {/* Sent & Delivered Counts */}
                    <td className="px-4 py-4 text-right font-mono tabular-nums">
                      {camp.sentCount > 0 ? (
                        <span className="text-emerald-700 font-bold">
                          {camp.sentCount - camp.failedCount} / {camp.sentCount}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Schedule / Timestamp */}
                    <td className="px-4 py-4 text-slate-600 text-[11px]">
                      {camp.status === 'SCHEDULED' && camp.scheduledTime ? (
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 font-semibold text-blue-800">
                            <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>
                              {new Date(camp.scheduledTime).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}{' '}
                              at{' '}
                              {new Date(camp.scheduledTime).toLocaleTimeString(undefined, {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <div className="text-[10px] text-blue-600 flex items-center gap-1">
                            {new Date(camp.scheduledTime).getTime() <= Date.now() ? (
                              <span className="text-amber-700 font-bold bg-amber-50 px-1 rounded">
                                Processing dispatch...
                              </span>
                            ) : (
                              <span className="text-slate-500">
                                Dispatches automatically at scheduled time
                              </span>
                            )}
                          </div>
                        </div>
                      ) : camp.sentTime ? (
                        <div className="flex items-center gap-1.5 font-medium text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>
                            {new Date(camp.sentTime).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}{' '}
                            at{' '}
                            {new Date(camp.sentTime).toLocaleTimeString(undefined, {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      ) : camp.scheduledTime ? (
                        <div className="flex items-center gap-1.5 font-mono text-slate-600">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            {new Date(camp.scheduledTime).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}{' '}
                            at{' '}
                            {new Date(camp.scheduledTime).toLocaleTimeString(undefined, {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono">Not dispatched</span>
                      )}
                    </td>

                    {/* Row Action Controls */}
                    <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {(camp.status === 'DRAFT' || camp.status === 'SCHEDULED') && (
                          <button
                            onClick={() => setConfirmSendId(camp.id)}
                            className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                            title={camp.status === 'SCHEDULED' ? 'Dispatch scheduled campaign now' : 'Send campaign now'}
                          >
                            <Send className="w-3 h-3 stroke-[2.5]" />
                            <span>Send Now</span>
                          </button>
                        )}

                        {camp.status === 'SCHEDULED' && (
                          <button
                            onClick={() => dispatch(cancelCampaign(camp.id))}
                            className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1"
                            title="Revert to draft"
                          >
                            <X className="w-3 h-3" />
                            <span>Cancel Schedule</span>
                          </button>
                        )}

                        {(camp.status === 'DRAFT' || camp.status === 'SCHEDULED') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditCampaign(camp);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-[#0A2540] hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-1 border border-slate-200 hover:border-emerald-300"
                            title="Edit campaign details, content, or schedule"
                          >
                            <Edit3 className="w-3 h-3 text-slate-500" />
                            <span>Edit</span>
                          </button>
                        )}

                        <button
                          onClick={() => onViewCampaign(camp)}
                          className="px-2.5 py-1 text-xs font-semibold text-[#0A2540] hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-1 border border-slate-200 hover:border-emerald-300"
                          title="View delivery status & activity tracking"
                        >
                          <Eye className="w-3 h-3 text-slate-500" />
                          <span>Inspect</span>
                        </button>

                        {camp.status !== 'SENT' && (
                          <button
                            onClick={() => dispatch(deleteCampaign(camp.id))}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete campaign"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {confirmSendId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A2540]/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                <Send className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0A2540]">
                  Dispatch Email Campaign?
                </h3>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmSendId(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSending}
                onClick={() => handleSendNow(confirmSendId)}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
              >
                {isSending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>{isSending ? 'Sending...' : 'Confirm & Dispatch'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const CampaignList = Campaigns;
