'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Sparkles,
  AlertCircle,
  PenLine,
  UploadCloud,
  Globe,
  FileText,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { SubmissionItem } from './recent-submissions';
import { apiClient, getApiBaseUrl } from '@/lib/api/client';

interface NewSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: (newSubmission: SubmissionItem) => void;
}

type InputMode = 'write' | 'upload' | 'url';
type ProcessingState = 'idle' | 'uploading' | 'processing' | 'extracting' | 'ready' | 'failed';

export function NewSubmissionModal({
  isOpen,
  onClose,
  onSubmitSuccess,
}: NewSubmissionModalProps) {
  const router = useRouter();

  // Common Form Fields
  const [title, setTitle] = useState('');
  const [channel, setChannel] = useState<'Website' | 'LinkedIn' | 'Email' | 'Ads' | 'Blog'>('LinkedIn');

  // Input Mode: write | upload | url
  const [mode, setMode] = useState<InputMode>('write');

  // Mode 1: Write / Paste
  const [writtenContent, setWrittenContent] = useState('');

  // Mode 2: Upload File
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [processingState, setProcessingState] = useState<ProcessingState>('idle');
  const [extractedText, setExtractedText] = useState('');
  const [extractedPages, setExtractedPages] = useState<number>(1);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Mode 3: Import URL
  const [urlInput, setUrlInput] = useState('');
  const [isUrlExtracting, setIsUrlExtracting] = useState(false);
  const [extractedUrlData, setExtractedUrlData] = useState<{
    url: string;
    title: string;
    content: string;
  } | null>(null);

  // Common submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdSubmissionId, setCreatedSubmissionId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleResetFile = () => {
    setUploadedFile(null);
    setExtractedText('');
    setExtractedPages(1);
    setProcessingState('idle');
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'pdf') {
      setFileError('Only PDF files are supported for document upload.');
      setProcessingState('failed');
      setUploadedFile(file);
      return;
    }

    const MAX_SIZE = 25 * 1024 * 1024; // 25 MB
    if (file.size > MAX_SIZE) {
      setFileError(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds 25MB limit.`);
      setProcessingState('failed');
      setUploadedFile(file);
      return;
    }

    setUploadedFile(file);
    setFileError(null);
    setProcessingState('uploading');

    // Automatically fill title from filename if title is empty
    if (!title.trim()) {
      setTitle(file.name.replace(/\.pdf$/i, ''));
    }

    try {
      // Step 1: Uploading state
      await new Promise((r) => setTimeout(r, 400));
      setProcessingState('processing');

      // Step 2: Processing state
      await new Promise((r) => setTimeout(r, 400));
      setProcessingState('extracting');

      // Step 3: Send file to backend extraction endpoint
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title.trim() || file.name.replace(/\.pdf$/i, ''));
      formData.append('channel', channel === 'LinkedIn' ? 'SOCIAL' : channel === 'Ads' ? 'AD_COPY' : channel.toUpperCase());
      formData.append('submittedBy', 'Compliance Officer');

      const response = await fetch(`${getApiBaseUrl()}/api/submissions/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload failed with HTTP ${response.status}`);
      }

      const data = await response.json();
      setExtractedText(data.extractedText || '');
      setExtractedPages(data.numPages || 1);
      setProcessingState('ready');

      if (data.submission?.id) {
        setCreatedSubmissionId(data.submission.id);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to process and extract PDF text';
      setFileError(msg);
      setProcessingState('failed');
    }
  };

  const handleUrlExtract = async () => {
    if (!urlInput.trim()) {
      setError('Please provide a valid web URL (e.g. https://example.com/announcement).');
      return;
    }

    setIsUrlExtracting(true);
    setError(null);

    try {
      const response = await apiClient.post<{
        submission: {
          id: string;
          title: string;
          channel: string;
          status: string;
          fileUrl?: string;
        };
        extracted: {
          url: string;
          title: string;
          contentLength: number;
        };
      }>('/api/submissions/extract-url', {
        url: urlInput.trim(),
        title: title.trim() || undefined,
        channel: channel === 'LinkedIn' ? 'SOCIAL' : channel === 'Ads' ? 'AD_COPY' : channel.toUpperCase(),
        submittedBy: 'Web Content Importer',
      });

      if (response.submission) {
        setCreatedSubmissionId(response.submission.id);
        if (!title.trim() && response.extracted.title) {
          setTitle(response.extracted.title);
        }
        setExtractedUrlData({
          url: response.extracted.url,
          title: response.extracted.title,
          content: `Extracted ${response.extracted.contentLength} characters of clean text copy ready for brand audit.`,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import and extract webpage content.');
    } finally {
      setIsUrlExtracting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If PDF upload already created a submission on backend
    if (mode === 'upload' && createdSubmissionId) {
      const newEntry: SubmissionItem = {
        id: createdSubmissionId,
        title: `${title} (${channel})`,
        timestamp: 'Just now',
        status: 'Pending',
      };
      onSubmitSuccess(newEntry);
      onClose();
      router.push(`/reviews?id=${createdSubmissionId}`);
      return;
    }

    // If URL import already created a submission on backend
    if (mode === 'url' && createdSubmissionId) {
      const newEntry: SubmissionItem = {
        id: createdSubmissionId,
        title: `${title} (${channel})`,
        timestamp: 'Just now',
        status: 'Pending',
      };
      onSubmitSuccess(newEntry);
      onClose();
      router.push(`/reviews?id=${createdSubmissionId}`);
      return;
    }

    // Mode 1: Write / Paste
    if (!title.trim()) {
      setError('Please provide a campaign or asset title.');
      return;
    }

    if (!writtenContent.trim() || writtenContent.trim().length < 10) {
      setError('Content copy must be at least 10 characters long for brand audit.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const channelMap: Record<string, string> = {
      LinkedIn: 'SOCIAL',
      Instagram: 'SOCIAL',
      'Twitter/X': 'SOCIAL',
      Website: 'WEBSITE',
      Blog: 'BLOG',
      Email: 'EMAIL',
      Ads: 'AD_COPY',
    };
    const backendChannel = channelMap[channel] || 'WEBSITE';

    try {
      const response = await apiClient.post<{
        submission: {
          id: string;
          title: string;
          channel: string;
          status: string;
          createdAt: string;
        };
      }>('/api/submissions', {
        title: title.trim(),
        rawText: writtenContent.trim(),
        channel: backendChannel,
        submittedBy: 'Marketing Campaign Team',
      });

      const sub = response.submission;
      const newEntry: SubmissionItem = {
        id: sub.id,
        title: `${sub.title} (${channel})`,
        timestamp: 'Just now',
        status: 'Pending',
      };
      onSubmitSuccess(newEntry);
      onClose();
      router.push(`/reviews?id=${sub.id}`);
    } catch (err) {
      console.error('Failed to create submission:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to submit content to server. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl w-full max-w-xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-[#E5E1D8] flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl text-[#25251F]">
              New Content Submission
            </h2>
            <p className="text-xs text-[#77766E] mt-0.5">
              Submit copy or documents for grounded brand compliance verification.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#77766E] hover:text-[#25251F] rounded-lg hover:bg-[#F1EFE8] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-lg bg-[#FBEBE8] border border-[#EAC4BE] text-[#B56E63] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Campaign Title */}
          <div>
            <label
              htmlFor="submission-title"
              className="block text-xs font-semibold text-[#25251F] uppercase tracking-wider mb-1"
            >
              Campaign / Asset Title
            </label>
            <input
              id="submission-title"
              type="text"
              placeholder="e.g. Q4 Cloud AI Feature Announcement"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E1D8] bg-[#FFFEFA] focus:outline-hidden focus:border-[#68745D] focus:ring-1 focus:ring-[#68745D] transition-colors text-[#25251F] placeholder:text-[#A09D92]"
            />
          </div>

          {/* Target Channel */}
          <div>
            <label
              htmlFor="submission-channel"
              className="block text-xs font-semibold text-[#25251F] uppercase tracking-wider mb-1"
            >
              Target Channel
            </label>
            <select
              id="submission-channel"
              value={channel}
              onChange={(e) =>
                setChannel(e.target.value as 'Website' | 'LinkedIn' | 'Email' | 'Ads' | 'Blog')
              }
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E1D8] bg-[#FFFEFA] focus:outline-hidden focus:border-[#68745D] focus:ring-1 focus:ring-[#68745D] transition-colors text-[#25251F]"
            >
              <option value="LinkedIn">LinkedIn</option>
              <option value="Website">Website</option>
              <option value="Email">Email</option>
              <option value="Ads">Ads</option>
              <option value="Blog">Blog</option>
            </select>
          </div>

          {/* Mode Switcher */}
          <div>
            <label className="block text-xs font-semibold text-[#25251F] uppercase tracking-wider mb-1.5">
              Content Source
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F1EFE8] rounded-lg border border-[#E5E1D8]">
              {/* Tab 1: Write / Paste */}
              <button
                type="button"
                onClick={() => setMode('write')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-medium rounded-md transition-colors ${
                  mode === 'write'
                    ? 'bg-[#FFFEFA] text-[#25251F] shadow-xs'
                    : 'text-[#77766E] hover:text-[#25251F]'
                }`}
              >
                <PenLine className="w-3.5 h-3.5" />
                <span>Write / Paste</span>
              </button>

              {/* Tab 2: Upload File */}
              <button
                type="button"
                onClick={() => setMode('upload')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-medium rounded-md transition-colors ${
                  mode === 'upload'
                    ? 'bg-[#FFFEFA] text-[#25251F] shadow-xs'
                    : 'text-[#77766E] hover:text-[#25251F]'
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload PDF</span>
              </button>

              {/* Tab 3: Import URL */}
              <button
                type="button"
                onClick={() => setMode('url')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-medium rounded-md transition-colors ${
                  mode === 'url'
                    ? 'bg-[#FFFEFA] text-[#25251F] shadow-xs'
                    : 'text-[#77766E] hover:text-[#25251F]'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Import URL</span>
              </button>
            </div>
          </div>

          {/* Mode 1: Write / Paste Content */}
          {mode === 'write' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="submission-content"
                  className="block text-xs font-semibold text-[#25251F] uppercase tracking-wider"
                >
                  Content Copy
                </label>
                <span className="text-[11px] text-[#A09D92]">
                  {writtenContent.length} characters
                </span>
              </div>
              <textarea
                id="submission-content"
                rows={5}
                placeholder="Paste marketing copy, press release, or ad headlines to run guideline compliance..."
                value={writtenContent}
                onChange={(e) => setWrittenContent(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E1D8] bg-[#FFFEFA] focus:outline-hidden focus:border-[#68745D] focus:ring-1 focus:ring-[#68745D] transition-colors text-[#25251F] placeholder:text-[#A09D92]"
              />
              <p className="text-[11px] text-[#77766E] mt-1">
                Minimum 10 characters required for multi-layer guideline audit.
              </p>
            </div>
          )}

          {/* Mode 2: Upload File (PDF) */}
          {mode === 'upload' && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
                className="hidden"
              />

              {!uploadedFile && (
                <div
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                    isDragging
                      ? 'border-[#68745D] bg-[#E8EBE1]/40'
                      : 'border-[#E5E1D8] bg-[#F7F5F0]/60 hover:border-[#68745D]/60 hover:bg-[#F7F5F0]'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-[#E8EBE1] text-[#4E6B54] flex items-center justify-center mx-auto mb-2">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-medium text-[#25251F]">
                    Click to browse or drag and drop your PDF document
                  </p>
                  <p className="text-[11px] text-[#77766E] mt-1">
                    Supports <strong className="text-[#25251F]">PDF</strong> up to 25MB with page text extraction
                  </p>
                </div>
              )}

              {uploadedFile && (
                <div className="p-3.5 rounded-xl border border-[#E5E1D8] bg-[#F7F5F0]/70 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#E5E1D8] flex items-center justify-center text-[#25251F] flex-shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-medium text-[#25251F] truncate">
                          {uploadedFile.name}
                        </p>
                        <p className="text-[11px] text-[#77766E]">
                          {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB • {extractedPages} page{extractedPages > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    {/* Processing State Badges */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {processingState === 'uploading' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#F1EFE8] text-[#77766E]">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Uploading...</span>
                        </span>
                      )}
                      {processingState === 'processing' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#F1EFE8] text-[#77766E]">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Processing...</span>
                        </span>
                      )}
                      {processingState === 'extracting' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#F1EFE8] text-[#77766E]">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Extracting text...</span>
                        </span>
                      )}
                      {processingState === 'ready' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#E8EBE1] text-[#4E6B54]">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Ready for review</span>
                        </span>
                      )}
                      {processingState === 'failed' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FBEBE8] text-[#B56E63]">
                          <AlertCircle className="w-3 h-3" />
                          <span>Failed</span>
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-1 text-[#77766E] hover:text-[#25251F] rounded-md hover:bg-[#E5E1D8] transition-colors"
                        title="Replace file"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleResetFile}
                        className="p-1 text-[#B56E63] hover:text-[#8E443B] rounded-md hover:bg-[#FBEBE8] transition-colors"
                        title="Remove file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {fileError && (
                    <div className="p-2.5 rounded-lg bg-[#FBEBE8] border border-[#EAC4BE] text-[#B56E63] text-xs flex items-start gap-2 mt-1">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{fileError}</span>
                    </div>
                  )}

                  {processingState === 'ready' && extractedText && (
                    <div className="mt-2 pt-2 border-t border-[#E5E1D8]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-semibold text-[#25251F] uppercase tracking-wider">
                          Extracted Document Text
                        </span>
                        <span className="text-[11px] text-[#A09D92]">
                          {extractedText.length} characters
                        </span>
                      </div>
                      <div className="max-h-28 overflow-y-auto p-2.5 rounded-lg bg-[#FFFEFA] border border-[#E5E1D8] text-xs text-[#25251F] font-mono leading-relaxed whitespace-pre-wrap select-text">
                        {extractedText.slice(0, 500)}
                        {extractedText.length > 500 ? '...' : ''}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Mode 3: Import URL */}
          {mode === 'url' && (
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="submission-url"
                  className="block text-xs font-semibold text-[#25251F] uppercase tracking-wider mb-1"
                >
                  Public Webpage URL
                </label>
                <div className="flex gap-2">
                  <input
                    id="submission-url"
                    type="url"
                    placeholder="https://example.com/blog/announcement"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs rounded-lg border border-[#E5E1D8] bg-[#FFFEFA] focus:outline-hidden focus:border-[#68745D] focus:ring-1 focus:ring-[#68745D] transition-colors text-[#25251F] placeholder:text-[#A09D92]"
                  />
                  <button
                    type="button"
                    onClick={handleUrlExtract}
                    disabled={isUrlExtracting || !urlInput.trim()}
                    className="px-3 py-2 bg-[#25251F] hover:bg-[#383832] disabled:opacity-40 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    {isUrlExtracting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Extracting...</span>
                      </>
                    ) : (
                      <span>Import</span>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-[#77766E] mt-1">
                  Protected with SSRF verification (internal and private IP destinations are blocked).
                </p>
              </div>

              {extractedUrlData && (
                <div className="p-3 rounded-xl border border-[#E8EBE1] bg-[#E8EBE1]/30 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[#4E6B54]">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Webpage content successfully imported</span>
                  </div>
                  <p className="text-xs text-[#25251F] font-semibold">{extractedUrlData.title}</p>
                  <p className="text-[11px] text-[#77766E]">{extractedUrlData.content}</p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-[#E5E1D8] flex-shrink-0">
            <div>
              {createdSubmissionId && (
                <span className="text-xs text-[#64816A] font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Submission persisted in database</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-3.5 py-2 text-xs font-medium text-[#77766E] hover:text-[#25251F] hover:bg-[#F1EFE8] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  (mode === 'write' && (!writtenContent.trim() || writtenContent.trim().length < 10)) ||
                  (mode === 'upload' && processingState !== 'ready') ||
                  (mode === 'url' && !createdSubmissionId)
                }
                className="bg-[#25251F] hover:bg-[#383832] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : createdSubmissionId ? (
                  <>
                    <span>Open in Review Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Create Submission</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
