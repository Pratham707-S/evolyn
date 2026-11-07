'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { Mark, mergeAttributes } from '@tiptap/core';
import type { DetectedIssue } from '@evolyn/shared';

// Custom TipTap Mark for highlighting AI-detected grammar/guideline issues inline with red squiggly
export const IssueHighlight = Mark.create({
  name: 'issueHighlight',

  addAttributes() {
    return {
      'data-issue-id': {
        default: null,
        parseHTML: (el) => el.getAttribute('data-issue-id'),
        renderHTML: (attrs) => (attrs['data-issue-id'] ? { 'data-issue-id': attrs['data-issue-id'] } : {}),
      },
      'data-suggested-fix': {
        default: null,
        parseHTML: (el) => el.getAttribute('data-suggested-fix'),
        renderHTML: (attrs) => (attrs['data-suggested-fix'] ? { 'data-suggested-fix': attrs['data-suggested-fix'] } : {}),
      },
      'data-explanation': {
        default: null,
        parseHTML: (el) => el.getAttribute('data-explanation'),
        renderHTML: (attrs) => (attrs['data-explanation'] ? { 'data-explanation': attrs['data-explanation'] } : {}),
      },
      'data-issue-type': {
        default: 'GRAMMAR_ERROR',
        parseHTML: (el) => el.getAttribute('data-issue-type'),
        renderHTML: (attrs) => (attrs['data-issue-type'] ? { 'data-issue-type': attrs['data-issue-type'] } : {}),
      },
    };
  },

  parseHTML() {
    return [
      { tag: 'mark.evolyn-issue-mark' },
      { tag: 'mark[data-issue-id]' },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['mark', mergeAttributes({ class: 'evolyn-issue-mark' }, HTMLAttributes), 0];
  },
});
import {
  ChevronLeft,
  ChevronRight,
  Edit3,
  FileText,
  History,
  Sparkles,
  RotateCcw,
  Check,
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Copy,
  ExternalLink,
  Save,
  Loader2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { getApiBaseUrl } from '@/lib/api/client';
import { ExportPdfModal } from './export-pdf-modal';
import { cleanAndFormatPdfToHtml } from '../utils/format-document-text';

export interface ReviewEditorProps {
  initialTitle?: string;
  channel?: string;
  initialContent?: string;
  submissionId?: string;
  fileUrl?: string | null;
  issues?: DetectedIssue[];
  selectedFindingId?: string | null;
  onSelectFinding?: (findingId: string, excerpt?: string) => void;
  onAcceptFinding?: (issue: DetectedIssue) => void;
  onSave?: (currentContent: string) => void;
  onApplyRewrite?: (newContent: string) => void;
  onContentChange?: (content: string) => void;
  showToast: (msg: string) => void;
  isSaving?: boolean;
}

export interface ActiveIssuePopover {
  issueId: string;
  flaggedExcerpt: string;
  suggestedFix: string;
  explanation: string;
  issueType: string;
  position: { top: number; left: number };
}

export function ReviewEditor({
  initialTitle = 'Q3 Product Campaign',
  channel = 'LinkedIn Post',
  initialContent = '',
  submissionId,
  fileUrl,
  issues = [],
  selectedFindingId,
  onSelectFinding,
  onAcceptFinding,
  onSave,
  onContentChange,
  showToast,
  isSaving = false,
}: ReviewEditorProps) {
  const [activeTab, setActiveTab] = useState<'editor' | 'pdf' | 'history'>('editor');
  const [copied, setCopied] = useState(false);
  const [pdfZoom, setPdfZoom] = useState<number | 'fit'>(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(5);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const effectivePdfUrl = React.useMemo(() => {
    if (!fileUrl) return null;
    if (submissionId) {
      const apiBase = getApiBaseUrl();
      return `${apiBase}/api/submissions/${submissionId}/file`;
    }
    if (fileUrl.startsWith('data:') || fileUrl.startsWith('blob:') || fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      return fileUrl;
    }
    if (fileUrl.startsWith('/')) {
      return `${getApiBaseUrl()}${fileUrl}`;
    }
    return fileUrl;
  }, [fileUrl, submissionId]);

  const pdfViewerSrc = React.useMemo(() => {
    if (!effectivePdfUrl) return '';
    const zoomParam = pdfZoom === 'fit' ? 'view=FitH' : `zoom=${pdfZoom}`;
    return `${effectivePdfUrl}#page=${currentPage}&${zoomParam}`;
  }, [effectivePdfUrl, currentPage, pdfZoom]);

  const lastSetContentRef = React.useRef('');
  const lastIssuesHashRef = React.useRef('');
  const editorContainerRef = React.useRef<HTMLDivElement>(null);
  const [activePopover, setActivePopover] = useState<ActiveIssuePopover | null>(null);

  const issuesHash = (issues || []).map((i) => `${i.id}:${i.status}`).join('|');

  // Initialize TipTap Editor with custom IssueHighlight mark for inline red squiggly error indications
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      IssueHighlight,
    ],
    content: cleanAndFormatPdfToHtml(initialContent, issues),
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none focus:outline-hidden min-h-[420px] text-[#1E1E1A] dark:text-[#F7F5F0] dark:prose-invert leading-relaxed select-text font-sans p-6 sm:p-8 [&>p]:mb-4 [&>p]:leading-relaxed [&>p]:text-[15px] [&>h1]:mt-6 [&>h1]:mb-3 [&>h1]:font-bold [&>h1]:text-2xl [&>h1]:tracking-tight [&>h1]:text-[#1A1A17] dark:[&>h1]:text-[#F7F5F0] [&>h2]:mt-6 [&>h2]:mb-3 [&>h2]:font-bold [&>h2]:text-xl [&>h2]:tracking-tight [&>h2]:text-[#1A1A17] dark:[&>h2]:text-[#F7F5F0] [&>h3]:mt-5 [&>h3]:mb-2 [&>h3]:font-semibold [&>h3]:text-lg [&>h3]:tracking-tight [&>h3]:text-[#1A1A17] dark:[&>h3]:text-[#F7F5F0] [&>ul]:my-3 [&>ol]:my-3 [&>li]:my-1 [&>blockquote]:my-4 [&>blockquote]:p-3 [&>blockquote]:border-l-4 [&>blockquote]:border-[#68745D] [&>blockquote]:bg-[#F4F2EC] dark:[&>blockquote]:bg-[#262520] dark:[&>blockquote]:text-[#F7F5F0] [&>blockquote]:rounded-r-md',
      },
    },
    onUpdate: ({ editor: ed }) => {
      const text = ed.getText() || '';
      lastSetContentRef.current = text;
      onContentChange?.(text);
    },
  });

  // Sync editor content when initialContent or active issues change (e.g. API load, rewrite acceptance, or finding fix)
  useEffect(() => {
    if (editor && initialContent) {
      const currentText = editor.getText?.() || '';
      const isPlaceholder = !currentText || currentText === 'Loading document content...';
      const contentChanged = initialContent !== lastSetContentRef.current;
      const issuesChanged = issuesHash !== lastIssuesHashRef.current;

      if (isPlaceholder || contentChanged || issuesChanged) {
        lastSetContentRef.current = initialContent;
        lastIssuesHashRef.current = issuesHash;
        try {
          editor.commands.setContent(cleanAndFormatPdfToHtml(initialContent, issues));
        } catch (err) {
          console.error('Error syncing editor content:', err);
        }
      }
    }
  }, [editor, initialContent, issues, issuesHash]);

  // Handle click on .evolyn-issue-mark to display inline quick-fix popover
  const handleEditorClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const mark = target.closest('.evolyn-issue-mark') as HTMLElement | null;

    if (mark && editorContainerRef.current) {
      const issueId = mark.getAttribute('data-issue-id') || '';
      const suggestedFix = mark.getAttribute('data-suggested-fix') || '';
      const explanation = mark.getAttribute('data-explanation') || '';
      const issueType = mark.getAttribute('data-issue-type') || 'GRAMMAR_ERROR';
      const flaggedExcerpt = mark.textContent || '';

      const containerRect = editorContainerRef.current.getBoundingClientRect();
      const markRect = mark.getBoundingClientRect();

      const popoverWidth = 320;
      let left = markRect.left - containerRect.left;
      if (left + popoverWidth > containerRect.width - 20) {
        left = Math.max(16, containerRect.width - popoverWidth - 20);
      }
      if (left < 16) left = 16;

      const top = markRect.bottom - containerRect.top + editorContainerRef.current.scrollTop + 8;

      setActivePopover({
        issueId,
        flaggedExcerpt,
        suggestedFix,
        explanation,
        issueType,
        position: { top, left },
      });

      onSelectFinding?.(issueId, flaggedExcerpt);
    } else if (!target.closest('.evolyn-quick-fix-popover')) {
      setActivePopover(null);
    }
  };

  // Direct 1-click apply fix from in-editor quick-fix popover
  const handleApplyQuickFix = (popover: ActiveIssuePopover) => {
    if (!editor) return;

    const targetIssue = issues?.find((i) => i.id === popover.issueId) || {
      id: popover.issueId,
      flaggedExcerpt: popover.flaggedExcerpt,
      suggestedFix: popover.suggestedFix,
      explanation: popover.explanation,
      issueType: (popover.issueType as any) || 'GRAMMAR_ERROR',
      sourceQuote: '',
      confidenceScore: 1,
      evidenceStrengthScore: 0,
      status: 'ACCEPTED' as const,
      reviewRunId: '',
    };

    // Update in editor HTML directly
    const currentHtml = editor.getHTML();
    const escapedId = popover.issueId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const markRegex = new RegExp(`<mark[^>]*data-issue-id="${escapedId}"[^>]*>[\\s\\S]*?<\\/mark>`, 'gi');
    let newHtml = currentHtml.replace(markRegex, popover.suggestedFix);
    if (newHtml === currentHtml && popover.flaggedExcerpt) {
      newHtml = currentHtml.replace(popover.flaggedExcerpt, popover.suggestedFix);
    }

    editor.commands.setContent(newHtml);
    const newText = editor.getText();
    lastSetContentRef.current = newText;
    onContentChange?.(newText);

    if (onAcceptFinding) {
      onAcceptFinding(targetIssue);
    }

    showToast(`Applied fix: "${popover.suggestedFix}"`);
    setActivePopover(null);
  };

  // Smooth scroll and focus to flagged element when finding selected in right-hand panel
  useEffect(() => {
    if (!selectedFindingId || activeTab !== 'editor' || !editorContainerRef.current) return;
    const mark = editorContainerRef.current.querySelector(
      `[data-issue-id="${selectedFindingId}"]`
    ) as HTMLElement | null;
    if (mark) {
      mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
      mark.classList.add('active-issue');
      setTimeout(() => {
        mark.classList.remove('active-issue');
      }, 2500);
    }
  }, [selectedFindingId, activeTab]);

  const handleCopy = () => {
    if (!editor) return;
    const text = editor.getText?.() || '';
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('Document text copied to clipboard');
  };

  const handleSave = () => {
    if (!editor) return;
    const currentHtml = editor.getHTML?.() || '';
    const currentText = editor.getText?.() || '';
    const contentToSave = currentHtml && currentHtml !== '<p></p>' ? currentHtml : currentText;
    if (onSave) {
      onSave(contentToSave);
    } else {
      showToast('Revised version saved successfully');
    }
  };

  const getWordCount = () => {
    if (!editor) return 0;
    try {
      const raw = editor.getText?.();
      if (!raw) return 0;
      const text = raw.trim();
      return text ? text.split(/\s+/).filter(Boolean).length : 0;
    } catch {
      return 0;
    }
  };

  const getCharCount = () => {
    if (!editor) return 0;
    try {
      const raw = editor.getText?.();
      return raw ? raw.length : 0;
    } catch {
      return 0;
    }
  };

  return (
    <div className="bg-[#FFFEFA] dark:bg-[#1E1D19] border border-[#E5E1D8] dark:border-[#2C2B26] rounded-2xl shadow-2xs flex flex-col h-full overflow-hidden">
      {/* 1. Header Bar */}
      <div className="px-4 sm:px-5 py-3 border-b border-[#E5E1D8] dark:border-[#2C2B26] flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 shrink-0 bg-[#FFFEFA] dark:bg-[#1E1D19]">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="p-1 -ml-1 text-[#77766E] dark:text-[#A09D92] hover:text-[#25251F] dark:hover:text-[#F7F5F0] hover:bg-[#F1EFE8] dark:hover:bg-[#262520] rounded-md transition-colors"
            title="Back to submissions"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-semibold text-[#25251F] dark:text-[#F7F5F0] truncate leading-tight">
              {initialTitle}
            </h2>
            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] text-[#77766E] dark:text-[#A09D92] mt-0.5 flex-wrap">
              <span className="font-medium text-[#68745D] dark:text-[#8A987D]">{channel}</span>
              <span>•</span>
              <span>{getWordCount()} words</span>
              <span>•</span>
              <span>{getCharCount()} chars</span>
              {submissionId && (
                <>
                  <span>•</span>
                  <span className="font-mono text-[10px] text-[#A09D92]">
                    ID: {submissionId.slice(0, 8)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* View Switcher: Editor / PDF / History */}
        <div className="flex items-center gap-1 bg-[#FAF9F5] dark:bg-[#141412] border border-[#E5E1D8] dark:border-[#2C2B26] p-0.5 rounded-lg text-xs select-none">
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'editor'
                ? 'bg-[#FFFEFA] dark:bg-[#262520] text-[#25251F] dark:text-[#F7F5F0] shadow-2xs font-semibold'
                : 'text-[#77766E] dark:text-[#A09D92] hover:text-[#25251F] dark:hover:text-[#F7F5F0]'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Interactive Editor</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pdf')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'pdf'
                ? 'bg-[#FFFEFA] dark:bg-[#262520] text-[#25251F] dark:text-[#F7F5F0] shadow-2xs font-semibold'
                : 'text-[#77766E] dark:text-[#A09D92] hover:text-[#25251F] dark:hover:text-[#F7F5F0]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Original (PDF)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-[#FFFEFA] dark:bg-[#262520] text-[#25251F] dark:text-[#F7F5F0] shadow-2xs font-semibold'
                : 'text-[#77766E] dark:text-[#A09D92] hover:text-[#25251F] dark:hover:text-[#F7F5F0]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Revisions</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive TipTap Formatting Toolbar */}
      {activeTab === 'editor' && editor && (
        <div className="px-3 sm:px-4 py-2 border-b border-[#E5E1D8] dark:border-[#2C2B26] bg-[#FAF8F5]/60 dark:bg-[#181714] flex items-center justify-between gap-2 overflow-x-auto select-none shrink-0">
          <div className="flex items-center gap-1 text-xs">
            {/* Undo / Redo */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="p-1.5 text-[#77766E] dark:text-[#A09D92] hover:text-[#25251F] dark:hover:text-[#F7F5F0] hover:bg-[#E5E1D8] dark:hover:bg-[#2C2B26] rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="p-1.5 text-[#77766E] dark:text-[#A09D92] hover:text-[#25251F] dark:hover:text-[#F7F5F0] hover:bg-[#E5E1D8] dark:hover:bg-[#2C2B26] rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>

            <div className="w-[1px] h-4 bg-[#E5E1D8] dark:bg-[#2C2B26] mx-1" />

            {/* Headings */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`p-1.5 rounded-md transition-colors ${
                editor.isActive('heading', { level: 1 })
                  ? 'bg-[#25251F] dark:bg-[#F7F5F0] text-white dark:text-[#141412] shadow-2xs'
                  : 'text-[#77766E] dark:text-[#A09D92] hover:text-[#25251F] dark:hover:text-[#F7F5F0] hover:bg-[#E5E1D8] dark:hover:bg-[#2C2B26]'
              }`}
              title="Heading 1"
            >
              <Heading1 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`p-1.5 rounded-md transition-colors ${
                editor.isActive('heading', { level: 2 })
                  ? 'bg-[#25251F] dark:bg-[#F7F5F0] text-white dark:text-[#141412] shadow-2xs'
                  : 'text-[#77766E] dark:text-[#A09D92] hover:text-[#25251F] dark:hover:text-[#F7F5F0] hover:bg-[#E5E1D8] dark:hover:bg-[#2C2B26]'
              }`}
              title="Heading 2"
            >
              <Heading2 className="w-3.5 h-3.5" />
            </button>

            <div className="w-[1px] h-4 bg-[#E5E1D8] dark:bg-[#2C2B26] mx-1" />

            {/* Bold, Italic, Underline, Strike */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-1.5 rounded-md transition-colors ${
                editor.isActive('bold')
                  ? 'bg-[#25251F] dark:bg-[#F7F5F0] text-white dark:text-[#141412] shadow-2xs'
                  : 'text-[#77766E] dark:text-[#A09D92] hover:text-[#25251F] dark:hover:text-[#F7F5F0] hover:bg-[#E5E1D8] dark:hover:bg-[#2C2B26]'
              }`}
              title="Bold"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-1.5 rounded-md transition-colors ${
                editor.isActive('italic')
                  ? 'bg-[#25251F] dark:bg-[#F7F5F0] text-white dark:text-[#141412] shadow-2xs'
                  : 'text-[#77766E] dark:text-[#A09D92] hover:text-[#25251F] dark:hover:text-[#F7F5F0] hover:bg-[#E5E1D8] dark:hover:bg-[#2C2B26]'
              }`}
              title="Italic"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`p-1.5 rounded-md transition-colors ${
                editor.isActive('underline')
                  ? 'bg-[#25251F] dark:bg-[#F7F5F0] text-white dark:text-[#141412] shadow-2xs'
                  : 'text-[#77766E] dark:text-[#A09D92] hover:text-[#25251F] dark:hover:text-[#F7F5F0] hover:bg-[#E5E1D8] dark:hover:bg-[#2C2B26]'
              }`}
              title="Underline"
            >
              <UnderlineIcon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`p-1.5 rounded-md transition-colors ${
                editor.isActive('strike')
                  ? 'bg-[#25251F] dark:bg-[#F7F5F0] text-white dark:text-[#141412] shadow-2xs'
                  : 'text-[#77766E] dark:text-[#A09D92] hover:text-[#25251F] dark:hover:text-[#F7F5F0] hover:bg-[#E5E1D8] dark:hover:bg-[#2C2B26]'
              }`}
              title="Strikethrough"
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>

            <div className="w-[1px] h-4 bg-[#E5E1D8] dark:bg-[#2C2B26] mx-1" />

            {/* Lists */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`p-1.5 rounded-md transition-colors ${
                editor.isActive('bulletList')
                  ? 'bg-[#25251F] dark:bg-[#F7F5F0] text-white dark:text-[#141412] shadow-2xs'
                  : 'text-[#77766E] dark:text-[#A09D92] hover:text-[#25251F] dark:hover:text-[#F7F5F0] hover:bg-[#E5E1D8] dark:hover:bg-[#2C2B26]'
              }`}
              title="Bullet list"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`p-1.5 rounded-md transition-colors ${
                editor.isActive('orderedList')
                  ? 'bg-[#25251F] dark:bg-[#F7F5F0] text-white dark:text-[#141412] shadow-2xs'
                  : 'text-[#77766E] dark:text-[#A09D92] hover:text-[#25251F] dark:hover:text-[#F7F5F0] hover:bg-[#E5E1D8] dark:hover:bg-[#2C2B26]'
              }`}
              title="Numbered list"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Copy & Save Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="text-xs text-[#77766E] dark:text-[#A09D92] hover:text-[#25251F] dark:hover:text-[#F7F5F0] flex items-center gap-1 px-2.5 py-1 rounded-md hover:bg-[#E5E1D8] dark:hover:bg-[#2C2B26] transition-colors"
              title="Copy clean text"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#64816A] dark:text-[#8A987D]" />
                  <span className="text-[#64816A] dark:text-[#8A987D]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Copy</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="text-xs text-[#25251F] dark:text-[#F7F5F0] hover:text-[#1F2937] dark:hover:text-white bg-[#E8EBE1]/70 dark:bg-[#272B23] hover:bg-[#E8EBE1] dark:hover:bg-[#33382D] border border-[#68745D]/30 font-medium px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              title="Export styled brand PDF"
            >
              <Download className="w-3.5 h-3.5 text-[#68745D] dark:text-[#8A987D]" />
              <span className="hidden sm:inline">Export PDF</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#25251F] dark:bg-[#8A987D] hover:bg-[#383832] dark:hover:bg-[#97A689] disabled:opacity-50 text-white dark:text-[#141412] text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Revision</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 3. Editor / PDF / History Canvas Content */}
      <div
        ref={editorContainerRef}
        onClick={handleEditorClick}
        className="flex-1 min-h-0 overflow-y-auto bg-[#FFFEFA] dark:bg-[#1E1D19] relative"
      >
        {activeTab === 'editor' && (
          <div className="h-full relative">
            <EditorContent editor={editor} />

            {/* In-Editor Quick Fix Popover for clicked red squiggly error marks */}
            {activePopover && (
              <div
                className="evolyn-quick-fix-popover absolute z-30 bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl shadow-xl p-3.5 w-[320px] transition-all animate-in fade-in zoom-in-95 duration-150"
                style={{
                  top: `${activePopover.position.top}px`,
                  left: `${activePopover.position.left}px`,
                }}
              >
                {/* Header with Badge & Close */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#F1EFE8]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-red-700">
                      {activePopover.issueType === 'GRAMMAR_ERROR' || activePopover.issueType === 'SPELLING_ERROR'
                        ? 'Spelling / Grammar Error'
                        : 'Brand Guideline Issue'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePopover(null);
                    }}
                    className="text-[#A09D92] hover:text-[#25251F] text-xs px-1 py-0.5 rounded transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Explanation */}
                {activePopover.explanation && (
                  <p className="text-xs text-[#52524C] mb-2.5 leading-relaxed font-normal">
                    {activePopover.explanation}
                  </p>
                )}

                {/* Change Preview */}
                <div className="bg-[#FAF8F5] border border-[#EFECE6] rounded-lg p-2.5 mb-3 text-xs flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="line-through text-red-600 bg-red-100/70 px-1.5 py-0.5 rounded font-mono text-[11px] truncate max-w-[110px]">
                      {activePopover.flaggedExcerpt}
                    </span>
                    <span className="text-[#A09D92] font-bold">→</span>
                    <span className="text-emerald-700 font-semibold bg-emerald-100/70 px-1.5 py-0.5 rounded font-mono text-[11px] truncate max-w-[130px]">
                      {activePopover.suggestedFix || 'Remove'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePopover(null);
                    }}
                    className="px-2.5 py-1.5 text-xs text-[#77766E] hover:text-[#25251F] hover:bg-[#F1EFE8] rounded-md transition-colors cursor-pointer"
                  >
                    Dismiss
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApplyQuickFix(activePopover);
                    }}
                    className="bg-[#68745D] hover:bg-[#515B48] text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs transition-all cursor-pointer hover:shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply Fix</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'pdf' && (
          <div className="h-full flex flex-col p-4 overflow-hidden">
            {/* PDF Viewer Header Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-[#E5E1D8] shrink-0">
              {/* Left: Document info & Page controls */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#25251F]">
                  <FileText className="w-4 h-4 text-[#68745D]" />
                  <span>Original PDF</span>
                </div>

                {fileUrl && (
                  <div className="flex items-center bg-[#F1EFE8] rounded-lg p-0.5 border border-[#E5E1D8] text-xs">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      className="p-1 text-[#77766E] hover:text-[#25251F] disabled:opacity-30 rounded-md transition-colors"
                      title="Previous page"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-2 text-[11px] font-mono text-[#25251F]">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                      className="p-1 text-[#77766E] hover:text-[#25251F] disabled:opacity-30 rounded-md transition-colors"
                      title="Next page"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Right: Zoom controls & External Link */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-[#F1EFE8] rounded-lg p-0.5 border border-[#E5E1D8] text-xs">
                  <button
                    type="button"
                    onClick={() =>
                      setPdfZoom((z) => Math.max(25, (typeof z === 'number' ? z : 50) - 25))
                    }
                    className="p-1 text-[#77766E] hover:text-[#25251F] rounded-md transition-colors cursor-pointer"
                    title="Zoom out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-1 text-[11px] font-mono text-[#77766E] min-w-[38px] text-center">
                    {typeof pdfZoom === 'number' ? `${pdfZoom}%` : 'Fit'}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setPdfZoom((z) => Math.min(200, (typeof z === 'number' ? z : 50) + 25))
                    }
                    className="p-1 text-[#77766E] hover:text-[#25251F] rounded-md transition-colors cursor-pointer"
                    title="Zoom in"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPdfZoom(50)}
                    className={`px-1.5 py-0.5 text-[10px] font-medium rounded transition-colors cursor-pointer ${
                      pdfZoom === 50
                        ? 'bg-[#E8EBE1] text-[#25251F] font-semibold'
                        : 'text-[#77766E] hover:text-[#25251F] hover:bg-[#E5E1D8]'
                    }`}
                    title="Reset to 50%"
                  >
                    Reset (50%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPdfZoom('fit')}
                    className={`px-1.5 py-0.5 text-[10px] font-medium rounded transition-colors cursor-pointer ${
                      pdfZoom === 'fit'
                        ? 'bg-[#E8EBE1] text-[#25251F] font-semibold'
                        : 'text-[#77766E] hover:text-[#25251F] hover:bg-[#E5E1D8]'
                    }`}
                    title="Fit page width"
                  >
                    Fit
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(true)}
                  className="px-2.5 py-1 text-xs text-[#25251F] hover:text-[#1F2937] bg-[#E8EBE1]/70 hover:bg-[#E8EBE1] border border-[#68745D]/30 rounded-lg font-medium transition-colors flex items-center gap-1 cursor-pointer"
                  title="Export styled brand PDF"
                >
                  <Download className="w-3 h-3 text-[#68745D]" />
                  <span>Export Styled</span>
                </button>

                {effectivePdfUrl && (
                  <a
                    href={effectivePdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 text-xs text-[#68745D] hover:text-[#515B48] bg-[#E8EBE1]/60 hover:bg-[#E8EBE1] rounded-lg font-medium transition-colors flex items-center gap-1"
                  >
                    <span>Full Window</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {/* PDF Main Content Area */}
            {effectivePdfUrl ? (
              <div className="flex-1 min-h-0 flex gap-3 overflow-hidden">
                {/* Left Thumbnail/Page Navigation Drawer */}
                <div className="hidden sm:flex flex-col w-28 shrink-0 border border-[#E5E1D8] rounded-xl bg-[#FAF9F5] p-2 overflow-y-auto space-y-2 select-none">
                  <span className="text-[10px] font-semibold text-[#77766E] uppercase tracking-wider px-1">
                    Thumbnails
                  </span>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                    <button
                      key={pg}
                      type="button"
                      onClick={() => setCurrentPage(pg)}
                      className={`w-full p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        currentPage === pg
                          ? 'border-[#68745D] bg-[#E8EBE1]/60 text-[#25251F] font-semibold shadow-2xs ring-1 ring-[#68745D]'
                          : 'border-[#E5E1D8] bg-[#FFFEFA] text-[#77766E] hover:border-[#68745D]/40'
                      }`}
                    >
                      <div className="w-full h-12 rounded border border-[#E5E1D8] bg-white flex items-center justify-center text-[10px] text-[#A09D92]">
                        <FileText className="w-4 h-4 opacity-50" />
                      </div>
                      <span className="text-[11px]">Page {pg}</span>
                    </button>
                  ))}
                </div>

                {/* High-Fidelity PDF Renderer Container */}
                <div className="flex-1 min-w-0 bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl overflow-hidden flex items-center justify-center relative">
                  <iframe
                    key={`${effectivePdfUrl}-p${currentPage}-z${pdfZoom}`}
                    src={pdfViewerSrc}
                    title="Original PDF Document"
                    className="w-full h-full border-0 rounded-xl"
                  />
                </div>
              </div>
            ) : (
              <div className="p-8 border border-dashed border-[#E5E1D8] rounded-xl text-center space-y-3 bg-[#FAF9F5] my-auto">
                <FileText className="w-10 h-10 text-[#68745D] mx-auto opacity-70" />
                <h3 className="font-serif text-base text-[#25251F]">
                  Text Submission (No PDF Attached)
                </h3>
                <p className="text-xs text-[#77766E] max-w-md mx-auto">
                  This submission was entered directly via Write / Paste or Webpage Import. You can edit the text directly in the Interactive Editor tab.
                </p>
                <Button variant="outline" size="sm" onClick={() => setActiveTab('editor')}>
                  Switch to Interactive Editor
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="p-6 space-y-4">
            <h3 className="text-xs font-semibold text-[#25251F] uppercase tracking-wider">
              Revision Log & Version History
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="p-3.5 bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#25251F]">Version 1.2 (Active Draft)</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[#E8EBE1] text-[#4E6B54] font-medium">
                      Current
                    </span>
                  </div>
                  <p className="text-[#77766E] text-[11px] mt-0.5">
                    Interactive edits in TipTap editor ready for brand sign-off.
                  </p>
                </div>
                <span className="text-[#A09D92] text-[11px]">Active</span>
              </div>

              <div className="p-3.5 bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-medium text-[#25251F]">Version 1.0 (Initial Ingestion)</span>
                  <p className="text-[#77766E] text-[11px] mt-0.5">
                    Original raw content received from content intake pipeline.
                  </p>
                </div>
                <span className="text-[#A09D92] text-[11px]">Original</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <ExportPdfModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title={initialTitle}
        contentHtml={editor ? editor.getHTML() : cleanAndFormatPdfToHtml(initialContent)}
        channel={channel}
        complianceScore={100}
      />
    </div>
  );
}
