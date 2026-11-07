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
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

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
        cardBg: 'bg-[#FFFEFA] border-[#C8DEC9] hover:border-[#64816A] hover:bg-[#F7FAF7]',
        badgeBg: 'bg-[#EEF4EE] text-[#36533D] border-[#D1E2D3]',
        accentDot: 'bg-[#64816A]',
        textSecondary: 'text-[#5C7761]',
        iconBg: 'bg-[#EEF4EE]',
        indicator: 'border-l-4 border-l-[#64816A]',
      };
    }
    if (decision === 'Changes Requested') {
      return {
        cardBg: 'bg-[#FFFEFA] border-[#F2D8B9] hover:border-[#B78A4A] hover:bg-[#FDF9F2]',
        badgeBg: 'bg-[#FDF4E7] text-[#865920] border-[#F0D5B5]',
        accentDot: 'bg-[#B78A4A]',
        textSecondary: 'text-[#876536]',
        iconBg: 'bg-[#FDF4E7]',
        indicator: 'border-l-4 border-l-[#B78A4A]',
      };
    }
    return {
      cardBg: 'bg-[#FFFEFA] border-[#F5C5C0] hover:border-[#B56E63] hover:bg-[#FDF6F6]',
      badgeBg: 'bg-[#FDEAEA] text-[#8A332B] border-[#F4BFB9]',
      accentDot: 'bg-[#B56E63]',
      textSecondary: 'text-[#8C463F]',
      iconBg: 'bg-[#FDEAEA]',
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

    // 2. Day Filter
    const span = item.spanDays ?? 2;
    const matchesDay =
      selectedDay === null ||
      (selectedDay >= item.dayIndex && selectedDay < item.dayIndex + span);

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
    <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl p-5 sm:p-7 space-y-6 shadow-2xs">
      {/* 1. Primary Wide Filter Toolbar */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Section Title */}
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="font-serif text-2xl sm:text-[26px] font-normal text-[#25251F] tracking-tight">
                Decision Timeline
              </h2>
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#68745D] bg-[#E8EBE1] px-2.5 py-0.5 rounded-full font-medium">
                {weekRangeLabel}
              </span>
            </div>
            <p className="text-xs text-[#77766E] mt-1">
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
                className="w-full bg-[#FAF9F5] border border-[#E5E1D8] text-[#25251F] placeholder:text-[#A09D92] text-xs pl-9 pr-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#68745D] transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A09D92] hover:text-[#25251F]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#F1EFE8] p-1 rounded-lg border border-[#E5E1D8] shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('gantt')}
                title="Schedule Timeline View"
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                  viewMode === 'gantt'
                    ? 'bg-[#FFFEFA] text-[#25251F] shadow-2xs font-semibold'
                    : 'text-[#77766E] hover:text-[#25251F]'
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
                    ? 'bg-[#FFFEFA] text-[#25251F] shadow-2xs font-semibold'
                    : 'text-[#77766E] hover:text-[#25251F]'
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
        <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl p-2.5 sm:p-3 flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-full">
            <span className="text-[#77766E] font-medium flex items-center gap-1.5 text-xs mr-1 shrink-0">
              <Calendar className="w-3.5 h-3.5 text-[#68745D]" />
              Filter by Day:
            </span>

            {/* "All Week" reset button */}
            <button
              type="button"
              onClick={() => setSelectedDay(null)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                selectedDay === null
                  ? 'bg-[#25251F] text-white shadow-2xs font-semibold'
                  : 'bg-[#FFFEFA] border border-[#E5E1D8] text-[#77766E] hover:text-[#25251F] hover:bg-[#F1EFE8]'
              }`}
            >
              All Days ({items.length})
            </button>

            {/* Individual Day Buttons */}
            {daysOfWeek.map((day) => {
              const dayItemCount = items.filter(
                (it) => it.dayIndex === day.index || (day.index >= it.dayIndex && day.index < it.dayIndex + (it.spanDays ?? 2))
              ).length;
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
                      ? 'bg-[#E8EBE1] text-[#25251F] border border-[#68745D]/40 font-medium hover:bg-[#68745D] hover:text-white'
                      : 'bg-[#FFFEFA] border border-[#E5E1D8] text-[#77766E] hover:text-[#25251F] hover:bg-[#F1EFE8]'
                  }`}
                >
                  <span className="uppercase text-[10px]">{day.name}</span>
                  <span className="font-semibold">{day.date}</span>
                  {dayItemCount > 0 && (
                    <span
                      className={`text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-mono ${
                        isDaySelected
                          ? 'bg-white/25 text-white'
                          : 'bg-[#E5E1D8] text-[#25251F]'
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
            <div className="flex items-center gap-2 bg-[#E8EBE1]/70 text-[#25251F] px-3 py-1 rounded-lg border border-[#68745D]/30 shrink-0">
              <span className="font-medium text-xs">
                Showing work for {selectedDayInfo.fullDate} ({filteredItems.length})
              </span>
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className="text-[#68745D] hover:text-[#25251F] ml-1 p-0.5 rounded hover:bg-[#E8EBE1]"
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
          <div className="md:hidden flex items-center justify-between text-[11px] text-[#77766E] bg-[#FAF9F5] border border-[#E5E1D8] px-3 py-1.5 rounded-xl">
            <span className="flex items-center gap-1">
              👉 Swipe horizontally to view full schedule
            </span>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="text-[#68745D] font-semibold underline"
            >
              List View
            </button>
          </div>

          <div className="overflow-x-auto pb-2 scroll-smooth">
          <div className="min-w-[880px] border border-[#E5E1D8] rounded-xl bg-[#FAF9F5] p-5 relative">
            {/* Days Column Header Grid (Non-overlapping, clean layout) */}
            <div className="grid grid-cols-7 gap-3 pb-3 border-b border-[#E5E1D8] text-center text-xs relative z-20">
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
                        ? 'bg-[#E8EBE1] text-[#25251F] ring-1 ring-[#68745D]/40 font-semibold'
                        : 'text-[#77766E] hover:bg-[#FFFEFA] hover:text-[#25251F]'
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
            <div className="relative pt-4 space-y-4">
              {/* Slid-Down Live Marker: tracks real-time today column */}
              <div
                style={{ left: liveMarkerLeft }}
                className="absolute top-1 bottom-1 w-[2px] bg-[#68745D]/80 z-10 pointer-events-none"
              >
                {/* Live Pill badge positioned inside the track ruler below day headers */}
                <div className="absolute top-0 -left-9 bg-[#25251F] text-white text-[10px] font-mono px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 z-30 pointer-events-auto">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#64816A] animate-pulse" />
                  <span>{liveTimeString}</span>
                </div>
              </div>

              {/* Background Grid Vertical Dividing Guidelines */}
              <div className="grid grid-cols-7 gap-3 absolute inset-x-0 top-0 bottom-0 pointer-events-none opacity-40">
                {daysOfWeek.map((_, i) => (
                  <div
                    key={i}
                    className="border-r border-dashed border-[#E5E1D8] h-full last:border-r-0"
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
                    <div className="text-[11px] font-medium text-[#77766E] uppercase tracking-wider flex items-center gap-1.5 pl-1">
                      <Layers className="w-3 h-3 text-[#A09D92]" />
                      <span>{lane.title}</span>
                    </div>

                    {/* Lane Track Grid */}
                    <div className="grid grid-cols-7 gap-3 min-h-[66px] bg-[#FFFEFA]/90 border border-[#E5E1D8] rounded-xl p-2.5 items-center relative">
                      {laneItems.length === 0 ? (
                        <div className="col-span-7 text-center text-xs text-[#A09D92] py-2 italic font-normal">
                          No reviews logged for this category matching current filters
                        </div>
                      ) : (
                        laneItems.map((item) => {
                          const theme = getDecisionTheme(item.decision);
                          const startCol = item.dayIndex;
                          const spanCol = item.spanDays ?? 2;

                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => onSelect(item)}
                              style={{
                                gridColumnStart: startCol + 1,
                                gridColumnEnd: `span ${Math.min(spanCol, 7 - startCol)}`,
                              }}
                              className={`group text-left py-2 px-3 rounded-xl border transition-all flex items-center justify-between gap-2.5 cursor-pointer shadow-2xs hover:shadow-md hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-[#68745D] ${theme.cardBg} ${theme.indicator}`}
                            >
                              {/* Left icon / Title */}
                              <div className="flex items-center gap-2 min-w-0">
                                <div
                                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border border-[#E5E1D8]/60 ${theme.iconBg}`}
                                >
                                  {getChannelIcon(item.channel)}
                                </div>

                                <div className="min-w-0 truncate">
                                  <p className="text-xs font-medium text-[#25251F] group-hover:text-[#68745D] transition-colors truncate leading-tight">
                                    {item.title}
                                  </p>
                                  <p className="text-[11px] text-[#77766E] truncate">
                                    {item.reviewerName} • {item.timeAgo}
                                  </p>
                                </div>
                              </div>

                              {/* Right status badge & chevron */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium border hidden sm:inline-block ${theme.badgeBg}`}
                                >
                                  {item.decision}
                                </span>
                                <ChevronRight className="w-3.5 h-3.5 text-[#77766E] group-hover:text-[#25251F] group-hover:translate-x-0.5 transition-all" />
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
