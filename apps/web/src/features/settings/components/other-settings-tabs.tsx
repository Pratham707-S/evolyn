'use client';

import React, { useState } from 'react';
import {
  Users,
  CheckCircle2,
  Link2,
  Bell,
  ShieldCheck,
  CreditCard,
  Plus,
  ExternalLink,
  Check,
  Trash2,
  Lock,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TabProps {
  showToast: (msg: string) => void;
  onOpenInvite?: () => void;
}

export function TeamSettingsTab({ showToast, onOpenInvite }: TabProps) {
  const members = [
    { name: 'Claire Sterling', email: 'claire@evolyn.com', role: 'Owner', dept: 'Executive', status: 'Active' },
    { name: 'Elena Rostova', email: 'elena@evolyn.com', role: 'Admin', dept: 'Brand Team', status: 'Active' },
    { name: 'Marcus Kane', email: 'marcus@evolyn.com', role: 'Reviewer', dept: 'Marketing', status: 'Active' },
    { name: 'Alex Vance', email: 'alex@evolyn.com', role: 'Reviewer', dept: 'Product Marketing', status: 'Active' },
    { name: 'David Ross', email: 'david@evolyn.com', role: 'Member', dept: 'Engineering', status: 'Active' },
  ];

  return (
    <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#25251F] tracking-tight">
            Team & Access Control
          </h2>
          <p className="text-xs sm:text-sm text-[#77766E] mt-0.5">
            Manage reviewer seats, permission tiers, and department delegations.
          </p>
        </div>
        <Button variant="primary" size="md" onClick={onOpenInvite} className="bg-[#18181B] text-white">
          <Plus className="w-4 h-4 mr-1.5" />
          Invite Member
        </Button>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-xs border-collapse min-w-[500px]">
          <thead>
            <tr className="border-b border-[#E5E1D8] bg-[#FDFBF7] text-[#77766E] uppercase text-[10px] tracking-wider">
              <th className="py-2.5 px-3">Name</th>
              <th className="py-2.5 px-3">Department</th>
              <th className="py-2.5 px-3">Role</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EFECE6]">
            {members.map((m, idx) => (
              <tr key={idx} className="hover:bg-[#FAF9F5] transition-colors">
                <td className="py-3 px-3">
                  <p className="font-semibold text-[#25251F]">{m.name}</p>
                  <p className="text-[11px] text-[#77766E]">{m.email}</p>
                </td>
                <td className="py-3 px-3 text-[#52524E]">{m.dept}</td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F1EFE8] text-[#25251F]">
                    {m.role}
                  </span>
                </td>
                <td className="py-3 px-3">
                  <span className="inline-flex items-center gap-1 text-[11px] text-[#065F46]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                    {m.status}
                  </span>
                </td>
                <td className="py-3 px-3 text-right">
                  <button
                    type="button"
                    onClick={() => showToast(`Edit member ${m.name}`)}
                    className="text-[#77766E] hover:text-[#25251F] text-xs font-medium"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ReviewSettingsTab({ showToast }: TabProps) {
  const [requireDualSignoff, setRequireDualSignoff] = useState(true);
  const [autoRejectCritical, setAutoRejectCritical] = useState(false);
  const [scoreThreshold, setScoreThreshold] = useState('85');

  return (
    <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-6">
      <div>
        <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#25251F] tracking-tight">
          Review & Approvals Policy
        </h2>
        <p className="text-xs sm:text-sm text-[#77766E] mt-0.5">
          Configure AI evaluation gates, sign-off thresholds, and automated routing rules.
        </p>
      </div>

      <div className="space-y-4 text-xs sm:text-sm">
        <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-[#E5E1D8] bg-white">
          <div>
            <p className="font-semibold text-[#25251F]">Mandatory Dual Reviewer Sign-Off</p>
            <p className="text-xs text-[#77766E] mt-0.5">
              Requires both a Brand Reviewer and Legal Reviewer for all public external campaigns.
            </p>
          </div>
          <input
            type="checkbox"
            checked={requireDualSignoff}
            onChange={(e) => setRequireDualSignoff(e.target.checked)}
            className="w-4 h-4 rounded border-[#D5D1C7] text-[#25251F] focus:ring-0 cursor-pointer mt-1"
          />
        </div>

        <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-[#E5E1D8] bg-white">
          <div>
            <p className="font-semibold text-[#25251F]">Auto-Hold on Critical Findings</p>
            <p className="text-xs text-[#77766E] mt-0.5">
              Instantly block publishing if any Critical severity guideline violation is detected.
            </p>
          </div>
          <input
            type="checkbox"
            checked={autoRejectCritical}
            onChange={(e) => setAutoRejectCritical(e.target.checked)}
            className="w-4 h-4 rounded border-[#D5D1C7] text-[#25251F] focus:ring-0 cursor-pointer mt-1"
          />
        </div>

        <div className="p-4 rounded-xl border border-[#E5E1D8] bg-white space-y-2">
          <p className="font-semibold text-[#25251F]">Minimum Compliance Score Threshold (%)</p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={scoreThreshold}
              onChange={(e) => setScoreThreshold(e.target.value)}
              className="w-24 px-3 py-1.5 border border-[#E5E1D8] rounded-xl text-xs font-mono"
            />
            <span className="text-xs text-[#77766E]">Submissions scoring below this mark require revision.</span>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <Button variant="primary" size="md" onClick={() => showToast('Review policy settings saved')} className="bg-[#18181B] text-white">
          Save Review Settings
        </Button>
      </div>
    </div>
  );
}

export function IntegrationsSettingsTab({ showToast }: TabProps) {
  const integrations = [
    { name: 'Figma', category: 'Design System', status: 'Connected', desc: 'Sync typography tokens and logo assets automatically.' },
    { name: 'Slack', category: 'Notifications', status: 'Connected', desc: 'Receive real-time review run updates and decision alerts.' },
    { name: 'Google Drive', category: 'Knowledge Sources', status: 'Available', desc: 'Import press kits and brand guidelines PDFs directly.' },
    { name: 'HubSpot', category: 'CMS & Marketing', status: 'Available', desc: 'Pre-flight marketing email sequences before sending.' },
  ];

  return (
    <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
      <div>
        <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#25251F] tracking-tight">
          Integrations & Connected Tools
        </h2>
        <p className="text-xs sm:text-sm text-[#77766E] mt-0.5">
          Connect your marketing stack, design tokens, and communication channels.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {integrations.map((item, idx) => (
          <div key={idx} className="p-4 rounded-xl border border-[#E5E1D8] bg-white flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs sm:text-sm text-[#25251F]">{item.name}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${item.status === 'Connected' ? 'bg-[#ECFDF5] text-[#065F46]' : 'bg-[#F1EFE8] text-[#77766E]'}`}>
                  {item.status}
                </span>
              </div>
              <p className="text-[11px] text-[#77766E] mt-1">{item.desc}</p>
            </div>
            <Button
              variant={item.status === 'Connected' ? 'outline' : 'secondary'}
              size="sm"
              onClick={() => showToast(`${item.name} settings updated`)}
              className="self-start text-xs"
            >
              {item.status === 'Connected' ? 'Configure' : 'Connect'}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SecuritySettingsTab({ showToast }: TabProps) {
  return (
    <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-6">
      <div>
        <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#25251F] tracking-tight">
          Security & Authentication
        </h2>
        <p className="text-xs sm:text-sm text-[#77766E] mt-0.5">
          Enterprise identity federation, session controls, and cryptographic audit logs.
        </p>
      </div>

      <div className="space-y-4 text-xs sm:text-sm">
        <div className="p-4 rounded-xl border border-[#E5E1D8] bg-white flex items-start justify-between">
          <div>
            <p className="font-semibold text-[#25251F]">SAML 2.0 Single Sign-On (SSO)</p>
            <p className="text-xs text-[#77766E] mt-0.5">Enforce authentication through Okta, Azure AD, or Google Workspace.</p>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#ECFDF5] text-[#065F46]">
            Configured
          </span>
        </div>

        <div className="p-4 rounded-xl border border-[#E5E1D8] bg-white flex items-start justify-between">
          <div>
            <p className="font-semibold text-[#25251F]">Two-Factor Authentication (2FA)</p>
            <p className="text-xs text-[#77766E] mt-0.5">Require all reviewers and admins to use TOTP authenticator apps.</p>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#ECFDF5] text-[#065F46]">
            Enforced
          </span>
        </div>
      </div>

      <Button variant="primary" size="md" onClick={() => showToast('Security preferences updated')} className="bg-[#18181B] text-white">
        Update Security Policies
      </Button>
    </div>
  );
}

export function BillingSettingsTab({ showToast }: TabProps) {
  return (
    <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-6">
      <div>
        <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#25251F] tracking-tight">
          Subscription & Billing
        </h2>
        <p className="text-xs sm:text-sm text-[#77766E] mt-0.5">
          Manage workspace plan, reviewer seats, and invoice history.
        </p>
      </div>

      <div className="p-4 rounded-xl border border-[#E5E1D8] bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold text-[#68745D] tracking-wider">Current Plan</span>
          <p className="font-serif text-xl font-bold text-[#25251F] mt-0.5">Evolyn Enterprise Tier</p>
          <p className="text-xs text-[#77766E] mt-0.5">Includes unlimited AI reviews, SOC 2 compliance, and dedicated support.</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-[#25251F]">12 of 20 Seats Used</p>
          <div className="w-36 h-2 bg-[#EFECE6] rounded-full overflow-hidden mt-1.5">
            <div className="h-full bg-[#18181B] w-[60%]" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="secondary" size="md" onClick={() => showToast('Opening billing portal...')} className="bg-white">
          Manage Payment Method
        </Button>
        <Button variant="outline" size="md" onClick={() => showToast('Downloading invoice archive...')} className="bg-white">
          <Download className="w-4 h-4 mr-1.5" />
          Download Invoices
        </Button>
      </div>
    </div>
  );
}

