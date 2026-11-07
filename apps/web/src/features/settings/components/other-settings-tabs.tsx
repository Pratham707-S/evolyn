'use client';

import React, { useState, useEffect } from 'react';
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
  AlertCircle,
  Clock,
  Radio,
  FileSpreadsheet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TabProps {
  showToast: (msg: string) => void;
  onOpenInvite?: () => void;
}

// ----------------------------------------------------
// 1. TEAM SETTINGS TAB
// ----------------------------------------------------
export function TeamSettingsTab({ showToast, onOpenInvite }: TabProps) {
  const defaultMembers = [
    { id: 'm1', name: 'Claire Sterling', email: 'claire@evolyn.com', role: 'Owner', dept: 'Executive', status: 'Active' },
    { id: 'm2', name: 'Elena Rostova', email: 'elena@evolyn.com', role: 'Admin', dept: 'Brand Team', status: 'Active' },
    { id: 'm3', name: 'Marcus Kane', email: 'marcus@evolyn.com', role: 'Reviewer', dept: 'Marketing', status: 'Active' },
    { id: 'm4', name: 'Alex Vance', email: 'alex@evolyn.com', role: 'Reviewer', dept: 'Product Marketing', status: 'Active' },
    { id: 'm5', name: 'David Ross', email: 'david@evolyn.com', role: 'Member', dept: 'Engineering', status: 'Active' },
  ];

  const [members, setMembers] = useState(defaultMembers);

  const loadMembers = () => {
    try {
      const stored = localStorage.getItem('evolyn_team_members');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMembers(parsed);
          return;
        }
      }
    } catch {
      // fallback
    }
    setMembers(defaultMembers);
  };

  useEffect(() => {
    loadMembers();
    // Listen for storage changes
    window.addEventListener('storage', loadMembers);
    return () => window.removeEventListener('storage', loadMembers);
  }, []);

  const handleRemoveMember = (email: string, name: string) => {
    const updated = members.filter((m) => m.email !== email);
    setMembers(updated);
    try {
      localStorage.setItem('evolyn_team_members', JSON.stringify(updated));
    } catch {
      // ignore
    }
    showToast(`Removed ${name} from workspace`);
  };

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
        <Button
          variant="primary"
          size="md"
          onClick={onOpenInvite}
          className="bg-[#18181B] text-white cursor-pointer"
        >
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
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EFECE6]">
            {members.map((m, idx) => (
              <tr key={m.email || idx} className="hover:bg-[#FAF9F5] transition-colors">
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
                  {m.role !== 'Owner' ? (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(m.email, m.name)}
                      className="text-[#77766E] hover:text-[#B91C1C] text-xs font-medium cursor-pointer transition-colors p-1"
                      title="Remove member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <span className="text-[11px] text-[#A09D92] italic">Workspace Owner</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 2. REVIEW & APPROVALS TAB
// ----------------------------------------------------
export function ReviewSettingsTab({ showToast }: TabProps) {
  const [requireDualSignoff, setRequireDualSignoff] = useState(true);
  const [autoRejectCritical, setAutoRejectCritical] = useState(false);
  const [scoreThreshold, setScoreThreshold] = useState('85');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('evolyn_review_policy');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed.requireDualSignoff === 'boolean') setRequireDualSignoff(parsed.requireDualSignoff);
        if (typeof parsed.autoRejectCritical === 'boolean') setAutoRejectCritical(parsed.autoRejectCritical);
        if (parsed.scoreThreshold) setScoreThreshold(parsed.scoreThreshold);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSavePolicy = () => {
    try {
      localStorage.setItem(
        'evolyn_review_policy',
        JSON.stringify({ requireDualSignoff, autoRejectCritical, scoreThreshold })
      );
    } catch {
      // ignore
    }
    showToast('Review policy settings saved successfully');
  };

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
        <label className="flex items-start justify-between gap-4 p-4 rounded-xl border border-[#E5E1D8] bg-white cursor-pointer hover:border-[#D5D1C7] transition-colors">
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
        </label>

        <label className="flex items-start justify-between gap-4 p-4 rounded-xl border border-[#E5E1D8] bg-white cursor-pointer hover:border-[#D5D1C7] transition-colors">
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
        </label>

        <div className="p-4 rounded-xl border border-[#E5E1D8] bg-white space-y-2">
          <p className="font-semibold text-[#25251F]">Minimum Compliance Score Threshold (%)</p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="50"
              max="100"
              value={scoreThreshold}
              onChange={(e) => setScoreThreshold(e.target.value)}
              className="w-24 px-3 py-1.5 border border-[#E5E1D8] rounded-xl text-xs font-mono focus:outline-none focus:border-[#25251F]"
            />
            <span className="text-xs text-[#77766E]">
              Submissions scoring below this mark automatically trigger Changes Requested.
            </span>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <Button
          variant="primary"
          size="md"
          onClick={handleSavePolicy}
          className="bg-[#18181B] text-white cursor-pointer"
        >
          Save Review Settings
        </Button>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 3. INTEGRATIONS TAB (HONEST STATUSES)
// ----------------------------------------------------
export function IntegrationsSettingsTab({ showToast }: TabProps) {
  const [integrations, setIntegrations] = useState([
    {
      id: 'figma',
      name: 'Figma',
      category: 'Design System',
      status: 'Not Connected',
      desc: 'Sync typography tokens and logo assets automatically from design files.',
    },
    {
      id: 'slack',
      name: 'Slack',
      category: 'Notifications',
      status: 'Available',
      desc: 'Receive real-time review run updates and decision alerts in your channels.',
    },
    {
      id: 'gdrive',
      name: 'Google Drive',
      category: 'Knowledge Sources',
      status: 'Available',
      desc: 'Import press kits and brand guidelines PDFs directly into the knowledge library.',
    },
    {
      id: 'hubspot',
      name: 'HubSpot',
      category: 'CMS & Marketing',
      status: 'Available',
      desc: 'Pre-flight marketing email sequences before sending to customers.',
    },
    {
      id: 'linear',
      name: 'Linear',
      category: 'Issue Tracking',
      status: 'Available',
      desc: 'Auto-create governance action items when guidelines changes are required.',
    },
  ]);

  const [activeConfigModal, setActiveConfigModal] = useState<string | null>(null);
  const [endpointInput, setEndpointInput] = useState('');

  const handleOpenConfig = (name: string) => {
    setActiveConfigModal(name);
    setEndpointInput('');
  };

  const handleSaveIntegration = () => {
    if (!endpointInput.trim()) {
      showToast('Please provide an endpoint or API token');
      return;
    }
    setIntegrations((prev) =>
      prev.map((i) =>
        i.name === activeConfigModal ? { ...i, status: 'Configured' } : i
      )
    );
    showToast(`${activeConfigModal} configuration saved`);
    setActiveConfigModal(null);
  };

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
        {integrations.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-xl border border-[#E5E1D8] bg-white flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs sm:text-sm text-[#25251F]">{item.name}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    item.status === 'Configured'
                      ? 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]'
                      : 'bg-[#F1EFE8] text-[#77766E]'
                  }`}
                >
                  {item.status}
                </span>
              </div>
              <p className="text-[11px] text-[#77766E] mt-1">{item.desc}</p>
            </div>
            <Button
              variant={item.status === 'Configured' ? 'outline' : 'secondary'}
              size="sm"
              onClick={() => handleOpenConfig(item.name)}
              className="self-start text-xs cursor-pointer"
            >
              {item.status === 'Configured' ? 'Manage' : 'Connect / Setup'}
            </Button>
          </div>
        ))}
      </div>

      {activeConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4">
            <h3 className="font-serif font-bold text-lg text-[#25251F]">
              Configure {activeConfigModal}
            </h3>
            <div>
              <label className="block text-xs font-semibold text-[#25251F] mb-1">
                Webhook URL or API Access Token
              </label>
              <input
                type="text"
                value={endpointInput}
                onChange={(e) => setEndpointInput(e.target.value)}
                placeholder="https://hooks.example.com/... or token_xxx"
                className="w-full px-3 py-2 text-xs bg-white border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#25251F]"
              />
            </div>
            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setActiveConfigModal(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleSaveIntegration}
              >
                Save Connection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// 4. NOTIFICATIONS TAB (DEDICATED SECTION 5)
// ----------------------------------------------------
export function NotificationsSettingsTab({ showToast }: TabProps) {
  const [emailDigest, setEmailDigest] = useState(true);
  const [criticalAlerts, setCriticalAlerts] = useState(true);
  const [assignmentAlerts, setAssignmentAlerts] = useState(true);
  const [decisionAlerts, setDecisionAlerts] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('evolyn_notification_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed.emailDigest === 'boolean') setEmailDigest(parsed.emailDigest);
        if (typeof parsed.criticalAlerts === 'boolean') setCriticalAlerts(parsed.criticalAlerts);
        if (typeof parsed.assignmentAlerts === 'boolean') setAssignmentAlerts(parsed.assignmentAlerts);
        if (typeof parsed.decisionAlerts === 'boolean') setDecisionAlerts(parsed.decisionAlerts);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSaveNotifications = () => {
    try {
      localStorage.setItem(
        'evolyn_notification_settings',
        JSON.stringify({ emailDigest, criticalAlerts, assignmentAlerts, decisionAlerts })
      );
    } catch {
      // ignore
    }
    showToast('Notification preferences saved');
  };

  return (
    <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-6">
      <div>
        <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#25251F] tracking-tight">
          Notification Preferences
        </h2>
        <p className="text-xs sm:text-sm text-[#77766E] mt-0.5">
          Configure how reviewers and authors are alerted to findings and decisions.
        </p>
      </div>

      <div className="space-y-3.5 text-xs sm:text-sm">
        <label className="flex items-start justify-between gap-4 p-4 rounded-xl border border-[#E5E1D8] bg-white cursor-pointer hover:border-[#D5D1C7] transition-colors">
          <div>
            <p className="font-semibold text-[#25251F]">Daily Compliance Digest</p>
            <p className="text-xs text-[#77766E] mt-0.5">
              Receive a daily email summarizing all submitted documents, approvals, and open issues.
            </p>
          </div>
          <input
            type="checkbox"
            checked={emailDigest}
            onChange={(e) => setEmailDigest(e.target.checked)}
            className="w-4 h-4 rounded border-[#D5D1C7] text-[#25251F] focus:ring-0 cursor-pointer mt-1"
          />
        </label>

        <label className="flex items-start justify-between gap-4 p-4 rounded-xl border border-[#E5E1D8] bg-white cursor-pointer hover:border-[#D5D1C7] transition-colors">
          <div>
            <p className="font-semibold text-[#25251F]">Immediate Critical Severity Alerts</p>
            <p className="text-xs text-[#77766E] mt-0.5">
              Dispatch high-priority email alerts when an AI audit flags an ungrounded or prohibited claim.
            </p>
          </div>
          <input
            type="checkbox"
            checked={criticalAlerts}
            onChange={(e) => setCriticalAlerts(e.target.checked)}
            className="w-4 h-4 rounded border-[#D5D1C7] text-[#25251F] focus:ring-0 cursor-pointer mt-1"
          />
        </label>

        <label className="flex items-start justify-between gap-4 p-4 rounded-xl border border-[#E5E1D8] bg-white cursor-pointer hover:border-[#D5D1C7] transition-colors">
          <div>
            <p className="font-semibold text-[#25251F]">Review Assignments & Mentions</p>
            <p className="text-xs text-[#77766E] mt-0.5">
              Notify reviewers when a new document is assigned to their department queue.
            </p>
          </div>
          <input
            type="checkbox"
            checked={assignmentAlerts}
            onChange={(e) => setAssignmentAlerts(e.target.checked)}
            className="w-4 h-4 rounded border-[#D5D1C7] text-[#25251F] focus:ring-0 cursor-pointer mt-1"
          />
        </label>

        <label className="flex items-start justify-between gap-4 p-4 rounded-xl border border-[#E5E1D8] bg-white cursor-pointer hover:border-[#D5D1C7] transition-colors">
          <div>
            <p className="font-semibold text-[#25251F]">Decision Sign-Off Confirmations</p>
            <p className="text-xs text-[#77766E] mt-0.5">
              Notify authors immediately when their submission is Approved or Changes Requested.
            </p>
          </div>
          <input
            type="checkbox"
            checked={decisionAlerts}
            onChange={(e) => setDecisionAlerts(e.target.checked)}
            className="w-4 h-4 rounded border-[#D5D1C7] text-[#25251F] focus:ring-0 cursor-pointer mt-1"
          />
        </label>
      </div>

      <div className="pt-2">
        <Button
          variant="primary"
          size="md"
          onClick={handleSaveNotifications}
          className="bg-[#18181B] text-white cursor-pointer"
        >
          Save Notification Settings
        </Button>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 5. SECURITY TAB
// ----------------------------------------------------
export function SecuritySettingsTab({ showToast }: TabProps) {
  const [twoFactorEnforced, setTwoFactorEnforced] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState('8h');

  const handleUpdate = () => {
    showToast('Security policies successfully updated');
  };

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
        <div className="p-4 rounded-xl border border-[#E5E1D8] bg-white flex items-start justify-between gap-4">
          <div>
            <p className="font-semibold text-[#25251F]">SAML 2.0 Single Sign-On (SSO)</p>
            <p className="text-xs text-[#77766E] mt-0.5">
              Enforce authentication through Okta, Azure AD, or Google Workspace.
            </p>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
            Configured
          </span>
        </div>

        <label className="p-4 rounded-xl border border-[#E5E1D8] bg-white flex items-start justify-between gap-4 cursor-pointer hover:border-[#D5D1C7] transition-colors">
          <div>
            <p className="font-semibold text-[#25251F]">Two-Factor Authentication (2FA)</p>
            <p className="text-xs text-[#77766E] mt-0.5">
              Require all reviewers and admins to use TOTP authenticator apps.
            </p>
          </div>
          <input
            type="checkbox"
            checked={twoFactorEnforced}
            onChange={(e) => setTwoFactorEnforced(e.target.checked)}
            className="w-4 h-4 rounded border-[#D5D1C7] text-[#25251F] focus:ring-0 cursor-pointer mt-1"
          />
        </label>

        <div className="p-4 rounded-xl border border-[#E5E1D8] bg-white space-y-2">
          <p className="font-semibold text-[#25251F]">Idle Session Timeout</p>
          <div className="flex items-center gap-3">
            <select
              value={sessionTimeout}
              onChange={(e) => setSessionTimeout(e.target.value)}
              className="px-3 py-1.5 border border-[#E5E1D8] rounded-xl text-xs bg-white text-[#25251F]"
            >
              <option value="15m">15 Minutes</option>
              <option value="1h">1 Hour</option>
              <option value="8h">8 Hours (Standard)</option>
              <option value="24h">24 Hours</option>
            </select>
            <span className="text-xs text-[#77766E]">
              Inactive reviewer sessions are automatically terminated.
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[#E5E1D8] bg-[#FAF8F5] space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#25251F]">
            <Lock className="w-3.5 h-3.5 text-[#68745D]" />
            <span>Cryptographic Audit Trail Integrity</span>
          </div>
          <p className="text-[11px] text-[#77766E] leading-relaxed">
            All reviewer decisions and AI auto-fixes are hashed with SHA-256 and immutably sealed in the audit log for SOC 2 Type II compliance.
          </p>
        </div>
      </div>

      <Button
        variant="primary"
        size="md"
        onClick={handleUpdate}
        className="bg-[#18181B] text-white cursor-pointer"
      >
        Update Security Policies
      </Button>
    </div>
  );
}

// ----------------------------------------------------
// 6. BILLING TAB
// ----------------------------------------------------
export function BillingSettingsTab({ showToast }: TabProps) {
  const [memberCount, setMemberCount] = useState(5);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('evolyn_team_members');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setMemberCount(parsed.length);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleDownloadInvoice = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'InvoiceID,Date,Plan,Seats,Amount,Status\n' +
      `INV-2026-001,2026-11-01,Evolyn Enterprise Tier,${memberCount}/20,$1200.00,Paid\n` +
      `INV-2026-002,2026-10-01,Evolyn Enterprise Tier,${memberCount}/20,$1200.00,Paid\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `evolyn-invoice-summary-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Downloaded invoice statement');
  };

  const maxSeats = 20;
  const usagePercent = Math.min(100, Math.round((memberCount / maxSeats) * 100));

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

      <div className="p-4 sm:p-5 rounded-xl border border-[#E5E1D8] bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold text-[#68745D] tracking-wider">
            Current Plan
          </span>
          <p className="font-serif text-xl font-bold text-[#25251F] mt-0.5">
            Evolyn Enterprise Tier
          </p>
          <p className="text-xs text-[#77766E] mt-0.5">
            Includes unlimited AI reviews, deterministic claim grounding, and SOC 2 audit logs.
          </p>
        </div>
        <div className="w-full sm:w-auto text-left sm:text-right">
          <p className="text-xs font-semibold text-[#25251F]">
            {memberCount} of {maxSeats} Seats Used
          </p>
          <div className="w-full sm:w-36 h-2 bg-[#EFECE6] rounded-full overflow-hidden mt-1.5">
            <div
              className="h-full bg-[#18181B] transition-all duration-300"
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="secondary"
          size="md"
          onClick={() => showToast('Opening Stripe billing portal...')}
          className="bg-white border border-[#E5E1D8] text-[#25251F] cursor-pointer"
        >
          Manage Payment Method
        </Button>
        <Button
          variant="outline"
          size="md"
          onClick={handleDownloadInvoice}
          className="bg-white border border-[#E5E1D8] text-[#25251F] cursor-pointer"
        >
          <Download className="w-4 h-4 mr-1.5" />
          Download Invoices (.CSV)
        </Button>
      </div>
    </div>
  );
}

