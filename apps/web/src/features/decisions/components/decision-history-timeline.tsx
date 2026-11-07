'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Edit3,
  XCircle,
  Linkedin,
  Globe,
  Mail,
  BookOpen,
  Instagram,
  Calendar,
  Clock,
  ChevronRight,
  LayoutGrid,
  List,
  Search,
  Filter,
  X,
  Layers,
} from 'lucide-react';

export interface TimelineDecision {
  id: string;
  title: string;
  channel: 'LinkedIn' | 'Website' | 'Email' | 'Blog' | 'Instagram' | string;
  decision: 'Approved' | 'Changes Requested' | 'Rejected';
  reviewerName: string;
  reviewerInitials?: string;
  timeAgo: string;
  submissionId: string;
  content: string;
  decisionNote: string;
  findingsCount: number;
  dayIndex: number; // 0: Mon, 1: Tue, 2: Wed, 3: Thu (Today), 4: Fri, 5: Sat, 6: Sun
  spanDays?: number; // width in day columns (default 2)
  trackIndex: number; // 0: Social, 1: Web, 2: Email, 3: Editorial
  timelineSteps: Array<{
    title: string;
    description: string;
    timeAgo: string;
    completed: boolean;
  }>;
}

export interface DecisionHistoryTimelineProps {
  items: TimelineDecision[];
  selectedId: string;
  onSelect: (item: TimelineDecision) => void;
  statusFilter?: string | null;
  onFilterChange?: (filter: string | null) => void;
}

export function DecisionHistoryTimeline({
  items,
  selectedId,
  onSelect,
  statusFilter,
  onFilterChange,
}: DecisionHistoryTimelineProps) {
  const [viewMode, setViewMode] = useState<'gantt' | 'list'>('gantt');
  const [searchQuery, setSearchQuery] = useState('');
  const [localStatus, setLocalStatus] = useState('ALL');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedChannel, setSelectedChannel] = useState('ALL');

  const activeStatus = statusFilter || (localStatus === 'ALL' ? null : localStatus);

  // Dynamic real-time calculation for the current 7-day week
  const { daysOfWeek, weekRangeLabel, liveMarkerLeft, liveTimeString } = React.useMemo(() => {
    const now = new Date();
    // 0 = Mon, 1 = Tue, ..., 5 = Sat, 6 = Sun
    const currentDayIdx = (now.getDay() + 6) % 7;

    const monday = new Date(now);
    monday.setDate(now.getDate() - currentDayIdx);
    monday.setHours(0, 0, 0, 0);

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const days = dayNames.map((name, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const isToday = d.toDateString() === now.toDateString();
      const dateStr = String(d.getDate()).padStart(2, '0');
      const monthStr = monthNames[d.getMonth()];
      return {
        name,
        date: dateStr,
        month: monthStr,
        fullDate: `${name}, ${monthStr} ${dateStr}${isToday ? ' (Today)' : ''}`,
        index: i,
        isToday,
      };
    });

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const range = `${monthNames[monday.getMonth()]} ${String(monday.getDate()).padStart(2, '0')} – ${monthNames[sunday.getMonth()]} ${String(sunday.getDate()).padStart(2, '0')}`;

    // Place marker accurately in the center of the current day column
    // Each column is 100% / 7 ≈ 14.2857%
    const colCenterPct = ((currentDayIdx + 0.5) / 7) * 100;
    const hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const h12 = hours % 12 || 12;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const timeStr = `${h12}:${minutes} ${ampm}`;

    return {
      daysOfWeek: days,
      weekRangeLabel: range,
      liveMarkerLeft: `${colCenterPct.toFixed(2)}%`,
      liveTimeString: timeStr,
    };
  }, []);

  const swimlanes = [
    { title: 'Social & Growth Campaigns', track: 0 },
    { title: 'Web & Core Messaging', track: 1 },
    { title: 'Email & Lifecycle Marketing', track: 2 },
    { title: 'Editorial, PR & Case Studies', track: 3 },
  ];

  const getChannelIcon = (channel: string) => {
    switch (channel.toLowerCase()) {
      case 'linkedin':
        return <Linkedin className="w-3.5 h-3.5 text-[#0A66C2]" />;
      case 'website':
        return <Globe className="w-3.5 h-3.5 text-[#25251F]" />;
      case 'email':
        return <Mail className="w-3.5 h-3.5 text-[#77766E]" />;
      case 'blog':
        return <BookOpen className="w-3.5 h-3.5 text-[#68745D]" />;
      case 'instagram':
        return <Instagram className="w-3.5 h-3.5 text-[#E4405F]" />;
      default:
        return <Globe className="w-3.5 h-3.5 text-[#77766E]" />;
    }
  };

  /**
   * Crisp, clean project design system colors:
   * Approved -> Soft sage `#EEF4EE`, text `#2A4530`, border `#C6DBC8`
   * Changes Requested -> Soft warm amber `#FDF4E7`, text `#7A4E1B`, border `#F0D5B5`
   * Rejected -> Soft crimson `#FDEAEA`, text `#7D2E27`, border `#F4BFB9`
   */
  const getDecisionTheme = (decision: string) => {
    if (decision === 'Approved') {
      return {
        cardBg: 'bg-[#FFFEFA] dark:bg-[#1E1D19] border-[#C8DEC9] dark:border-[#2C4832] hover:border-[#64816A] hover:bg-[#F7FAF7] dark:hover:bg-[#252C23]',
        badgeBg: 'bg-[#EEF4EE] dark:bg-[#1E2E22] text-[#36533D] dark:text-[#A7F3D0] border-[#D1E2D3] dark:border-[#2C4832]',
        accentDot: 'bg-[#64816A]',
        textSecondary: 'text-[#5C7761] dark:text-[#86EFAC]',
        iconBg: 'bg-[#EEF4EE] dark:bg-[#1E2E22]',
        indicator: 'border-l-4 border-l-[#64816A]',
      };
    }
    if (decision === 'Changes Requested') {
      return {
        cardBg: 'bg-[#FFFEFA] dark:bg-[#1E1D19] border-[#F2D8B9] dark:border-[#4A3B22] hover:border-[#B78A4A] hover:bg-[#FDF9F2] dark:hover:bg-[#2C261A]',
        badgeBg: 'bg-[#FDF4E7] dark:bg-[#2F2414] text-[#865920] dark:text-[#FDE047] border-[#F0D5B5] dark:border-[#4A3B22]',
        accentDot: 'bg-[#B78A4A]',
        textSecondary: 'text-[#876536] dark:text-[#FDE047]',
        iconBg: 'bg-[#FDF4E7] dark:bg-[#2F2414]',
        indicator: 'border-l-4 border-l-[#B78A4A]',
      };
    }
    return {
      cardBg: 'bg-[#FFFEFA] dark:bg-[#1E1D19] border-[#F5C5C0] dark:border-[#4A2624] hover:border-[#B56E63] hover:bg-[#FDF6F6] dark:hover:bg-[#2D1B1B]',
      badgeBg: 'bg-[#FDEAEA] dark:bg-[#331818] text-[#8A332B] dark:text-[#FCA5A5] border-[#F4BFB9] dark:border-[#4A2624]',
      accentDot: 'bg-[#B56E63]',
      textSecondary: 'text-[#8C463F] dark:text-[#FCA5A5]',
      iconBg: 'bg-[#FDEAEA] dark:bg-[#331818]',
      indicator: 'border-l-4 border-l-[#B56E63]',
    };
  };

  // Filter decisions based on Status, Day, Channel, and Search text
  const filteredItems = items.filter((item) => {
    // 1. Status Filter
    const matchesStatus =
      !activeStatus ||
      activeStatus === 'ALL' ||
      item.decision.toLowerCase() === activeStatus.toLowerCase();

    // 2. Day Filter: strictly match the actual day of review
    const matchesDay = selectedDay === null || item.dayIndex === selectedDay;

    // 3. Channel Filter
    const matchesChannel =
      selectedChannel === 'ALL' ||
      item.channel.toLowerCase() === selectedChannel.toLowerCase();

    // 4. Search Filter
    const matchesSearch =
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.reviewerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.channel.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesDay && matchesChannel && matchesSearch;
  });

  // Calculate status counts
  const counts = {
    all: items.length,
    approved: items.filter((it) => it.decision === 'Approved').length,
    changes: items.filter((it) => it.decision === 'Changes Requested').length,
    rejected: items.filter((it) => it.decision === 'Rejected').length,
  };

  const selectedDayInfo = daysOfWeek.find((d) => d.index === selectedDay);

  return (
    <div className="bg-[#FFFEFA] dark:bg-[#1E1D19] border border-[#E5E1D8] dark:border-[#2C2B26] rounded-xl p-5 sm:p-7 space-y-6 shadow-2xs">
      {/* 1. Primary Wide Filter Toolbar */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Section Title */}
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="font-serif text-2xl sm:text-[26px] font-normal text-[#25251F] dark:text-[#F7F5F0] tracking-tight">
                Decision Timeline
              </h2>
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#68745D] dark:text-[#8A987D] bg-[#E8EBE1] dark:bg-[#272B23] px-2.5 py-0.5 rounded-full font-medium">
                {weekRangeLabel}
              </span>
            </div>
            <p className="text-xs text-[#77766E] dark:text-[#A09D92] mt-1">
              Trace review outcomes across channels and dates. Click on any decision card to inspect findings and audit evidence.
            </p>
          </div>

          {/* Right: Search Bar & View Mode Toggle */}
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 text-[#A09D92] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by title, reviewer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#FAF9F5] dark:bg-[#262520] border border-[#E5E1D8] dark:border-[#2C2B26] text-[#25251F] dark:text-[#F7F5F0] placeholder:text-[#A09D92] text-xs pl-9 pr-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#68745D] transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A09D92] hover:text-[#25251F] dark:hover:text-[#F7F5F0]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#F1EFE8] dark:bg-[#141412] p-1 rounded-lg border border-[#E5E1D8] dark:border-[#2C2B26] shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('gantt')}
                title="Schedule Timeline View"
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                  viewMode === 'gantt'
                    ? 'bg-[#FFFEFA] dark:bg-[#262520] text-[#25251F] dark:text-[#F7F5F0] shadow-2xs font-semibold'
                    : 'text-[#77766E] dark:text-[#A09D92] hover:text-[#25251F] dark:hover:text-[#F7F5F0]'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Schedule</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('list')}
                title="Linear Audit List View"
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                  viewMode === 'list'
                    ? 'bg-[#FFFEFA] dark:bg-[#262520] text-[#25251F] dark:text-[#F7F5F0] shadow-2xs font-semibold'
                    : 'text-[#77766E] dark:text-[#A09D92] hover:text-[#25251F] dark:hover:text-[#F7F5F0]'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>List Feed</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. Wide Status Filter Tabs (Prominent & Spacious) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {[
            {
              id: 'ALL',
              label: 'All Decisions',
              count: counts.all,
              activeClasses: 'bg-[#25251F] text-white border-[#25251F]',
              badgeActive: 'bg-white/20 text-white',
            },
            {
              id: 'Approved',
              label: 'Approved',
              count: counts.approved,
              activeClasses: 'bg-[#64816A] text-white border-[#55725B]',
              badgeActive: 'bg-white/25 text-white',
            },
            {
              id: 'Changes Requested',
              label: 'Changes Requested',
              count: counts.changes,
              activeClasses: 'bg-[#B78A4A] text-white border-[#A1773B]',
              badgeActive: 'bg-white/25 text-white',
            },
            {
              id: 'Rejected',
              label: 'Rejected',
              count: counts.rejected,
              activeClasses: 'bg-[#B56E63] text-white border-[#9E5A50]',
              badgeActive: 'bg-white/25 text-white',
            },
          ].map((tab) => {
            const isSelected = (activeStatus || 'ALL') === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  const nextVal = tab.id === 'ALL' ? null : tab.id;
                  setLocalStatus(tab.id);
                  if (onFilterChange) onFilterChange(nextVal);
                }}
                className={`w-full py-2 px-2.5 sm:px-3.5 rounded-xl border text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? `${tab.activeClasses} shadow-sm`
                    : 'bg-[#FAF9F5] border-[#E5E1D8] text-[#77766E] hover:text-[#25251F] hover:bg-[#F1EFE8] hover:border-[#68745D]/40'
                }`}
              >
                <span className="truncate">{tab.label}</span>
                <span
                  className={`text-[10px] sm:text-[11px] font-mono px-1.5 sm:px-2 py-0.5 rounded-full shrink-0 ml-1.5 ${
                    isSelected ? tab.badgeActive : 'bg-[#E5E1D8]/60 text-[#25251F]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* 3. Interactive Date Strip (Click a date to see that particular day's work) */}
        <div className="bg-[#FAF9F5] dark:bg-[#1E1D19] border border-[#E5E1D8] dark:border-[#2C2B26] rounded-xl p-2.5 sm:p-3 flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-full">
            <span className="text-[#77766E] dark:text-[#A09D92] font-medium flex items-center gap-1.5 text-xs mr-1 shrink-0">
              <Calendar className="w-3.5 h-3.5 text-[#68745D] dark:text-[#8A987D]" />
              Filter by Day:
            </span>

            {/* "All Week" reset button */}
            <button
              type="button"
              onClick={() => setSelectedDay(null)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                selectedDay === null
                  ? 'bg-[#25251F] dark:bg-[#F7F5F0] text-white dark:text-[#18181B] shadow-2xs font-semibold'
                  : 'bg-[#FFFEFA] dark:bg-[#262520] border border-[#E5E1D8] dark:border-[#2C2B26] text-[#77766E] dark:text-[#A09D92] hover:text-[#25251F] dark:hover:text-[#F7F5F0] hover:bg-[#F1EFE8] dark:hover:bg-[#33322C]'
              }`}
            >
              All Days ({items.length})
            </button>

            {/* Individual Day Buttons */}
            {daysOfWeek.map((day) => {
              const dayItemCount = items.filter((it) => it.dayIndex === day.index).length;
              const isDaySelected = selectedDay === day.index;

              return (
                <button
                  key={day.index}
                  type="button"
                  onClick={() => setSelectedDay(isDaySelected ? null : day.index)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 shrink-0 ${
                    isDaySelected
                      ? 'bg-[#68745D] text-white shadow-xs font-semibold'
                      : day.isToday
                      ? 'bg-[#E8EBE1] dark:bg-[#2A2924] text-[#25251F] dark:text-[#F7F5F0] border border-[#68745D]/40 font-medium hover:bg-[#68745D] hover:text-white'
                      : 'bg-[#FFFEFA] dark:bg-[#262520] border border-[#E5E1D8] dark:border-[#2C2B26] text-[#77766E] dark:text-[#A09D92] hover:text-[#25251F] dark:hover:text-[#F7F5F0] hover:bg-[#F1EFE8] dark:hover:bg-[#33322C]'
                  }`}
                >
                  <span className="uppercase text-[10px]">{day.name}</span>
                  <span className="font-semibold">{day.date}</span>
                  {dayItemCount > 0 && (
                    <span
                      className={`text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-mono ${
                        isDaySelected
                          ? 'bg-white/25 text-white'
                          : 'bg-[#E5E1D8] dark:bg-[#3D3A32] text-[#25251F] dark:text-[#F7F5F0]'
                      }`}
                    >
                      {dayItemCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Day Filter Notification Banner */}
          {selectedDay !== null && selectedDayInfo && (
            <div className="flex items-center gap-2 bg-[#E8EBE1]/70 dark:bg-[#272B23] text-[#25251F] dark:text-[#F7F5F0] px-3 py-1 rounded-lg border border-[#68745D]/30 shrink-0">
              <span className="font-medium text-xs">
                Showing work for {selectedDayInfo.fullDate} ({filteredItems.length})
              </span>
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className="text-[#68745D] dark:text-[#8A987D] hover:text-[#25251F] dark:hover:text-[#F7F5F0] ml-1 p-0.5 rounded hover:bg-[#E8EBE1] dark:hover:bg-[#33382D]"
                title="Clear day filter"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. Schedule Timeline Gantt View */}
      {viewMode === 'gantt' && (
        <div className="space-y-2">
          {/* Mobile Swipe Hint Notice */}
          <div className="md:hidden flex items-center justify-between text-[11px] text-[#77766E] dark:text-[#A09D92] bg-[#FAF9F5] dark:bg-[#1E1D19] border border-[#E5E1D8] dark:border-[#2C2B26] px-3 py-1.5 rounded-xl">
            <span className="flex items-center gap-1">
              👉 Swipe horizontally to view full schedule
            </span>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="text-[#68745D] dark:text-[#8A987D] font-semibold underline"
            >
              List View
            </button>
          </div>

          <div className="overflow-x-auto pb-2 scroll-smooth">
          <div className="min-w-[1020px] border border-[#E5E1D8] dark:border-[#2C2B26] rounded-xl bg-[#FAF9F5] dark:bg-[#141412] p-5 relative">
            {/* Days Column Header Grid (Non-overlapping, clean layout) */}
            <div className="grid grid-cols-7 gap-3 pb-4 mb-4 border-b border-[#E5E1D8] dark:border-[#2C2B26] text-center text-xs relative z-20">
              {daysOfWeek.map((day) => {
                const isDaySelected = selectedDay === day.index;

                return (
                  <button
                    key={day.index}
                    type="button"
                    onClick={() => setSelectedDay(isDaySelected ? null : day.index)}
                    className={`py-2 px-2 rounded-xl flex flex-col items-center transition-all cursor-pointer ${
                      isDaySelected
                        ? 'bg-[#68745D] text-white shadow-xs'
                        : day.isToday
                        ? 'bg-[#E8EBE1] dark:bg-[#2A2924] text-[#25251F] dark:text-[#F7F5F0] ring-1 ring-[#68745D]/40 font-semibold'
                        : 'text-[#77766E] dark:text-[#A09D92] hover:bg-[#FFFEFA] dark:hover:bg-[#262520] hover:text-[#25251F] dark:hover:text-[#F7F5F0]'
                    }`}
                  >
                    <span className="text-[11px] uppercase tracking-wider">{day.name}</span>
                    <span className="font-serif text-lg leading-tight mt-0.5">{day.date}</span>
                    {day.isToday && (
                      <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.2 rounded-full mt-1 ${isDaySelected ? 'bg-white/20 text-white' : 'bg-[#68745D] text-white'}`}>
                        Today
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Timeline Swimlanes Container with Slid-Down Live Marker */}
            <div className="relative pt-7 space-y-4">
              {/* Slid-Down Live Marker: tracks real-time today column with clean gap below header box */}
              <div
                style={{ left: liveMarkerLeft }}
                className="absolute top-0 bottom-0 w-[2px] bg-[#68745D]/60 z-10 pointer-events-none"
              >
                {/* Live Pill badge positioned cleanly in the ruler gap with proper spacing from the day box */}
                <div className="absolute top-1 -translate-x-1/2 bg-[#25251F] dark:bg-[#2A2924] text-white dark:text-[#F7F5F0] border border-transparent dark:border-[#3D3A32] text-[10px] font-sans px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1.5 z-30 pointer-events-auto whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#64816A] animate-pulse" />
                  <span>{liveTimeString}</span>
                </div>
              </div>

              {/* Background Grid Vertical Dividing Guidelines */}
              <div className="grid grid-cols-7 gap-3 absolute inset-x-0 top-0 bottom-0 pointer-events-none opacity-40">
                {daysOfWeek.map((_, i) => (
                  <div
                    key={i}
                    className="border-r border-dashed border-[#E5E1D8] dark:border-[#2C2B26] h-full last:border-r-0"
                  />
                ))}
              </div>

              {/* Swimlane Tracks */}
              {swimlanes.map((lane) => {
                const laneItems = filteredItems.filter(
                  (it) => it.trackIndex === lane.track
                );

                return (
                  <div key={lane.track} className="space-y-1.5 relative z-20">
                    {/* Swimlane Header Label */}
                    <div className="text-[11px] font-medium text-[#77766E] dark:text-[#A09D92] uppercase tracking-wider flex items-center gap-1.5 pl-1">
                      <Layers className="w-3 h-3 text-[#A09D92]" />
                      <span>{lane.title}</span>
                    </div>

                    {/* Lane Track Grid */}
                    <div className="grid grid-cols-7 gap-3 min-h-[66px] bg-[#FFFEFA]/90 dark:bg-[#1E1D19] border border-[#E5E1D8] dark:border-[#2C2B26] rounded-xl p-2.5 items-start relative">
                      {laneItems.length === 0 ? (
                        <div className="col-span-7 text-center text-xs text-[#A09D92] dark:text-[#77766E] py-2 italic font-normal">
                          No reviews logged for this category matching current filters
                        </div>
                      ) : (
                        laneItems.map((item) => {
                          const theme = getDecisionTheme(item.decision);
                          const startCol = item.dayIndex;
                          const spanCol = item.spanDays ?? 1;

                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => onSelect(item)}
                              style={{
                                gridColumnStart: startCol + 1,
                                gridColumnEnd: `span ${Math.min(spanCol, 7 - startCol)}`,
                              }}
                              className={`group text-left p-2.5 rounded-xl border transition-all flex flex-col justify-between gap-1.5 cursor-pointer shadow-2xs hover:shadow-md hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-[#68745D] ${theme.cardBg} ${theme.indicator} w-full min-w-0 overflow-hidden`}
                            >
                              {/* Top row: Icon + Title + Chevron */}
                              <div className="flex items-center gap-1.5 min-w-0 w-full">
                                <div
                                  className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border border-[#E5E1D8]/60 dark:border-[#2C2B26] ${theme.iconBg}`}
                                >
                                  {getChannelIcon(item.channel)}
                                </div>

                                <p
                                  className="text-xs font-semibold text-[#25251F] dark:text-[#F7F5F0] group-hover:text-[#68745D] dark:group-hover:text-[#8A987D] transition-colors truncate leading-tight flex-1 min-w-0"
                                  title={item.title}
                                >
                                  {item.title}
                                </p>

                                <ChevronRight className="w-3.5 h-3.5 text-[#A09D92] dark:text-[#77766E] group-hover:text-[#25251F] dark:group-hover:text-[#F7F5F0] group-hover:translate-x-0.5 transition-all shrink-0 ml-auto" />
                              </div>

                              {/* Bottom row: Time / Reviewer + Status Badge */}
                              <div className="flex items-center justify-between gap-1.5 w-full pt-1 border-t border-[#E5E1D8]/40 dark:border-[#2C2B26]">
                                <span className="text-[10px] text-[#77766E] dark:text-[#A09D92] truncate">
                                  {item.timeAgo}
                                </span>

                                <span
                                  className={`text-[9.5px] px-2 py-0.5 rounded-full font-medium border shrink-0 ${theme.badgeBg}`}
                                >
                                  {item.decision}
                                </span>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        </div>
      )}

      {/* 5. Alternative Linear List View */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl text-xs text-[#77766E]">
              No decisions match the selected criteria.
            </div>
          ) : (
            filteredItems.map((item) => {
              const theme = getDecisionTheme(item.decision);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect(item)}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between gap-3 shadow-2xs hover:shadow-md cursor-pointer ${theme.cardBg} ${theme.indicator}`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-[#E5E1D8]/60 ${theme.iconBg}`}
                    >
                      {getChannelIcon(item.channel)}
                    </div>

                    <div className="min-w-0">
                      <p className="font-medium text-xs sm:text-sm text-[#25251F] truncate">
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-[#77766E] truncate mt-0.5">
                        <span className="font-medium text-[#25251F]">{item.channel}</span>
                        <span>•</span>
                        <span>{item.submissionId}</span>
                        <span>•</span>
                        <span>Reviewer: {item.reviewerName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium border ${theme.badgeBg}`}
                    >
                      {item.decision}
                    </span>
                    <span className="text-xs text-[#77766E]">
                      {item.timeAgo}
                    </span>
                    <ChevronRight className="w-4 h-4 text-[#77766E] group-hover:text-[#25251F] group-hover:translate-x-0.5 transition-all" />
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
