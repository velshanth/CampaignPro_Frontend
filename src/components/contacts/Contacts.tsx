import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  setSelectedGroup,
  setContactSearchQuery,
  deleteContact,
  deleteGroup
} from '../../store/slices/contactsSlice';
import { ContactDTO } from '../../types';
import { AddContact } from './AddContact';
import { AddGroup } from './AddGroup';
import {
  Users,
  UserPlus,
  Layers,
  Search,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  FolderPlus,
  Copy,
  Check
} from 'lucide-react';

export const Contacts: React.FC = () => {
  const dispatch = useAppDispatch();
  const { contacts, groups, selectedGroup, searchQuery } = useAppSelector(
    (state) => state.contacts
  );

  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [contactToEdit, setContactToEdit] = useState<ContactDTO | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const filteredContacts = contacts.filter((c) => {
    const matchesGroup = !selectedGroup || c.groups?.includes(selectedGroup);
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      c.firstName.toLowerCase().includes(query) ||
      c.lastName.toLowerCase().includes(query) ||
      c.email.toLowerCase().includes(query) ||
      (c.customFields &&
        Object.values(c.customFields).some((val) => val.toLowerCase().includes(query)));
    return matchesGroup && matchesSearch;
  });

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 1500);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Contacts & Audiences
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
            <span>Centralized subscriber directory</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{contacts.length} total contacts</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{groups.length} groups</span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">

          {/* New Group */}
          <button
            onClick={() => setIsGroupModalOpen(true)}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <FolderPlus className="w-3.5 h-3.5 text-slate-500" />
            <span>New Group</span>
          </button>

          {/* Add Contact */}
          <button
            onClick={() => {
              setContactToEdit(null);
              setIsContactModalOpen(true);
            }}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs transition-all active:scale-[0.98] flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Contact</span>
          </button>
        </div>
      </div>

      {/* Filter and Audience Segments Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Audience Group Selector */}
        <div className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-xl border border-slate-200 overflow-x-auto">
          <button
            onClick={() => dispatch(setSelectedGroup(null))}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              selectedGroup === null
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-700 hover:text-emerald-800 hover:bg-white/80'
            }`}
          >
            <span>All Contacts</span>
            <span className={`font-mono text-[10px] tabular-nums ${selectedGroup === null ? 'text-emerald-100' : 'text-slate-500'}`}>
              ({contacts.length})
            </span>
          </button>

          {groups.map((grp) => {
            const isSelected = selectedGroup === grp.name;
            const actualCount = contacts.filter(
              (c) => c.groups && (c.groups.includes(grp.name) || c.groups.includes(grp.id))
            ).length;
            return (
              <button
                key={grp.id}
                onClick={() => dispatch(setSelectedGroup(grp.name))}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-700 hover:text-emerald-800 hover:bg-white/80'
                }`}
              >
                <span>{grp.name}</span>
                <span className={`font-mono text-[10px] tabular-nums ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                  ({actualCount})
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => dispatch(setContactSearchQuery(e.target.value))}
            placeholder="Search name, email, or company..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition-all text-slate-900"
          />
        </div>
      </div>

      {/* Contacts Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 text-slate-500 border-b border-slate-200 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3">Subscriber Name</th>
                <th className="px-4 py-3">Email Address</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Audience Groups</th>
                <th className="px-4 py-3">Company / Title</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <p className="text-sm font-medium text-slate-600">No contacts found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchQuery
                        ? 'Try clearing the search query or changing audience group'
                        : 'Click "Add Contact" to populate your directory'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredContacts.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Name */}
                    <td className="px-5 py-3.5 font-semibold text-slate-900 whitespace-nowrap">
                      {c.firstName} {c.lastName}
                    </td>

                    {/* Email with copy button */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 group">
                        <span className="font-mono text-[11px] text-slate-700">{c.email}</span>
                        <button
                          onClick={() => handleCopyEmail(c.email)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 transition-opacity"
                          title="Copy email address"
                        >
                          {copiedEmail === c.email ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="px-4 py-3.5 whitespace-nowrap font-mono text-[11px] text-slate-500">
                      {c.phone || '—'}
                    </td>

                    {/* Groups (Rendered as unboxed subtle text with separators per Zero-Pill rule) */}
                    <td className="px-4 py-3.5 max-w-xs">
                      {c.groups && c.groups.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1 text-[11px] text-slate-600">
                          {c.groups.map((g, idx) => (
                            <span key={idx}>
                              {g}
                              {idx < (c.groups?.length || 0) - 1 && <span className="text-slate-300 ml-1">·</span>}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Custom fields: Company & Title */}
                    <td className="px-4 py-3.5 max-w-xs text-[11px] text-slate-600">
                      {c.customFields?.company || c.customFields?.title ? (
                        <div>
                          <span className="font-medium text-slate-900">{c.customFields.company || ''}</span>
                          {c.customFields.title && (
                            <span className="text-slate-500 block text-[10px]">{c.customFields.title}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5 whitespace-nowrap font-medium text-[11px]">
                      <span className={c.active ? 'text-emerald-700' : 'text-slate-400'}>
                        {c.active ? '● Active' : '○ Inactive'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setContactToEdit(c);
                            setIsContactModalOpen(true);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                          title="Edit contact details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => dispatch(deleteContact(c.id))}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Delete contact"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Group Details & Management Drawer if Group is Selected */}
      {selectedGroup && (
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-slate-900">Current Cohort: {selectedGroup}</span>
            <p className="text-slate-500 text-[11px] mt-0.5">
              {groups.find((g) => g.name === selectedGroup)?.description ||
                'Target segment for automated and manual campaign broadcasts.'}
            </p>
          </div>
          <button
            onClick={() => {
              const grp = groups.find((g) => g.name === selectedGroup);
              if (grp) dispatch(deleteGroup(grp.id));
            }}
            className="px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors flex items-center gap-1 font-medium"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Group</span>
          </button>
        </div>
      )}

      {/* Modals */}
      <AddContact
        isOpen={isContactModalOpen}
        contactToEdit={contactToEdit}
        onClose={() => setIsContactModalOpen(false)}
      />
      <AddGroup
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
      />
    </div>
  );
};

export const ContactManager = Contacts;

