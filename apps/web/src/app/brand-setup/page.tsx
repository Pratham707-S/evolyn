'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, Menu } from 'lucide-react';
import { AppShell, useAppShell } from '@/components/layout/app-shell';
import { apiClient } from '@/lib/api/client';
import type { BrandSetup, BrandGovernanceContext } from '@evolyn/shared';
import { SetupStepperBanner } from '@/components/shared/setup-stepper-banner';
import {
  BrandSetupStepper,
  StepItem,
  BrandProfileForm,
  BrandProfileData,
  BrandAssetsForm,
  BrandAssetsData,
  BrandVoiceForm,
  BrandVoiceData,
  BrandGovernanceForm,
  BrandGovernanceData,
  SetupProgressCard,
  BrandPreviewCard,
} from '@/features/brand-setup';

const STEPS: StepItem[] = [
  {
    id: 1,
    key: 'profile',
    label: 'Brand Profile',
    description: 'Basic brand information',
  },
  {
    id: 2,
    key: 'assets',
    label: 'Brand Assets',
    description: 'Logos, product images, and approved media',
  },
  {
    id: 3,
    key: 'voice',
    label: 'Voice & Tone',
    description: 'Brand personality and communication style',
  },
  {
    id: 4,
    key: 'governance',
    label: 'Governance',
    description: 'Key rules, approval flow, and ownership',
  },
];

function BrandSetupContent() {
  const router = useRouter();
  const { openMobileSidebar, showToast } = useAppShell();

  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Profile State
  const [profileData, setProfileData] = useState<BrandProfileData>({
    brandName: 'Evolyn',
    industry: 'Marketing Technology',
    description:
      'An AI-powered brand governance platform that helps marketing teams create on-brand, compliant, and evidence-backed content.',
    logoUrl: '',
    primaryColor: '#111111',
    secondaryColor: '#EDE7DE',
  });

  // Step 2: Assets State
  const [assetsData, setAssetsData] = useState<BrandAssetsData>({
    headerFont: 'Instrument Serif',
    bodyFont: 'DM Sans',
    mediaAssetsCount: 4,
  });

  // Step 3: Voice State
  const [voiceData, setVoiceData] = useState<BrandVoiceData>({
    formality: 3,
    boldness: 4,
    accessibility: 4,
    toneDescriptors: ['Authoritative', 'Precise', 'Modern'],
    dos: [
      'Use clear, active voice with quantifiable metrics',
      'Anchor claims to verifiable benchmark studies',
      'Maintain a calm, confident, and professional demeanor',
    ],
    donts: [
      'Never use hyperbole or unsubstantiated superlatives',
      'Do not disparage or directly mock competitors',
      'Avoid overly technical jargon in public marketing copy',
    ],
  });

  // Step 4: Governance State
  const [governanceData, setGovernanceData] = useState<BrandGovernanceData>({
    approvalStrategy: 'single',
    requireEvidence: true,
    blockCompetitors: true,
    enforcePalette: true,
    brandGuardianEmail: 'guardian@evolyn.ai',
    minComplianceScore: 85,
  });

  const [isSaving, setIsSaving] = useState(false);

  // Fetch live persisted brand setup on component mount
  useEffect(() => {
    let mounted = true;
    async function loadPersistedSetup() {
      try {
        const setup = await apiClient.get<BrandSetup>('/api/brand-setup');
        if (!mounted || !setup) return;

        setProfileData({
          brandName: setup.brandName,
          industry: setup.industry,
          description: setup.description,
          logoUrl: setup.logoUrl || '',
          primaryColor: setup.primaryColor,
          secondaryColor: setup.secondaryColor,
        });

        setAssetsData({
          headerFont: setup.headerFont,
          bodyFont: setup.bodyFont,
          mediaAssetsCount: 4,
        });

        if (setup.voiceTone) {
          setVoiceData({
            formality: setup.voiceTone.formality,
            boldness: setup.voiceTone.boldness,
            accessibility: setup.voiceTone.accessibility,
            toneDescriptors: setup.voiceTone.toneDescriptors,
            dos: setup.voiceTone.dos,
            donts: setup.voiceTone.donts,
          });
        }

        if (setup.governance) {
          setGovernanceData({
            approvalStrategy: (setup.governance.approvalStrategy as 'single' | 'dual' | 'automated') || 'single',
            requireEvidence: setup.governance.requireEvidence,
            blockCompetitors: setup.governance.blockCompetitors,
            enforcePalette: setup.governance.enforcePalette,
            brandGuardianEmail: setup.governance.brandGuardianEmail,
            minComplianceScore: setup.governance.minComplianceScore,
          });
        }
      } catch (err) {
        // Fall back gracefully to initial state
      }
    }
    loadPersistedSetup();
    return () => {
      mounted = false;
    };
  }, []);

  const persistCurrentSetup = async (isPublish = false) => {
    setIsSaving(true);
    const payload: BrandSetup = {
      brandName: profileData.brandName,
      industry: profileData.industry,
      description: profileData.description,
      logoUrl: profileData.logoUrl || '',
      primaryColor: profileData.primaryColor,
      secondaryColor: profileData.secondaryColor,
      headerFont: assetsData.headerFont,
      bodyFont: assetsData.bodyFont,
      voiceTone: {
        formality: voiceData.formality,
        boldness: voiceData.boldness,
        accessibility: voiceData.accessibility,
        toneDescriptors: voiceData.toneDescriptors,
        dos: voiceData.dos,
        donts: voiceData.donts,
      },
      governance: {
        approvalStrategy: governanceData.approvalStrategy,
        requireEvidence: governanceData.requireEvidence,
        blockCompetitors: governanceData.blockCompetitors,
        enforcePalette: governanceData.enforcePalette,
        brandGuardianEmail: governanceData.brandGuardianEmail,
        minComplianceScore: governanceData.minComplianceScore,
      },
    };

    try {
      await apiClient.post('/api/brand-setup', payload);
      showToast(
        isPublish
          ? `Brand Setup published and synced with Brand Governance AI.`
          : `Brand Setup draft persisted to database.`
      );

      if (isPublish) {
        try {
          const ctx = await apiClient.get<BrandGovernanceContext>('/api/brand-governance/context');
          const isGuidelinesDone = Boolean(ctx.rules && ctx.rules.length > 0);
          const isKnowledgeDone = Boolean(ctx.facts && ctx.facts.length > 0);

          setTimeout(() => {
            if (!isGuidelinesDone) {
              router.push('/guidelines');
            } else if (!isKnowledgeDone) {
              router.push('/knowledge-library');
            } else {
              router.push('/reviews');
            }
          }, 600);
        } catch {
          setTimeout(() => router.push('/guidelines'), 600);
        }
      }
    } catch (err) {
      console.error('Failed to persist brand setup:', err);
      showToast(
        isPublish
          ? 'Failed to publish brand setup to server.'
          : 'Failed to save brand setup to server.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDraft = () => {
    persistCurrentSetup(false);
  };

  const handlePublishSetup = () => {
    persistCurrentSetup(true);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="flex items-center gap-3">
          {/* Mobile menu trigger */}
          <button
            type="button"
            onClick={openMobileSidebar}
            aria-label="Open sidebar"
            className="lg:hidden p-2 -ml-2 rounded-lg text-[#73736C] hover:text-[#25251F] hover:bg-[#EAE6DF] cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className="font-serif text-2xl sm:text-3xl text-[#25251F] tracking-tight">
              Brand Setup
            </h1>
            <p className="text-xs sm:text-sm text-[#77766E] mt-0.5">
              Configure your brand's core identity, assets, and governance foundation in Evolyn.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => showToast('All notifications are up to date.')}
            className="p-2 sm:p-2.5 rounded-xl border border-[#E5E1D8] bg-[#FFFEFA] hover:bg-[#F2EFE8] text-[#25251F] transition-colors cursor-pointer shadow-2xs"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-[#E5E1D8] bg-[#FFFEFA] hover:bg-[#F2EFE8] text-xs sm:text-sm font-medium text-[#25251F] transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Draft'}
          </button>

          <button
            type="button"
            onClick={handlePublishSetup}
            disabled={isSaving}
            className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#25251F] hover:bg-[#383832] text-xs sm:text-sm font-semibold text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>{isSaving ? 'Publishing...' : 'Publish Setup'}</span>
          </button>
        </div>
      </div>

      {/* Governance Stepper Banner */}
      <SetupStepperBanner currentModule="brand-setup" />

      {/* 2. Stepper Wizard */}
      <BrandSetupStepper
        steps={STEPS}
        currentStep={currentStep}
        onStepClick={(stepId) => setCurrentStep(stepId)}
      />

      {/* 3. Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Active Step Form (8 cols on lg) */}
        <div className="lg:col-span-8 order-2 lg:order-1">
          {currentStep === 1 && (
            <BrandProfileForm
              data={profileData}
              onChange={(updated) =>
                setProfileData((prev) => ({ ...prev, ...updated }))
              }
              onNext={() => setCurrentStep(2)}
              showToast={showToast}
            />
          )}

          {currentStep === 2 && (
            <BrandAssetsForm
              data={assetsData}
              onChange={(updated) =>
                setAssetsData((prev) => ({ ...prev, ...updated }))
              }
              onPrev={() => setCurrentStep(1)}
              onNext={() => setCurrentStep(3)}
              showToast={showToast}
            />
          )}

          {currentStep === 3 && (
            <BrandVoiceForm
              data={voiceData}
              onChange={(updated) =>
                setVoiceData((prev) => ({ ...prev, ...updated }))
              }
              onPrev={() => setCurrentStep(2)}
              onNext={() => setCurrentStep(4)}
              showToast={showToast}
            />
          )}

          {currentStep === 4 && (
            <BrandGovernanceForm
              data={governanceData}
              onChange={(updated) =>
                setGovernanceData((prev) => ({ ...prev, ...updated }))
              }
              onPrev={() => setCurrentStep(3)}
              onPublish={handlePublishSetup}
              showToast={showToast}
            />
          )}
        </div>

        {/* Right Column: Setup Progress & Brand Preview (4 cols on lg) */}
        <div className="lg:col-span-4 order-1 lg:order-2 space-y-6">
          <SetupProgressCard
            steps={STEPS}
            currentStep={currentStep}
            onStepSelect={(stepId) => setCurrentStep(stepId)}
          />

          <BrandPreviewCard
            brandName={profileData.brandName}
            description={profileData.description}
            logoUrl={profileData.logoUrl}
            primaryColor={profileData.primaryColor}
            secondaryColor={profileData.secondaryColor}
          />
        </div>
      </div>
    </div>
  );
}

export default function BrandSetupPage() {
  return (
    <AppShell activeItem="Brand Setup">
      <BrandSetupContent />
    </AppShell>
  );
}
