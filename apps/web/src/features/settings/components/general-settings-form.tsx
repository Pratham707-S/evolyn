'use client';

import React, { useState } from 'react';
import {
  Copy,
  Check,
  ChevronDown,
  Upload,
  Trash2,
  Plus,
  Box,
  Sun,
  Moon,
  Monitor,
  Globe,
  Clock,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/lib/theme/theme-context';
import { ThemeToggle } from '@/components/shared/theme-toggle';

interface BrandColorItem {
  id: string;
  hex: string;
  name: string;
}

interface GeneralSettingsFormProps {
  showToast: (msg: string) => void;
}

export function GeneralSettingsForm({ showToast }: GeneralSettingsFormProps) {
  const { theme, setTheme, isDark } = useTheme();

  // Form State
  const [workspaceName, setWorkspaceName] = useState('Evolyn – Brand Workspace');
  const [workspaceUrl, setWorkspaceUrl] = useState('evolyn.app/w/evolyn-brand');
  const [selectedBrand, setSelectedBrand] = useState('Evolyn');
  const [defaultProduct, setDefaultProduct] = useState('Evolyn Platform');
  const [workspaceDescription, setWorkspaceDescription] = useState(
    'Brand compliance and content review workspace for Evolyn marketing, product, and communication content.'
  );

  // Logo state
  const [hasLogo, setHasLogo] = useState(true);

  // Brand colors state
  const [colors, setColors] = useState<BrandColorItem[]>([
    { id: 'c1', hex: '#0B0B0B', name: 'Primary' },
    { id: 'c2', hex: '#F5EFE6', name: 'Secondary' },
    { id: 'c3', hex: '#6C5CE7', name: 'Accent' },
  ]);

  // Language & Regional state
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [timezone, setTimezone] = useState('America/Los_Angeles');

  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isColorModalOpen, setIsColorModalOpen] = useState(false);
  const [newColorHex, setNewColorHex] = useState('#68745D');
  const [newColorName, setNewColorName] = useState('Subtle');

  const maxChars = 250;

  const handleCopyUrl = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`https://${workspaceUrl}`);
      setCopiedUrl(true);
      showToast('Copied workspace URL to clipboard');
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const handleAddColor = () => {
    if (!newColorHex.trim()) return;
    setColors([
      ...colors,
      {
        id: `c-${Date.now()}`,
        hex: newColorHex.startsWith('#') ? newColorHex : `#${newColorHex}`,
        name: newColorName.trim() || 'Custom',
      },
    ]);
    setIsColorModalOpen(false);
    showToast(`Added ${newColorHex} to brand palette`);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Workspace settings saved successfully');
  };

  const handleDiscard = () => {
    setWorkspaceName('Evolyn – Brand Workspace');
    setWorkspaceUrl('evolyn.app/w/evolyn-brand');
    setSelectedBrand('Evolyn');
    setDefaultProduct('Evolyn Platform');
    setWorkspaceDescription(
      'Brand compliance and content review workspace for Evolyn marketing, product, and communication content.'
    );
    setSelectedLanguage('en-US');
    setDateFormat('MM/DD/YYYY');
    setTimezone('America/Los_Angeles');
    showToast('Changes reverted to saved state');
  };

  return (
    <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl p-5 sm:p-6 shadow-2xs">
      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: General Settings */}
        <div className="space-y-4">
          <div>
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#25251F] tracking-tight">
              General Settings
            </h2>
            <p className="text-xs sm:text-sm text-[#77766E] mt-0.5">
              Basic workspace and brand configuration.
            </p>
          </div>

          {/* Row 1: Workspace Name & Workspace URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Workspace Name */}
            <div>
              <label className="block text-xs font-semibold text-[#25251F] mb-1.5">
                Workspace Name <span className="text-[#B91C1C]">*</span>
              </label>
              <input
                type="text"
                required
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="e.g., Evolyn – Brand Workspace"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#25251F] focus:ring-1 focus:ring-[#25251F] text-[#25251F] transition-all"
              />
            </div>

            {/* Workspace URL */}
            <div>
              <label className="block text-xs font-semibold text-[#25251F] mb-1.5">
                Workspace URL
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={workspaceUrl}
                  onChange={(e) => setWorkspaceUrl(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 text-xs sm:text-sm bg-white border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#25251F] focus:ring-1 focus:ring-[#25251F] text-[#25251F] font-mono transition-all"
                />
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="absolute right-2.5 p-1 rounded-md text-[#77766E] hover:text-[#25251F] hover:bg-[#F1EFE8] transition-colors"
                  title="Copy URL"
                >
                  {copiedUrl ? (
                    <Check className="w-4 h-4 text-[#065F46]" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Brand & Default Product */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Brand Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-[#25251F] mb-1.5">
                Brand
              </label>
              <div className="relative">
                <div className="w-full flex items-center gap-2.5 bg-white border border-[#E5E1D8] rounded-xl px-3 py-2 text-xs sm:text-sm text-[#25251F]">
                  <div className="w-4 h-4 rounded bg-[#111111] flex-shrink-0" />
                  <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="w-full bg-transparent appearance-none focus:outline-none cursor-pointer pr-6 font-medium"
                  >
                    <option value="Evolyn">Evolyn</option>
                    <option value="Evolyn Enterprise">Evolyn Enterprise</option>
                    <option value="Evolyn Labs">Evolyn Labs</option>
                  </select>
                </div>
                <ChevronDown className="w-4 h-4 text-[#77766E] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Default Product */}
            <div>
              <label className="block text-xs font-semibold text-[#25251F] mb-1.5">
                Default Product
              </label>
              <div className="relative">
                <select
                  value={defaultProduct}
                  onChange={(e) => setDefaultProduct(e.target.value)}
                  className="w-full bg-white border border-[#E5E1D8] rounded-xl px-3.5 py-2.5 appearance-none focus:outline-none focus:border-[#25251F] focus:ring-1 focus:ring-[#25251F] text-xs sm:text-sm text-[#25251F] cursor-pointer pr-8 font-medium"
                >
                  <option value="Evolyn Platform">Evolyn Platform</option>
                  <option value="Enterprise Suite">Enterprise Suite</option>
                  <option value="Mobile App">Mobile App</option>
                  <option value="All Products">All Products</option>
                </select>
                <ChevronDown className="w-4 h-4 text-[#77766E] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Row 3: Workspace Description */}
          <div>
            <label className="block text-xs font-semibold text-[#25251F] mb-1.5">
              Workspace Description
            </label>
            <div className="relative">
              <textarea
                rows={3}
                value={workspaceDescription}
                maxLength={maxChars}
                onChange={(e) => setWorkspaceDescription(e.target.value)}
                placeholder="Brief description of this workspace's governance scope..."
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#25251F] focus:ring-1 focus:ring-[#25251F] text-[#25251F] leading-relaxed resize-none transition-all pb-6"
              />
              <span className="absolute right-3 bottom-2 text-[11px] text-[#A09D92] font-mono">
                {workspaceDescription.length} / {maxChars}
              </span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <hr className="border-[#E5E1D8]" />

        {/* Section 2: Appearance & Theme Mode (NEW) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-serif font-bold text-lg sm:text-xl text-[#25251F] tracking-tight">
                Appearance & Theme
              </h3>
              <p className="text-xs sm:text-sm text-[#77766E] mt-0.5">
                Switch between warm stone light mode and midnight charcoal dark mode.
              </p>
            </div>
            {/* Quick Switch Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[#77766E] hidden sm:inline">
                {isDark ? 'Dark Mode Active' : 'Light Mode Active'}
              </span>
              <ThemeToggle variant="switch" />
            </div>
          </div>

          {/* Theme Option Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Light Mode Card */}
            <button
              type="button"
              onClick={() => {
                setTheme('light');
                showToast('Switched to Light Mode');
              }}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                !isDark && theme === 'light'
                  ? 'border-[#25251F] bg-white ring-2 ring-[#25251F]/15 shadow-xs'
                  : 'border-[#E5E1D8] bg-white hover:bg-[#FAF9F5]'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-3">
                <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#E5E1D8] flex items-center justify-center text-[#25251F]">
                  <Sun className="w-4 h-4 text-[#F59E0B]" />
                </div>
                {!isDark && theme === 'light' && (
                  <span className="w-2 h-2 rounded-full bg-[#059669]" />
                )}
              </div>
              <div>
                <p className="font-semibold text-xs sm:text-sm text-[#25251F]">Light Theme</p>
                <p className="text-[11px] text-[#77766E] mt-0.5">Warm stone editorial palette</p>
              </div>
            </button>

            {/* Dark Mode Card */}
            <button
              type="button"
              onClick={() => {
                setTheme('dark');
                showToast('Switched to Dark Mode');
              }}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                isDark && theme === 'dark'
                  ? 'border-[#EDECE6] bg-[#24231F] ring-2 ring-[#EDECE6]/25 shadow-xs'
                  : 'border-[#E5E1D8] bg-white hover:bg-[#FAF9F5]'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-3">
                <div className="w-8 h-8 rounded-lg bg-[#18181B] text-white flex items-center justify-center">
                  <Moon className="w-4 h-4 text-[#E5A855]" />
                </div>
                {isDark && theme === 'dark' && (
                  <span className="w-2 h-2 rounded-full bg-[#059669]" />
                )}
              </div>
              <div>
                <p className="font-semibold text-xs sm:text-sm text-[#25251F]">Dark Theme</p>
                <p className="text-[11px] text-[#77766E] mt-0.5">Midnight charcoal executive palette</p>
              </div>
            </button>

            {/* System Sync Card */}
            <button
              type="button"
              onClick={() => {
                setTheme('system');
                showToast('Synchronized with system appearance');
              }}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                theme === 'system'
                  ? 'border-[#25251F] bg-white ring-2 ring-[#25251F]/15 shadow-xs'
                  : 'border-[#E5E1D8] bg-white hover:bg-[#FAF9F5]'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-3">
                <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#E5E1D8] flex items-center justify-center text-[#25251F]">
                  <Monitor className="w-4 h-4 text-[#77766E]" />
                </div>
                {theme === 'system' && (
                  <span className="w-2 h-2 rounded-full bg-[#059669]" />
                )}
              </div>
              <div>
                <p className="font-semibold text-xs sm:text-sm text-[#25251F]">System Sync</p>
                <p className="text-[11px] text-[#77766E] mt-0.5">Match operating system preference</p>
              </div>
            </button>
          </div>
        </div>

        {/* Divider */}
        <hr className="border-[#E5E1D8]" />

        {/* Section 3: Language & Regional Preferences (NEW) */}
        <div className="space-y-4">
          <div>
            <h3 className="font-serif font-bold text-lg sm:text-xl text-[#25251F] tracking-tight">
              Language & Regional Settings
            </h3>
            <p className="text-xs sm:text-sm text-[#77766E] mt-0.5">
              Set your workspace language, datetime formats, and timezone.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Language Picker */}
            <div>
              <label className="block text-xs font-semibold text-[#25251F] mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#77766E]" />
                Language
              </label>
              <div className="relative">
                <select
                  value={selectedLanguage}
                  onChange={(e) => {
                    setSelectedLanguage(e.target.value);
                    showToast(`Language set to ${e.target.options[e.target.selectedIndex].text}`);
                  }}
                  className="w-full bg-white border border-[#E5E1D8] rounded-xl px-3.5 py-2.5 appearance-none focus:outline-none focus:border-[#25251F] focus:ring-1 focus:ring-[#25251F] text-xs sm:text-sm text-[#25251F] cursor-pointer pr-8 font-medium"
                >
                  <option value="en-US">🇺🇸 English (United States)</option>
                  <option value="en-GB">🇬🇧 English (United Kingdom)</option>
                  <option value="de-DE">🇩🇪 Deutsch (German)</option>
                  <option value="fr-FR">🇫🇷 Français (French)</option>
                  <option value="es-ES">🇪🇸 Español (Spanish)</option>
                  <option value="ja-JP">🇯🇵 日本語 (Japanese)</option>
                </select>
                <ChevronDown className="w-4 h-4 text-[#77766E] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Date Format */}
            <div>
              <label className="block text-xs font-semibold text-[#25251F] mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#77766E]" />
                Date Format
              </label>
              <div className="relative">
                <select
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value)}
                  className="w-full bg-white border border-[#E5E1D8] rounded-xl px-3.5 py-2.5 appearance-none focus:outline-none focus:border-[#25251F] focus:ring-1 focus:ring-[#25251F] text-xs sm:text-sm text-[#25251F] cursor-pointer pr-8 font-medium font-mono"
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 11/07/2026)</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 07/11/2026)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-11-07)</option>
                </select>
                <ChevronDown className="w-4 h-4 text-[#77766E] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-xs font-semibold text-[#25251F] mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#77766E]" />
                Timezone
              </label>
              <div className="relative">
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full bg-white border border-[#E5E1D8] rounded-xl px-3.5 py-2.5 appearance-none focus:outline-none focus:border-[#25251F] focus:ring-1 focus:ring-[#25251F] text-xs sm:text-sm text-[#25251F] cursor-pointer pr-8 font-medium truncate"
                >
                  <option value="America/Los_Angeles">UTC-08:00 (Pacific Time)</option>
                  <option value="America/New_York">UTC-05:00 (Eastern Time)</option>
                  <option value="Europe/London">UTC+00:00 (London, GMT)</option>
                  <option value="Europe/Berlin">UTC+01:00 (Berlin, CET)</option>
                  <option value="Asia/Kolkata">UTC+05:30 (India Standard Time)</option>
                  <option value="Asia/Tokyo">UTC+09:00 (Tokyo, JST)</option>
                </select>
                <ChevronDown className="w-4 h-4 text-[#77766E] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <hr className="border-[#E5E1D8]" />

        {/* Section 4: Brand Assets */}
        <div className="space-y-4">
          <div>
            <h3 className="font-serif font-bold text-lg sm:text-xl text-[#25251F] tracking-tight">
              Brand Assets
            </h3>
            <p className="text-xs sm:text-sm text-[#77766E] mt-0.5">
              Upload your brand logo and define brand colors for consistent reviews.
            </p>
          </div>

          {/* Logo & Colors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
            {/* Left: Brand Logo (md:col-span-5) */}
            <div className="md:col-span-5 space-y-2">
              <label className="block text-xs font-semibold text-[#25251F]">
                Brand Logo
              </label>

              <div className="flex items-center gap-3">
                {/* Logo Box */}
                <div className="h-16 px-4 bg-white border border-[#E5E1D8] rounded-xl flex items-center justify-center gap-2 shadow-2xs">
                  {hasLogo ? (
                    <>
                      <Box className="w-5 h-5 text-[#111111] stroke-[2.2]" />
                      <span className="font-serif font-bold text-base text-[#111111] tracking-tight">
                        Evolyn
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-[#A09D92] italic">No logo uploaded</span>
                  )}
                </div>

                {/* Logo Action Buttons */}
                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setHasLogo(true);
                      showToast('Brand logo updated');
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#25251F] bg-white border border-[#E5E1D8] hover:bg-[#F1EFE8] rounded-lg transition-colors shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#77766E]" />
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHasLogo(false);
                      showToast('Brand logo removed');
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#77766E] hover:text-[#B91C1C] hover:bg-[#FEE2E2]/60 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-[#A09D92]">
                PNG, JPG or SVG (max 5 MB)
              </p>
            </div>

            {/* Right: Brand Colors (md:col-span-7) */}
            <div className="md:col-span-7 space-y-2">
              <label className="block text-xs font-semibold text-[#25251F]">
                Brand Colors
              </label>

              <div className="flex flex-wrap items-center gap-3">
                {colors.map((color) => (
                  <div key={color.id} className="flex flex-col items-center">
                    <div
                      className="w-14 h-10 rounded-xl border border-[#D5D1C7] shadow-xs transition-transform hover:scale-105 cursor-pointer"
                      style={{ backgroundColor: color.hex }}
                      title={`Click to copy ${color.hex}`}
                      onClick={() => {
                        navigator.clipboard?.writeText(color.hex);
                        showToast(`Copied ${color.hex} to clipboard`);
                      }}
                    />
                    <span className="text-[10px] font-mono font-semibold text-[#25251F] mt-1">
                      {color.hex}
                    </span>
                    <span className="text-[10px] text-[#77766E]">
                      {color.name}
                    </span>
                  </div>
                ))}

                {/* Add Color Button */}
                <button
                  type="button"
                  onClick={() => setIsColorModalOpen(true)}
                  className="w-14 h-10 rounded-xl border-2 border-dashed border-[#D5D1C7] hover:border-[#25251F] text-[#77766E] hover:text-[#25251F] bg-[#FAF9F5] flex flex-col items-center justify-center gap-0.5 transition-colors group cursor-pointer"
                >
                  <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-medium leading-none">Add Color</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-[#E5E1D8] flex items-center gap-3">
          <Button type="submit" variant="primary" size="md" className="bg-[#18181B] text-white">
            <Check className="w-4 h-4 mr-1.5 stroke-[2.5]" />
            Save Changes
          </Button>
          <Button type="button" variant="secondary" size="md" onClick={handleDiscard} className="bg-white">
            Discard
          </Button>
        </div>
      </form>

      {/* Add Color Modal */}
      {isColorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4">
            <h3 className="font-serif font-bold text-lg text-[#25251F]">Add Brand Color</h3>
            <div>
              <label className="block text-xs font-semibold text-[#25251F] mb-1">Color Role / Name</label>
              <input
                type="text"
                value={newColorName}
                onChange={(e) => setNewColorName(e.target.value)}
                placeholder="e.g., Muted Olive"
                className="w-full px-3 py-2 text-xs bg-white border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#25251F]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#25251F] mb-1">Hex Code</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={newColorHex}
                  onChange={(e) => setNewColorHex(e.target.value)}
                  className="w-9 h-9 rounded-lg border border-[#E5E1D8] cursor-pointer"
                />
                <input
                  type="text"
                  value={newColorHex}
                  onChange={(e) => setNewColorHex(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs font-mono bg-white border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#25251F]"
                />
              </div>
            </div>
            <div className="pt-2 flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsColorModalOpen(false)}>
                Cancel
              </Button>
              <Button type="button" variant="primary" size="sm" onClick={handleAddColor}>
                Add to Palette
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
