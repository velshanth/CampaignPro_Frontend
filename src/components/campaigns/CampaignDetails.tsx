import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchCampaignDetails,
  retryFailedDeliveries,
  sendCampaign,
  cancelCampaign
} from '../../store/slices/campaignsSlice';
import { CampaignDTO, DeliveryStatus } from '../../types';
import {
  ArrowLeft,
  Send,
  RefreshCw,
  Clock,
  Calendar,
  X,
  Edit3
} from 'lucide-react';

interface CampaignDetailViewProps {
  campaign: CampaignDTO;
  onBack: () => void;
  onEditCampaign: (campaign: CampaignDTO) => void;
}

export const CampaignDetails: React.FC<CampaignDetailViewProps> = ({
  campaign,
  onBack,
  onEditCampaign,
}) => {
  const dispatch = useAppDispatch();
  const { deliveries, activities, campaignAnalytics, isSending } = useAppSelector(
    (state) => state.campaigns
  );

  const [deliveryFilter, setDeliveryFilter] = useState<'ALL' | DeliveryStatus>('ALL');
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    dispatch(fetchCampaignDetails(campaign.id));
  }, [dispatch, campaign.id]);

  const handleRetry = async () => {
    setIsRetrying(true);
    await dispatch(retryFailedDeliveries(campaign.id));
    setIsRetrying(false);
  };

  const filteredDeliveries = deliveries.filter((d) => {
    if (deliveryFilter === 'ALL') return true;
    return d.status === deliveryFilter;
  });

  const failedCount = deliveries.filter((d) => d.status === 'FAILED' || d.status === 'BOUNCED').length;
  const deliveredCount = deliveries.filter((d) => d.status === 'DELIVERED').length;
  const opensCount = activities.filter((a) => a.type === 'OPEN').length;
  const clicksCount = activities.filter((a) => a.type === 'CLICK').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
            title="Back to Campaigns list"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 leading-tight">
                {campaign.name}
              </h1>
              <span
                className={`text-xs font-semibold ${
                  campaign.status === 'SENT'
                    ? 'text-emerald-700'
                    : campaign.status === 'SCHEDULED'
                    ? 'text-blue-700'
                    : campaign.status === 'FAILED'
                    ? 'text-rose-700'
                    : 'text-slate-600'
                }`}
              >
                ● {campaign.status}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5 truncate max-w-xl">
              Subject: <span className="text-slate-700 font-medium">{campaign.subject}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(campaign.status === 'DRAFT' || campaign.status === 'SCHEDULED') && (
            <button
              onClick={() => onEditCampaign(campaign)}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 hover:text-emerald-700 hover:border-emerald-300 border border-slate-300 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Edit campaign settings, audience, or content"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit Campaign</span>
            </button>
          )}

          {(campaign.status === 'DRAFT' || campaign.status === 'SCHEDULED') && (
            <button
              onClick={() => dispatch(sendCampaign(campaign.id))}
              disabled={isSending}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? 'Sending...' : 'Send Campaign Now'}</span>
            </button>
          )}

          {campaign.status === 'SCHEDULED' && (
            <button
              onClick={() => dispatch(cancelCampaign(campaign.id))}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel Schedule</span>
            </button>
          )}

          {failedCount > 0 && (
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="px-3.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>Retry Failed ({failedCount})</span>
            </button>
          )}
        </div>
      </div>

      {campaign.status === 'SCHEDULED' && (
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50/60 to-blue-50 border border-blue-200/90 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Clock className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
                  Scheduled Automated Email
                </span>
                <span className="text-[10px] font-mono font-semibold bg-blue-100/90 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">
                  Auto-delivery active
                </span>
              </div>
              <div className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>
                  Scheduled for{' '}
                  <span className="text-blue-900 font-mono">
                    {campaign.scheduledTime
                      ? `${new Date(campaign.scheduledTime).toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })} at ${new Date(campaign.scheduledTime).toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}`
                      : 'Scheduled Time'}
                  </span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                All recipients below are queued. The campaign will automatically dispatch as soon as the scheduled time arrives.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block">
            Recipients
          </span>
          <div className="text-xl font-black font-mono tabular-nums text-[#0A2540] mt-1">
            {campaign.totalRecipients}
          </div>
          <span className="text-[11px] text-slate-500">Target audience</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide block">
            Delivered
          </span>
          <div className="text-xl font-black font-mono tabular-nums text-emerald-700 mt-1">
            {deliveredCount}
          </div>
          <span className="text-[11px] text-slate-500">
            {(campaignAnalytics?.deliveryRate != null ? Number(campaignAnalytics.deliveryRate) : (deliveredCount > 0 ? 100 : 0)).toFixed(2)}% rate
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-xs font-bold text-[#0A2540] uppercase tracking-wide block">
            Unique Opens
          </span>
          <div className="text-xl font-black font-mono tabular-nums text-emerald-700 mt-1">
            {opensCount}
          </div>
          <span className="text-[11px] text-slate-500">
            {(campaignAnalytics?.openRate != null ? Number(campaignAnalytics.openRate) : (deliveredCount > 0 ? (opensCount / deliveredCount) * 100 : 0)).toFixed(2)}% rate
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-xs font-bold text-blue-900 uppercase tracking-wide block">
            Link Clicks
          </span>
          <div className="text-xl font-black font-mono tabular-nums text-blue-700 mt-1">
            {clicksCount}
          </div>
          <span className="text-[11px] text-slate-500">
            {(campaignAnalytics?.clickRate != null ? Number(campaignAnalytics.clickRate) : (opensCount > 0 ? (clicksCount / opensCount) * 100 : 0)).toFixed(2)}% CTR
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block">
            Failures
          </span>
          <div className={`text-xl font-black font-mono tabular-nums mt-1 ${failedCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {failedCount}
          </div>
          <span className="text-[11px] text-slate-500">
            {failedCount > 0 ? 'Retry eligible' : 'Zero bounces'}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Email Deliveries
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Transmission records and recipient delivery states ({deliveries.length} total)
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 mr-1">Filter:</span>
            {(['ALL', 'SCHEDULED', 'DELIVERED', 'SENT', 'FAILED', 'PENDING'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setDeliveryFilter(st)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  deliveryFilter === st
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 text-slate-500 border-b border-slate-200 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-5 py-3">Recipient</th>
                    <th className="px-4 py-3">Delivery Status</th>
                    <th className="px-4 py-3">Scheduled For</th>
                    <th className="px-4 py-3">Sent / Delivered At</th>
                    <th className="px-4 py-3 text-center">Retries</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredDeliveries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-slate-400">
                        No delivery logs recorded for this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredDeliveries.map((del) => (
                      <tr key={del.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-slate-900">
                            {del.contactName || del.email}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {del.email}
                          </div>
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {del.status === 'SCHEDULED' ? (
                            <span className="font-bold text-[11px] inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-blue-800 bg-blue-50 border border-blue-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                              <span>SCHEDULED</span>
                            </span>
                          ) : (
                            <span
                              className={`font-semibold text-[11px] ${
                                del.status === 'DELIVERED'
                                  ? 'text-emerald-700'
                                  : del.status === 'SENT'
                                  ? 'text-blue-700'
                                  : del.status === 'FAILED'
                                  ? 'text-rose-700'
                                  : 'text-slate-600'
                              }`}
                            >
                              ● {del.status}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap font-mono text-[11px]">
                          {del.scheduledAt || campaign.scheduledTime ? (
                            <div className="flex items-center gap-1.5 text-blue-800 font-semibold">
                              <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span>
                                {new Date(del.scheduledAt || campaign.scheduledTime!).toLocaleDateString([], {
                                  month: 'short',
                                  day: 'numeric',
                                })}{' '}
                                at{' '}
                                {new Date(del.scheduledAt || campaign.scheduledTime!).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap font-mono text-[11px]">
                          {del.deliveredAt ? (
                            <span className="text-emerald-700 font-medium">
                              {new Date(del.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          ) : del.sentAt ? (
                            <span className="text-blue-700 font-medium">
                              {new Date(del.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          ) : del.status === 'SCHEDULED' ? (
                            <span className="text-slate-400 italic">Pending scheduled dispatch</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-center font-mono tabular-nums text-slate-600">
                          {del.retryCount}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

