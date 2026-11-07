'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Copy,
  Check,
  Plus,
  Box,
  Sun,
  Moon,
  Monitor,
  Globe,
  Clock,
  Calendar,
  Upload,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/lib/theme/theme-context';
import { useLanguage } from '@/lib/i18n/language-context';
import { SupportedLanguage } from '@/lib/i18n/translations';

interface BrandColorItem {
  id: string;
  hex: string;
  name: string;
}

interface GeneralSettingsFormProps {
  showToast: (msg: string) => void;
}

export function GeneralSettingsForm({ showToast }: GeneralSettingsFormProps) {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t, supportedLanguages } = useLanguage();
  const logoInputRef = useRef<HTMLInputElement | null>(null);

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
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(null);

  // Brand colors state
  const [colors, setColors] = useState<BrandColorItem[]>([
    { id: 'c1', hex: '#0B0B0B', name: 'Primary' },
    { id: 'c2', hex: '#F5EFE6', name: 'Secondary' },
    { id: 'c3', hex: '#6C5CE7', name: 'Accent' },
  ]);

  // Language & Regional state
  const [selectedLanguage, setSelectedLanguageState] = useState<SupportedLanguage>('en');
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [timezone, setTimezone] = useState('America/Los_Angeles');

  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isColorModalOpen, setIsColorModalOpen] = useState(false);
  const [newColorHex, setNewColorHex] = useState('#68745D');
  const [newColorName, setNewColorName] = useState('Subtle');

  const maxChars = 250;

  // Load from localStorage on mount
  const loadSavedSettings = () => {
    try {
      const saved = localStorage.getItem('evolyn_workspace_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.workspaceName) setWorkspaceName(parsed.workspaceName);
        if (parsed.workspaceUrl) setWorkspaceUrl(parsed.workspaceUrl);
        if (parsed.selectedBrand) setSelectedBrand(parsed.selectedBrand);
        if (parsed.defaultProduct) setDefaultProduct(parsed.defaultProduct);
        if (parsed.workspaceDescription) setWorkspaceDescription(parsed.workspaceDescription);
        if (parsed.selectedLanguage) {
          setSelectedLanguageState(parsed.selectedLanguage);
          setLanguage(parsed.selectedLanguage);
        }
        if (parsed.dateFormat) setDateFormat(parsed.dateFormat);
        if (parsed.timezone) setTimezone(parsed.timezone);
        if (typeof parsed.hasLogo === 'boolean') setHasLogo(parsed.hasLogo);
        if (parsed.customLogoUrl) setCustomLogoUrl(parsed.customLogoUrl);
        if (Array.isArray(parsed.colors) && parsed.colors.length > 0) setColors(parsed.colors);
      } else {
        setSelectedLanguageState(language);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadSavedSettings();
  }, []);

  const handleCopyUrl = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(`https://${workspaceUrl}`);
      setCopiedUrl(true);
      showToast('Copied workspace URL to clipboard');
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Logo file size exceeds 5 MB limit');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setCustomLogoUrl(result);
        setHasLogo(true);
        showToast('Logo uploaded successfully');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setCustomLogoUrl(null);
    setHasLogo(false);
    showToast('Logo removed');
  };

  const handleAddColor = () => {
    if (!newColorHex.trim()) return;
    const formattedHex = newColorHex.startsWith('#') ? newColorHex : `#${newColorHex}`;
    const updated = [
      ...colors,
      {
        id: `c-${Date.now()}`,
        hex: formattedHex,
        name: newColorName.trim() || 'Custom',
      },
    ];
    setColors(updated);
    setIsColorModalOpen(false);
    setNewColorName('');
    showToast(`Added ${formattedHex} to brand palette`);
  };

  const handleRemoveColor = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (colors.length <= 1) {
      showToast('Brand palette must contain at least one primary color');
      return;
    }
    const updated = colors.filter((c) => c.id !== id);
    setColors(updated);
    showToast('Color removed from palette');
  };

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setSelectedLanguageState(newLang);
    setLanguage(newLang);
    showToast(`Language updated to ${supportedLanguages.find((l) => l.code === newLang)?.name || newLang}`);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        workspaceName,
        workspaceUrl,
        selectedBrand,
        defaultProduct,
        workspaceDescription,
        selectedLanguage,
        dateFormat,
        timezone,
        hasLogo,
        customLogoUrl,
        colors,
      };
      localStorage.setItem('evolyn_workspace_settings', JSON.stringify(payload));
    } catch {
      // storage unavailable
    }
    showToast('Workspace settings saved successfully');
  };

  const handleDiscard = () => {
    loadSavedSettings();
    showToast('Changes discarded — reverted to last saved state');
  };

  return (
    <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl p-5 sm:p-6 shadow-2xs">
      <form onSubmit={handleSave} className="space-y-6">
        {/* Hidden file input for logo */}
        <input
          type="file"
          ref={logoInputRef}
          accept="image/png,image/jpeg,image/svg+xml"
          onChange={handleLogoUpload}
          className="hidden"
        />

        {/* Section 1: General Settings */}
        <div className="space-y-4">
          <div>
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#25251F] tracking-tight">
              {t('general.heading', 'General Settings')}
            </h2>
            <p className="text-xs sm:text-sm text-[#77766E] mt-0.5">
              {t('general.subheading', 'Basic workspace and brand configuration.')}
            </p>
          </div>

          {/* Row 1: Workspace Name & Workspace URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#25251F] mb-1.5">
                {t('general.workspaceName', 'Workspace Name')} <span className="text-[#B91C1C]">*</span>
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

            <div>
              <label className="block text-xs font-semibold text-[#25251F] mb-1.5">
                {t('general.workspaceUrl', 'Workspace URL')}
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={workspaceUrl}
                  onChange={(e) => setWorkspaceUrl(e.target.value)}
                  className="w-full pl-3.5 pr-20 py-2.5 text-xs sm:text-sm bg-[#FAF8F5] border border-[#E5E1D8] rounded-xl font-mono text-[#52524E] focus:outline-none focus:border-[#25251F]"
                />
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="absolute right-1.5 px-2.5 py-1 text-xs font-medium text-[#77766E] hover:text-[#25251F] hover:bg-white rounded-lg border border-transparent hover:border-[#E5E1D8] transition-colors flex items-center gap-1 cursor-pointer"
                  title="Copy full URL"
                >
                  {copiedUrl ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#059669]" />
                      <span className="text-[#059669] text-[11px]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Default Brand & Default Product */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#25251F] mb-1.5">
                {t('general.defaultBrand', 'Default Brand')}
              </label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#25251F] text-[#25251F]"
              >
                <option value="Evolyn">Evolyn</option>
                <option value="Novara">Novara</option>
                <option value="Aura">Aura Design System</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#25251F] mb-1.5">
                {t('general.productScope', 'Default Product Scope')}
              </label>
              <select
                value={defaultProduct}
                onChange={(e) => setDefaultProduct(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#25251F] text-[#25251F]"
              >
                <option value="Evolyn Platform">Evolyn Platform</option>
                <option value="Evolyn Enterprise Cloud">Evolyn Enterprise Cloud</option>
                <option value="Evolyn AI Engine">Evolyn AI Engine</option>
              </select>
            </div>
          </div>

          {/* Row 3: Workspace Description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-[#25251F]">
                {t('general.description', 'Workspace Description')}
              </label>
              <span className="text-[11px] text-[#77766E]">
                {workspaceDescription.length}/{maxChars}
              </span>
            </div>
            <textarea
              rows={3}
              maxLength={maxChars}
              value={workspaceDescription}
              onChange={(e) => setWorkspaceDescription(e.target.value)}
              placeholder="Brief description of this workspace's purpose..."
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#25251F] focus:ring-1 focus:ring-[#25251F] text-[#25251F] transition-all resize-none"
            />
          </div>
        </div>

        {/* Section 2: Visual Identity (Logo & Brand Colors) */}
        <div className="pt-5 border-t border-[#EFECE6] space-y-4">
          <div>
            <h3 className="font-serif font-bold text-lg text-[#25251F] tracking-tight">
              {t('general.visualIdentity', 'Visual Identity & Assets')}
            </h3>
            <p className="text-xs text-[#77766E] mt-0.5">
              {t('general.visualDesc', 'Brand icons, badges, and primary palette tokens.')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
            {/* Left: Workspace Logo (md:col-span-5) */}
            <div className="md:col-span-5 space-y-2">
              <label className="block text-xs font-semibold text-[#25251F]">
                {t('general.logo', 'Workspace Logo')}
              </label>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-[#111111] flex items-center justify-center text-white border border-[#E5E1D8] shadow-xs overflow-hidden relative group">
                  {hasLogo ? (
                    customLogoUrl ? (
                      <img
                        src={customLogoUrl}
                        alt="Workspace Logo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Box className="w-7 h-7 stroke-[2.2]" />
                    )
                  ) : (
                    <span className="text-xs text-[#77766E] italic">None</span>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="px-3 py-1.5 text-xs font-medium bg-white hover:bg-[#FAF9F5] border border-[#E5E1D8] hover:border-[#25251F] text-[#25251F] rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{customLogoUrl ? 'Replace' : 'Upload'}</span>
                    </button>
                    {hasLogo && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="px-2.5 py-1.5 text-xs font-medium text-[#77766E] hover:text-[#B91C1C] transition-colors cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-[#77766E]">{t('general.logoHelp', 'PNG, JPG or SVG (max 5 MB)')}</p>
                </div>
              </div>
            </div>

            {/* Right: Brand Colors (md:col-span-7) */}
            <div className="md:col-span-7 space-y-2">
              <label className="block text-xs font-semibold text-[#25251F]">
                {t('general.brandColors', 'Brand Colors')}
              </label>

              <div className="flex flex-wrap items-center gap-3">
                {colors.map((color) => (
                  <div key={color.id} className="flex flex-col items-center relative group">
                    <div
                      className="w-14 h-10 rounded-xl border border-[#D5D1C7] shadow-xs transition-transform hover:scale-105 cursor-pointer relative"
                      style={{ backgroundColor: color.hex }}
                      title={`Click to copy ${color.hex}`}
                      onClick={() => {
                        if (typeof navigator !== 'undefined' && navigator.clipboard) {
                          navigator.clipboard.writeText(color.hex);
                          showToast(`Copied ${color.hex} to clipboard`);
                        }
                      }}
                    >
                      {/* Delete icon on hover */}
                      <button
                        type="button"
                        onClick={(e) => handleRemoveColor(color.id, e)}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#18181B] text-white opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] shadow-sm transition-opacity hover:bg-[#B91C1C] cursor-pointer"
                        title="Remove color"
                      >
                        ×
                      </button>
                    </div>
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
                  <span className="text-[9px] font-medium leading-none">{t('general.addColor', 'Add Color')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Interface & Theme Preference */}
        <div className="pt-5 border-t border-[#EFECE6] space-y-3">
          <div>
            <h3 className="font-serif font-bold text-lg text-[#25251F] tracking-tight">
              {t('general.themeHeading', 'Interface Theme & Appearance')}
            </h3>
            <p className="text-xs text-[#77766E] mt-0.5">
              {t('general.themeDesc', 'Customize contrast and color presentation across Evolyn.')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'light', label: 'Light', desc: 'Warm cream & dark obsidian', icon: Sun },
              { id: 'dark', label: 'Dark', desc: 'Deep obsidian for low-light environments', icon: Moon },
              { id: 'system', label: 'System', desc: 'Match your operating system appearance', icon: Monitor },
            ].map((mode) => {
              const Icon = mode.icon;
              const isSelected = theme === mode.id;

              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setTheme(mode.id as any)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#18181B] bg-white ring-1 ring-[#18181B] shadow-xs'
                      : 'border-[#E5E1D8] bg-[#FAF8F5] hover:border-[#D5D1C7]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xs font-semibold text-[#25251F]">{mode.label}</span>
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-[#18181B]' : 'text-[#77766E]'}`} />
                  </div>
                  <p className="text-[11px] text-[#77766E]">{mode.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 4: Regional & Language Preferences */}
        <div className="pt-5 border-t border-[#EFECE6] space-y-4">
          <div>
            <h3 className="font-serif font-bold text-lg text-[#25251F] tracking-tight">
              {t('general.regionalHeading', 'Language & Regional')}
            </h3>
            <p className="text-xs text-[#77766E] mt-0.5">
              {t('general.regionalDesc', 'Application interface language, timezone, and date format.')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#25251F] mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#77766E]" />
                {t('general.language', 'Application Language')}
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#25251F] text-[#25251F] font-medium"
              >
                {supportedLanguages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name} ({lang.nativeName})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-[#77766E] mt-1">
                {supportedLanguages.find((l) => l.code === selectedLanguage)?.description}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#25251F] mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#77766E]" />
                {t('general.dateFormat', 'Date Format')}
              </label>
              <select
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#25251F] text-[#25251F]"
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY (11/07/2026)</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY (07/11/2026)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (2026-11-07)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#25251F] mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#77766E]" />
                {t('general.timezone', 'Timezone')}
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#25251F] text-[#25251F]"
              >
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="Europe/London">Greenwich Mean Time (GMT)</option>
                <option value="Europe/Paris">Central European Time (CET)</option>
                <option value="Asia/Tokyo">Japan Standard Time (JST)</option>
                <option value="Asia/Kolkata">India Standard Time (IST)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-[#E5E1D8] flex items-center gap-3">
          <Button type="submit" variant="primary" size="md" className="bg-[#18181B] text-white cursor-pointer">
            <Check className="w-4 h-4 mr-1.5 stroke-[2.5]" />
            {t('general.save', 'Save Changes')}
          </Button>
          <Button type="button" variant="secondary" size="md" onClick={handleDiscard} className="bg-white border border-[#E5E1D8] cursor-pointer">
            {t('general.discard', 'Discard')}
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
