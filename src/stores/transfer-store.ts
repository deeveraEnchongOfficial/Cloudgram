'use client';

import { create } from 'zustand';
import type { UploadItem, DownloadItem } from '@/types/file';

interface TransferStore {
  uploads: UploadItem[];
  downloads: DownloadItem[];
  addUpload: (item: UploadItem) => void;
  updateUpload: (id: string, updates: Partial<UploadItem>) => void;
  removeUpload: (id: string) => void;
  addDownload: (item: DownloadItem) => void;
  updateDownload: (id: string, updates: Partial<DownloadItem>) => void;
  removeDownload: (id: string) => void;
}

export const useTransferStore = create<TransferStore>((set) => ({
  uploads: [],
  downloads: [],
  addUpload: (item) => set((state) => ({ uploads: [...state.uploads, item] })),
  updateUpload: (id, updates) =>
    set((state) => ({
      uploads: state.uploads.map((u) => (u.id === id ? { ...u, ...updates } : u)),
    })),
  removeUpload: (id) =>
    set((state) => ({ uploads: state.uploads.filter((u) => u.id !== id) })),
  addDownload: (item) => set((state) => ({ downloads: [...state.downloads, item] })),
  updateDownload: (id, updates) =>
    set((state) => ({
      downloads: state.downloads.map((d) => (d.id === id ? { ...d, ...updates } : d)),
    })),
  removeDownload: (id) =>
    set((state) => ({ downloads: state.downloads.filter((d) => d.id !== id) })),
}));
