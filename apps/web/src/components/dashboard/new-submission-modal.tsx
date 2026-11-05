'use client';

import React, { useState, useRef } from 'react';
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
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { SubmissionItem } from './recent-submissions';

interface NewSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: (newSubmission: SubmissionItem) => void;
}

type InputMode = 'write' | 'upload' | 'url';

/**
 * Extracts plain text from a .txt file
 */
async function extractTextFromTxt(file: File): Promise<string> {
  const text = await file.text();
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('The uploaded TXT file contains no readable text content.');
  }
  return trimmed;
}

/**
 * Extracts text from a .docx file by inspecting the ZIP package and parsing word/document.xml
 */
async function extractTextFromDocx(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const view = new DataView(buffer);
  let offset = 0;
  let documentXmlContent: string | null = null;

  while (offset < view.byteLength - 30) {
    // Standard ZIP local file header signature: 0x04034b50
    if (view.getUint32(offset, true) === 0x04034b50) {
      const compressionMethod = view.getUint16(offset + 8, true);
      const compressedSize = view.getUint32(offset + 18, true);
      const fileNameLen = view.getUint16(offset + 26, true);
      const extraFieldLen = view.getUint16(offset + 28, true);
      const fileNameBytes = new Uint8Array(buffer, offset + 30, fileNameLen);
      const fileName = new TextDecoder().decode(fileNameBytes);
      const dataOffset = offset + 30 + fileNameLen + extraFieldLen;

      if (fileName === 'word/document.xml') {
        const compressedData = new Uint8Array(buffer, dataOffset, compressedSize);
        if (compressionMethod === 8) {
          // Deflate decompression
          const ds = new DecompressionStream('deflate-raw');
          const writer = ds.writable.getWriter();
          writer.write(compressedData);
          writer.close();
          const response = new Response(ds.readable);
          documentXmlContent = await response.text();
        } else if (compressionMethod === 0) {
          // Stored uncompressed
          documentXmlContent = new TextDecoder().decode(compressedData);
        } else {
          throw new Error(`Unsupported DOCX compression format (${compressionMethod}).`);
        }
        break;
      }
      offset = dataOffset + compressedSize;
    } else {
      offset++;
    }
  }

  if (!documentXmlContent) {
    throw new Error('Unable to find document body (word/document.xml) inside the DOCX archive.');
  }

  // Extract all text inside <w:t> XML nodes
  const textMatches = documentXmlContent.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g);
  if (!textMatches || textMatches.length === 0) {
    throw new Error('No readable text elements found inside the DOCX document.');
  }

  const extracted = textMatches
    .map((tag) => tag.replace(/<[^>]+>/g, ''))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!extracted) {
    throw new Error('Extracted DOCX text content is empty.');
  }

  return extracted;
}

/**
 * Extracts plain text from a .pdf file by searching for text operators.
 * If the PDF is scanned or requires OCR / custom font decoding, throws a clear, honest error.
 */
async function extractTextFromPdf(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const rawString = new TextDecoder('latin1').decode(bytes);

  const textMatches: string[] = [];

  // Look for text operators: (Text) Tj and [(Text) ... ] TJ
  const tjRegex = /\(([^)]+)\)\s*Tj/g;
  let match: RegExpExecArray | null;
  while ((match = tjRegex.exec(rawString)) !== null) {
    if (match[1] && match[1].trim()) {
      textMatches.push(match[1]);
    }
  }

  const arrayTjRegex = /\[([^\]]+)\]\s*TJ/g;
  while ((match = arrayTjRegex.exec(rawString)) !== null) {
    const inner = match[1];
    const subMatches = inner.match(/\(([^)]+)\)/g);
    if (subMatches) {
      for (const sm of subMatches) {
        const cleaned = sm.slice(1, -1).trim();
        if (cleaned) textMatches.push(cleaned);
      }
    }
  }

  const extracted = textMatches.join(' ').replace(/\s+/g, ' ').trim();

  if (extracted.length >= 10) {
    return extracted;
  }

  // Scanned or complex font encodings require OCR / backend extraction
  throw new Error(
    'Unable to extract readable text from this PDF (document may be scanned or encoded with proprietary font maps). Please copy and paste the text using Write / Paste mode.'
  );
}

export function NewSubmissionModal({
  isOpen,
  onClose,
  onSubmitSuccess,
}: NewSubmissionModalProps) {
  // Common Form Fields (Preserved)
  const [title, setTitle] = useState('');
  const [channel, setChannel] = useState<'Website' | 'LinkedIn' | 'Email' | 'Ads' | 'Blog'>('LinkedIn');

  // Input Mode: write | upload | url
  const [mode, setMode] = useState<InputMode>('write');

  // Mode 1: Write / Paste
  const [writtenContent, setWrittenContent] = useState('');

  // Mode 2: Upload File
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'extracting' | 'extracted' | 'error'>('idle');
  const [extractedText, setExtractedText] = useState('');
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Mode 3: Import URL (Unavailable)
  const [urlInput, setUrlInput] = useState('');

  // Common submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleResetFile = () => {
    setUploadedFile(null);
    setExtractedText('');
    setUploadStatus('idle');
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processFile = async (file: File) => {
    // 1. Validate file extension
    const nameParts = file.name.split('.');
    const ext = nameParts.length > 1 ? nameParts.pop()?.toLowerCase() : '';
    if (!ext || !['pdf', 'docx', 'txt'].includes(ext)) {
      setFileError('Unsupported document format. Allowed formats: PDF, DOCX, TXT.');
      setUploadStatus('error');
      setUploadedFile(file);
      setExtractedText('');
      return;
    }

    // 2. Validate file size (max 5 MB)
    const MAX_SIZE_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setFileError(`File size (${sizeMB} MB) exceeds the maximum 5MB limit.`);
      setUploadStatus('error');
      setUploadedFile(file);
      setExtractedText('');
      return;
    }

    setUploadedFile(file);
    setUploadStatus('extracting');
    setFileError(null);
    setExtractedText('');

    try {
      let text = '';
      if (ext === 'txt') {
        text = await extractTextFromTxt(file);
      } else if (ext === 'docx') {
        text = await extractTextFromDocx(file);
      } else if (ext === 'pdf') {
        text = await extractTextFromPdf(file);
      }

      if (text.length < 10) {
        throw new Error('Extracted content must be at least 10 characters long for brand audit.');
      }

      setExtractedText(text);
      setUploadStatus('extracted');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to extract text from document.';
      setFileError(message);
      setUploadStatus('error');
      setExtractedText('');
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Please provide a campaign or asset title.');
      return;
    }

    let finalContent = '';

    if (mode === 'write') {
      if (!writtenContent.trim() || writtenContent.trim().length < 10) {
        setError('Content copy must be at least 10 characters long for brand audit.');
        return;
      }
      finalContent = writtenContent.trim();
    } else if (mode === 'upload') {
      if (!uploadedFile) {
        setError('Please select or drop a document file to upload.');
        return;
      }
      if (uploadStatus === 'extracting') {
        setError('Document is still extracting text. Please wait a moment.');
        return;
      }
      if (uploadStatus !== 'extracted' || !extractedText.trim() || extractedText.trim().length < 10) {
        setError('Cannot submit empty or unextracted content. Please fix the document or use Write / Paste.');
        return;
      }
      finalContent = extractedText.trim();
    } else if (mode === 'url') {
      setError('Backend URL extraction is currently unavailable. Please use Write / Paste or Upload File.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Simulate async submission and instant AI review queueing
    setTimeout(() => {
      setIsSubmitting(false);
      const newEntry: SubmissionItem = {
        id: `sub-${Date.now()}`,
        title: `${title} (${channel})`,
        timestamp: 'Just now',
        status: 'Needs changes', // Initial status pending human review
      };
      onSubmitSuccess(newEntry);
      setTitle('');
      setWrittenContent('');
      handleResetFile();
      onClose();
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div
        className="w-full max-w-xl bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-headline"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E1D8] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#E8EBE1] flex items-center justify-center text-[#4E6B54]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="modal-headline"
                className="font-serif text-xl font-normal text-[#25251F] leading-tight"
              >
                New Content Submission
              </h2>
              <p className="text-xs text-[#77766E]">
                Add marketing copy for autonomous guideline and claim verification
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-[#77766E] hover:text-[#25251F] hover:bg-[#F1EFE8] transition-colors"
            aria-label="Close modal"
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

          {/* Campaign Title (Preserved) */}
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

          {/* Target Channel (Preserved) */}
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
                <span>Upload File</span>
              </button>

              {/* Tab 3: Import URL (Unavailable) */}
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
                <span className="text-[10px] px-1 py-0.2 rounded-xs bg-[#E5E1D8] text-[#77766E]">
                  N/A
                </span>
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

          {/* Mode 2: Upload File */}
          {mode === 'upload' && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileInputChange}
                className="hidden"
              />

              {/* Drag and Drop Zone if no file is selected */}
              {!uploadedFile && (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
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
                    Click to browse or drag and drop your document
                  </p>
                  <p className="text-[11px] text-[#77766E] mt-1">
                    Supports <strong className="text-[#25251F]">PDF</strong>,{' '}
                    <strong className="text-[#25251F]">DOCX</strong>, and{' '}
                    <strong className="text-[#25251F]">TXT</strong> (Max 5MB)
                  </p>
                </div>
              )}

              {/* File Info Card if file is selected */}
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
                          {(uploadedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {uploadStatus === 'extracting' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#F1EFE8] text-[#77766E]">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Extracting...</span>
                        </span>
                      )}
                      {uploadStatus === 'extracted' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#E8EBE1] text-[#4E6B54]">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Extracted</span>
                        </span>
                      )}
                      {uploadStatus === 'error' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FBEBE8] text-[#B56E63]">
                          <AlertCircle className="w-3 h-3" />
                          <span>Failed</span>
                        </span>
                      )}

                      {/* Replace / Remove buttons */}
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

                  {/* File Error Details */}
                  {fileError && (
                    <div className="p-2.5 rounded-lg bg-[#FBEBE8] border border-[#EAC4BE] text-[#B56E63] text-xs flex items-start gap-2 mt-1">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{fileError}</span>
                    </div>
                  )}

                  {/* Extracted Text Preview */}
                  {uploadStatus === 'extracted' && extractedText && (
                    <div className="mt-2 pt-2 border-t border-[#E5E1D8]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-semibold text-[#25251F] uppercase tracking-wider">
                          Extracted Text Preview
                        </span>
                        <span className="text-[11px] text-[#A09D92]">
                          {extractedText.length} characters
                        </span>
                      </div>
                      <div className="max-h-32 overflow-y-auto p-2.5 rounded-lg bg-[#FFFEFA] border border-[#E5E1D8] text-xs text-[#25251F] font-mono leading-relaxed whitespace-pre-wrap select-text">
                        {extractedText}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Mode 3: Import URL (Unavailable backend notice) */}
          {mode === 'url' && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-[#FDF9F0] border border-[#F2E5C8] text-[#8A6B3D] text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium">URL Extraction Service Currently Unavailable</p>
                  <p className="text-[11px] text-[#77766E] leading-relaxed">
                    The backend web ingestion pipeline is not yet mounted on the Evolyn API server. Public webpage scraping will be activated in an upcoming milestone. Please use <strong>Write / Paste</strong> mode or <strong>Upload File</strong>.
                  </p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="submission-url"
                  className="block text-xs font-semibold text-[#77766E] uppercase tracking-wider mb-1"
                >
                  Public Webpage URL
                </label>
                <input
                  id="submission-url"
                  type="url"
                  disabled
                  placeholder="https://company.example.com/blog/announcement"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E1D8] bg-[#F1EFE8]/70 text-[#A09D92] cursor-not-allowed select-none"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E1D8] flex-shrink-0">
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
                mode === 'url' ||
                (mode === 'upload' && (uploadStatus !== 'extracted' || !extractedText.trim()))
              }
              className="bg-[#25251F] hover:bg-[#383832] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
            >
              {isSubmitting ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Run AI Brand Audit</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
