"use client";

import React, { useState, useRef, useCallback } from "react";
import { Upload, FileText, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface DocumentDropzoneProps {
  onTextExtracted: (text: string) => void;
  className?: string;
}

const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".txt", ".md"];
const MAX_FILE_SIZE_MB = 10;

export const DocumentDropzone: React.FC<DocumentDropzoneProps> = ({
  onTextExtracted,
  className = "",
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File) => {
      setError(null);
      setPreviewText(null);

      // Validate extension
      const ext = "." + (file.name.split(".").pop()?.toLowerCase() || "");
      if (!ACCEPTED_EXTENSIONS.includes(ext)) {
        setError(`Định dạng ${ext} không được hỗ trợ. Chấp nhận: ${ACCEPTED_EXTENSIONS.join(", ")}`);
        return;
      }

      // Validate size
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setError(`File quá lớn (${(file.size / 1024 / 1024).toFixed(1)} MB). Tối đa ${MAX_FILE_SIZE_MB} MB.`);
        return;
      }

      setIsProcessing(true);
      setFileName(file.name);

      try {
        // Dynamic import to avoid SSR issues
        const { parseDocument } = await import("@/lib/document/document-parser");
        const text = await parseDocument(file);

        if (!text.trim()) {
          setError("Không trích xuất được nội dung từ file. File có thể trống hoặc chứa hình ảnh.");
          setFileName(null);
          return;
        }

        setPreviewText(text.slice(0, 300) + (text.length > 300 ? "..." : ""));
        onTextExtracted(text);
      } catch (err: any) {
        console.error("Document parse error:", err);
        setError(err.message || "Lỗi đọc file. Vui lòng thử lại.");
        setFileName(null);
      } finally {
        setIsProcessing(false);
      }
    },
    [onTextExtracted]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      // Reset input so the same file can be re-selected
      e.target.value = "";
    },
    [processFile]
  );

  const handleClear = useCallback(() => {
    setFileName(null);
    setPreviewText(null);
    setError(null);
    onTextExtracted("");
  }, [onTextExtracted]);

  return (
    <div className={className}>
      {/* Dropzone Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 p-5 text-center group ${
          isDragOver
            ? "border-primary bg-primary-light/15 scale-[1.01]"
            : fileName
            ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20"
            : "border-border hover:border-primary/50 hover:bg-primary-light/5"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt,.md"
          onChange={handleFileSelect}
          className="hidden"
        />

        {isProcessing ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <span className="text-xs text-primary font-medium">Đang trích xuất nội dung từ {fileName}...</span>
          </div>
        ) : fileName && previewText ? (
          <div className="text-left space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 truncate max-w-[250px]">
                  {fileName}
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="p-1 rounded-full text-text-muted hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                title="Xóa file đã tải"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed line-clamp-3 pl-6">{previewText}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
              <Upload className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">
                Kéo thả tài liệu thuyết trình vào đây
              </p>
              <p className="text-[11px] text-text-muted mt-0.5">
                Hỗ trợ .pdf, .docx, .txt — Tối đa {MAX_FILE_SIZE_MB} MB — Xử lý 100% tại trình duyệt
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-2 flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default DocumentDropzone;
