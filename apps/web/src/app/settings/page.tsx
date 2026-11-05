import { AppShell } from '@/components/layout/app-shell';

export default function SettingsPage() {
  return (
    <AppShell activeItem="Settings">
      <div className="space-y-4">
        <div className="pb-4 border-b border-[#E5E1D8]">
          <h1 className="font-serif text-2xl sm:text-3xl text-[#25251F] tracking-tight">
            Settings
          </h1>
          <p className="text-xs sm:text-sm text-[#73736C] mt-1">
            Workspace configuration, AI review thresholds, and team roles.
          </p>
        </div>

        <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl p-8 text-center space-y-2">
          <p className="text-sm font-medium text-[#25251F]">Route Scaffolding Ready</p>
          <p className="text-xs text-[#73736C]">
            Connected to application shell and navigation. Pending UI implementation.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
