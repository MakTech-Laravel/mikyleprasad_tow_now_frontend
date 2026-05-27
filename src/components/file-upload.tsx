import * as React from 'react';
import {
  CloudUpload,
  File as FileIcon,
  FileImage,
  FileText,
  FileVideo,
  X,
  type LucideIcon as LucideIconType,
} from 'lucide-react';
import Lightbox, { type Slide } from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Video from 'yet-another-react-lightbox/plugins/video';
import 'yet-another-react-lightbox/styles.css';

import { cn } from '@/lib/utils';
import { Icon } from '@/components/icon';

const FILE_TYPE_ICONS = {
  'application/pdf': FileText,
  'text/csv': FileText,
  'application/vnd.ms-excel': FileText,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': FileText,
  'application/msword': FileText,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': FileText,
  'text/plain': FileText,
  image: FileImage,
  video: FileVideo,
  default: FileIcon,
};

interface ExistingFile {
  id: number | string;
  path: string;
  url: string;
  mime_type: string;
  name?: string;
  size?: number;
}

interface FileUploadProps {
  value?: File | File[] | null;
  onChange: (files: File | File[] | null) => void;
  existingFiles?: ExistingFile[];
  onRemoveExisting?: (fileId: number | string) => void;
  multiple?: boolean;
  accept?: string;
  maxSize?: number;
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
  innerClassName?: string;
  error?: string;
  required?: boolean;
  label?: string;
  description?: string;
  icon?: LucideIconType;
}

type NewPreview = {
  file: File;
  url: string;
};

function getMimeType(file: File | ExistingFile) {
  return file instanceof File ? file.type : file.mime_type;
}

function isImage(mimeType: string) {
  return mimeType.startsWith('image/');
}

function isVideo(mimeType: string) {
  return mimeType.startsWith('video/');
}

function getFileName(file: File | ExistingFile) {
  if (file instanceof File) return file.name;
  return file.name ?? file.path.split('/').pop() ?? 'File';
}

function getFileIcon(mimeType: string) {
  if (isImage(mimeType)) return FILE_TYPE_ICONS.image;
  if (isVideo(mimeType)) return FILE_TYPE_ICONS.video;
  return FILE_TYPE_ICONS[mimeType as keyof typeof FILE_TYPE_ICONS] ?? FILE_TYPE_ICONS.default;
}

function renderFileIcon(mimeType: string, className: string) {
  const Icon = getFileIcon(mimeType);
  return <Icon className={className} />;
}

function formatFileSize(bytes?: number): string | null {
  if (!bytes) return null;
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}

function useNewPreviews(files: File[]) {
  const previews = React.useMemo<NewPreview[]>(
    () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files],
  );

  React.useEffect(() => {
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [previews]);

  return previews;
}

function FilePreviewCard({
  file,
  url,
  onOpen,
  onRemove,
  removeLabel,
}: {
  file: File | ExistingFile;
  url: string;
  onOpen?: () => void;
  onRemove?: () => void;
  removeLabel: string;
}) {
  const mimeType = getMimeType(file);
  const name = getFileName(file);
  const size = formatFileSize(file instanceof File ? file.size : file.size);
  const canOpen = Boolean(onOpen) && (isImage(mimeType) || isVideo(mimeType));

  return (
    <div className="group relative overflow-hidden rounded-lg border bg-background">
      <button
        type="button"
        onClick={canOpen ? onOpen : undefined}
        disabled={!canOpen}
        className="flex aspect-video w-full items-center justify-center bg-muted disabled:cursor-default"
      >
        {isImage(mimeType) ? (
          <img src={url} alt={name} className="h-full w-full object-cover" />
        ) : isVideo(mimeType) ? (
          <video src={url} className="h-full w-full object-cover" muted />
        ) : (
          renderFileIcon(mimeType, 'h-12 w-12 text-muted-foreground')
        )}
      </button>
      <div className="space-y-0.5 p-2">
        <p className="truncate text-xs font-medium">{name}</p>
        {size ? <p className="text-xs text-muted-foreground">{size}</p> : null}
      </div>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel}
          className="absolute top-2 right-2 rounded-full bg-red-500 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600 focus:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}

export default function FileUpload({
  value,
  onChange,
  existingFiles = [],
  onRemoveExisting,
  multiple = false,
  accept,
  maxSize = 10,
  maxFiles,
  disabled = false,
  className,
  innerClassName,
  error,
  required = false,
  label,
  description,
  icon = CloudUpload,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [lightboxIndex, setLightboxIndex] = React.useState(0);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const newFiles = React.useMemo<File[]>(() => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return [value];
  }, [value]);

  const newPreviews = useNewPreviews(newFiles);
  const totalFileCount = existingFiles.length + newFiles.length;
  const maxAllowed = multiple ? maxFiles : 1;
  const canAddMore = !maxAllowed || totalFileCount < maxAllowed;
  const showUploadArea = multiple ? canAddMore : totalFileCount === 0;

  const lightboxSlides = React.useMemo<Slide[]>(() => {
    const existingSlides = existingFiles
      .filter((file) => isImage(file.mime_type) || isVideo(file.mime_type))
      .map((file) =>
        isVideo(file.mime_type)
          ? { type: 'video' as const, sources: [{ src: file.url, type: file.mime_type }] }
          : { src: file.url, alt: getFileName(file) },
      );

    const newSlides = newPreviews
      .filter((preview) => isImage(preview.file.type) || isVideo(preview.file.type))
      .map((preview) =>
        isVideo(preview.file.type)
          ? { type: 'video' as const, sources: [{ src: preview.url, type: preview.file.type }] }
          : { src: preview.url, alt: preview.file.name },
      );

    return [...existingSlides, ...newSlides];
  }, [existingFiles, newPreviews]);

  function openLightbox(source: 'existing' | 'new', localIndex: number) {
    const existingMediaCount = existingFiles.filter(
      (file) => isImage(file.mime_type) || isVideo(file.mime_type),
    ).length;
    const slideIndex = source === 'existing' ? localIndex : existingMediaCount + localIndex;
    setLightboxIndex(slideIndex);
    setLightboxOpen(true);
  }

  function updateFiles(nextFiles: File[]) {
    if (multiple) {
      onChange(nextFiles.length > 0 ? nextFiles : null);
      return;
    }
    onChange(nextFiles[0] ?? null);
  }

  function processFiles(files: FileList | File[]) {
    const incomingFiles = Array.from(files);
    const validFiles = incomingFiles.filter((file) => file.size / (1024 * 1024) <= maxSize);

    if (validFiles.length !== incomingFiles.length) {
      alert(`Some files exceed the ${maxSize}MB size limit and were not added.`);
    }

    if (!multiple) {
      updateFiles(validFiles.slice(0, 1));
      return;
    }

    const remainingSlots = maxFiles ? Math.max(maxFiles - totalFileCount, 0) : validFiles.length;
    const filesToAdd = validFiles.slice(0, remainingSlots);

    if (validFiles.length > remainingSlots) {
      alert(`Maximum ${maxFiles} files allowed. Only first ${remainingSlots} files were added.`);
    }

    updateFiles([...newFiles, ...filesToAdd]);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files?.length) processFiles(event.target.files);
    event.target.value = '';
  }

  function handleRemoveNew(index: number) {
    updateFiles(newFiles.filter((_, fileIndex) => fileIndex !== index));
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (!disabled && event.dataTransfer.files.length) {
      processFiles(event.dataTransfer.files);
    }
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (!disabled) setIsDragging(true);
  }

  function handleDragLeave(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }

  const existingMediaIndex = (targetIndex: number) =>
    existingFiles
      .slice(0, targetIndex)
      .filter((file) => isImage(file.mime_type) || isVideo(file.mime_type)).length;

  const newMediaIndex = (targetIndex: number) =>
    newPreviews
      .slice(0, targetIndex)
      .filter((preview) => isImage(preview.file.type) || isVideo(preview.file.type)).length;

  const uploadAreaLabel = label ?? (multiple ? `Add ${maxFiles ?? 1} files` : `Add file`);
  const uploadAreaDescription =
    description ??
    (accept?.includes('image')
      ? `Upload images (max ${maxSize ?? 10}MB)`
      : `Upload files (max ${maxSize ?? 10}MB)`);

  return (
    <div className={cn('w-full', className)}>
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={lightboxSlides}
        index={lightboxIndex}
        plugins={[Zoom, Video]}
        zoom={{ maxZoomPixelRatio: 4 }}
      />

      {showUploadArea ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={cn(
            'flex cursor-pointer items-center justify-center rounded-lg border-2 border-input transition-all',
            'hover:border-primary hover:bg-primary/10',
            isDragging && 'scale-[1.02] border-primary bg-accent/50',
            disabled && 'cursor-not-allowed opacity-50',
            error && 'border-red-500',
            totalFileCount === 0 ? 'p-12' : 'p-6',
            innerClassName,
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            multiple={multiple}
            accept={accept}
            disabled={disabled}
            className="hidden"
            aria-required={required}
          />
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <Icon iconNode={icon as unknown as LucideIconType} className="h-7 w-7 text-primary" />
            <span className="text-sm font-medium text-primary">{uploadAreaLabel}</span>
            <span className="text-xs text-muted-foreground">{uploadAreaDescription}</span>
          </div>
        </div>
      ) : null}

      {!multiple && totalFileCount > 0 ? (
        <div className={cn('overflow-hidden rounded-lg border-2 border-primary', innerClassName)}>
          {newPreviews[0] ? (
            <FilePreviewCard
              file={newPreviews[0].file}
              url={newPreviews[0].url}
              onOpen={
                isImage(newPreviews[0].file.type) || isVideo(newPreviews[0].file.type)
                  ? () => openLightbox('new', 0)
                  : undefined
              }
              onRemove={() => updateFiles([])}
              removeLabel="Remove selected file"
            />
          ) : existingFiles[0] ? (
            <FilePreviewCard
              file={existingFiles[0]}
              url={existingFiles[0].url}
              onOpen={
                isImage(existingFiles[0].mime_type) || isVideo(existingFiles[0].mime_type)
                  ? () => openLightbox('existing', 0)
                  : undefined
              }
              onRemove={onRemoveExisting ? () => onRemoveExisting(existingFiles[0].id) : undefined}
              removeLabel="Remove existing file"
            />
          ) : null}
        </div>
      ) : null}

      {multiple && existingFiles.length > 0 ? (
        <div className="mt-4 space-y-3">
          <h3 className="text-sm font-medium">Existing files</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {existingFiles.map((file, index) => (
              <FilePreviewCard
                key={file.id != null && String(file.id) !== '' ? String(file.id) : `existing-${index}`}
                file={file}
                url={file.url}
                onOpen={
                  isImage(file.mime_type) || isVideo(file.mime_type)
                    ? () => openLightbox('existing', existingMediaIndex(index))
                    : undefined
                }
                onRemove={onRemoveExisting ? () => onRemoveExisting(file.id) : undefined}
                removeLabel="Remove existing file"
              />
            ))}
          </div>
        </div>
      ) : null}

      {multiple && newPreviews.length > 0 ? (
        <div className="mt-4 space-y-3">
          <h3 className="text-sm font-medium">New files</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {newPreviews.map((preview, index) => (
              <FilePreviewCard
                key={`new-${index}-${preview.url}`}
                file={preview.file}
                url={preview.url}
                onOpen={
                  isImage(preview.file.type) || isVideo(preview.file.type)
                    ? () => openLightbox('new', newMediaIndex(index))
                    : undefined
                }
                onRemove={() => handleRemoveNew(index)}
                removeLabel="Remove selected file"
              />
            ))}
          </div>
        </div>
      ) : null}

      {error ? <p className="mt-2 text-sm text-red-500">{error}</p> : null}
    </div>
  );
}
