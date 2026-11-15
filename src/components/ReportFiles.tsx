'use client';

import { useEffect, useRef } from 'react';

/** Frees the files' object URLs when the page that owns them closes. Call it where the file list lives. */
export function useFreeOnLeave(files: LocalFile[]) {
  const latest = useRef(files);
  useEffect(() => {
    latest.current = files;
  }, [files]);
  useEffect(() => () => latest.current.forEach((f) => URL.revokeObjectURL(f.url)), []);
}
import { ClipboardIcon, TrashIcon, UploadIcon } from './Icons';

/** A report file the learner picked. It stays in this browser tab: never uploaded to a server. */
export interface LocalFile {
  id: string;
  name: string;
  isImage: boolean;
  url: string; // object URL, only valid in this tab
}

export function toLocalFiles(list: FileList | null): LocalFile[] {
  return Array.from(list ?? []).map((file) => ({
    id: crypto.randomUUID(),
    name: file.name,
    isImage: file.type.startsWith('image/'),
    url: URL.createObjectURL(file),
  }));
}

/**
 * Pick photos or PDFs of earlier reports and keep them on screen while filling in the form.
 * Reading the report automatically is not built yet, so the learner copies what it says into the form.
 */
export function ReportFiles({
  files,
  onChange,
}: {
  files: LocalFile[];
  onChange: (files: LocalFile[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function remove(id: string) {
    const gone = files.find((f) => f.id === id);
    if (gone) URL.revokeObjectURL(gone.url);
    onChange(files.filter((f) => f.id !== id));
  }

  return (
    <section aria-labelledby="files-heading" className="flex flex-col gap-3">
      <h2 id="files-heading" className="text-xl font-bold">
        Upload your report (optional)
      </h2>
      <label className="flex cursor-pointer items-center gap-4 rounded-3xl border-2 border-dashed border-accent bg-accent-soft p-5 transition-transform duration-75 active:translate-y-1">
        <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-ink shadow-edge-accent">
          <UploadIcon className="h-7 w-7" />
        </span>
        <span className="flex flex-col">
          <span className="text-lg font-bold text-accent-edge">Choose a photo or file</span>
          <span className="text-base text-muted">Photo, screenshot or PDF</span>
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          multiple
          className="sr-only"
          onChange={(e) => {
            onChange([...files, ...toLocalFiles(e.target.files)]);
            if (inputRef.current) inputRef.current.value = '';
          }}
        />
      </label>
      <p className="text-base text-muted">
        Your file stays on this device and is never uploaded. Keep it open here while you fill in the form
        below.
      </p>

      {files.length > 0 && (
        <ul className="flex flex-col gap-3">
          {files.map((file) => (
            <li key={file.id} className="flex flex-col gap-2 rounded-3xl border-2 border-line bg-surface p-3">
              {file.isImage ? (
                <a
                  href={file.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open ${file.name} full size`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- a local object URL, not a server image */}
                  <img
                    src={file.url}
                    alt={`Your report: ${file.name}`}
                    className="max-h-96 w-full rounded-2xl object-contain"
                  />
                </a>
              ) : (
                <a
                  href={file.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-2xl bg-accent-soft p-4 text-lg font-bold text-accent-edge underline underline-offset-4"
                >
                  <ClipboardIcon className="h-6 w-6 shrink-0" />
                  Open {file.name}
                </a>
              )}
              <div className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate text-base text-muted">{file.name}</span>
                <button
                  type="button"
                  onClick={() => remove(file.id)}
                  className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-xl px-3 text-base font-bold text-miss-ink hover:bg-miss-soft"
                >
                  <TrashIcon className="h-5 w-5" />
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
