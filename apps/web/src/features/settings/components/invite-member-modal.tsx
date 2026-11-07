'use client';

import React, { useState } from 'react';
import { X, UserPlus, Mail, Shield, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string) => void;
}

export function InviteMemberModal({
  isOpen,
  onClose,
  showToast,
}: InviteMemberModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'Admin' | 'Reviewer' | 'Member'>('Reviewer');
  const [department, setDepartment] = useState('Marketing');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    showToast(`Invitation sent to ${email} as ${role}`);
    setEmail('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E5E1D8] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F4F1EA] text-[#25251F] flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-[#25251F] leading-tight">
                Invite Team Member
              </h3>
              <p className="text-xs text-[#77766E] mt-0.5">
                Grant reviewer, editor, or administrator access.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#77766E] hover:text-[#25251F] hover:bg-[#F1EFE8] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#25251F] mb-1.5">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#77766E] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@evolyn.com"
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#25251F] text-[#25251F]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#25251F] mb-1.5">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#25251F] text-[#25251F]"
              >
                <option value="Reviewer">Reviewer</option>
                <option value="Admin">Admin</option>
                <option value="Member">Member</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#25251F] mb-1.5">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#25251F] text-[#25251F]"
              >
                <option value="Marketing">Marketing</option>
                <option value="Brand Design">Brand Design</option>
                <option value="Legal & Compliance">Legal & Compliance</option>
                <option value="Product">Product</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-[#FAF8F5] border border-[#EFECE6] rounded-xl text-xs text-[#52524E] space-y-1">
            <p className="font-semibold text-[#25251F] flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#68745D]" />
              Role Permissions
            </p>
            <p className="text-[11px] text-[#77766E] leading-relaxed">
              {role === 'Admin'
                ? 'Can configure guidelines, manage integrations, and invite workspace members.'
                : role === 'Reviewer'
                ? 'Can review submitted copy, approve findings, and request changes.'
                : 'Can submit content for automated compliance review runs.'}
            </p>
          </div>

          <div className="pt-3 border-t border-[#E5E1D8] flex items-center justify-end gap-2.5">
            <Button type="button" variant="ghost" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" className="bg-[#18181B] text-white">
              Send Invite
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

