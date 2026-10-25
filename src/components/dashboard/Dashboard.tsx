import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchOverviewAnalytics } from '../../store/slices/analyticsSlice';
import { fetchCampaigns } from '../../store/slices/campaignsSlice';
import { fetchContactsAndGroups } from '../../store/slices/contactsSlice';
import {
  Users,
  FileText,
  Plus,
  ArrowRight
} from 'lucide-react';
import { CampaignDTO } from '../../types';

interface OverviewDashboardProps {
  onNavigateTab: (tab: string) => void;
  onOpenNewCampaign: () => void;
  onViewCampaign: (campaign: CampaignDTO) => void;
}

export const Dashboard: React.FC<OverviewDashboardProps> = ({
  onNavigateTab,
  onOpenNewCampaign,
  onViewCampaign,
}) => {
  const dispatch = useAppDispatch();
  const { overview } = useAppSelector((state) => state.analytics);
  const { campaigns } = useAppSelector((state) => state.campaigns);
  const { contacts, groups } = useAppSelector((state) => state.contacts);

  useEffect(() => {
    dispatch(fetchOverviewAnalytics());
    dispatch(fetchCampaigns());
    dispatch(fetchContactsAndGroups());
  }, [dispatch]);

  const recentCampaigns = campaigns.slice(0, 5);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenNewCampaign}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Campaign</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium block mb-1">
            Total Campaigns
          </span>
          <div className="text-2xl font-bold text-slate-900">
            {campaigns.length}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {campaigns.filter((c) => c.status === 'SENT').length} sent
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium block mb-1">
            Total Contacts
          </span>
          <div className="text-2xl font-bold text-slate-900">
            {contacts.length}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {groups.length} groups
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium block mb-1">
            Emails Sent
          </span>
          <div className="text-2xl font-bold text-emerald-700">
            {overview?.totalSent ?? 0}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {overview?.totalDelivered ?? 0} delivered
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium block mb-1">
            Delivery Rate
          </span>
          <div className="text-2xl font-bold text-blue-700">
            {(overview?.deliveryRate != null ? Number(overview.deliveryRate) : 100).toFixed(2)}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              Recent Campaigns
            </h2>
            <button
              onClick={() => onNavigateTab('campaigns')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Campaign Name</th>
                  <th className="px-3 py-2.5 font-semibold">Status</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Recipients</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recentCampaigns.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-slate-400">
                      No campaigns created yet. Click "Create Campaign" to start!
                    </td>
                  </tr>
                ) : (
                  recentCampaigns.map((camp) => (
                    <tr
                      key={camp.id}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => onViewCampaign(camp)}
                    >
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <div className="font-semibold">{camp.name}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">
                          {camp.subject || 'No subject'}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                            camp.status === 'SENT'
                              ? 'text-emerald-800 bg-emerald-50'
                              : camp.status === 'SCHEDULED'
                              ? 'text-blue-800 bg-blue-50'
                              : camp.status === 'FAILED'
                              ? 'text-rose-800 bg-rose-50'
                              : 'text-slate-700 bg-slate-100'
                          }`}
                        >
                          {camp.status}
                        </span>
                        {camp.status === 'SCHEDULED' && camp.scheduledTime && (
                          <div className="text-[10px] text-blue-700 font-medium font-mono mt-0.5">
                            {new Date(camp.scheduledTime).toLocaleDateString([], { month: 'short', day: 'numeric' })} at{' '}
                            {new Date(camp.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-slate-700 font-medium">
                        {camp.totalRecipients}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewCampaign(camp);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-3">
          <div
            onClick={() => onNavigateTab('contacts')}
            className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-blue-400 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                  Contacts & Groups
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Add subscribers and manage audience groups
                </p>
              </div>
            </div>
          </div>

          <div
            onClick={() => onNavigateTab('templates')}
            className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-400 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                  Email Templates
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Write reusable templates for your campaigns
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

