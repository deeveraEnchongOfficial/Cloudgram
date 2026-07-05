'use client';

import { create } from 'zustand';
import type { FileMetadata, FolderInfo } from '@/types/file';

interface FileStore {
  currentFolderId: string | null;
  files: FileMetadata[];
  selectedFiles: Set<number>;
  viewMode: 'grid' | 'list';
  sortBy: 'date' | 'name' | 'size';
  sortOrder: 'asc' | 'desc';
  searchQuery: string;
  isLoading: boolean;
  uploadTrigger: number;

  setCurrentFolder: (folderId: string | null) => void;
  setFiles: (files: FileMetadata[]) => void;
  toggleSelect: (id: number) => void;
  selectAll: () => void;
  clearSelection: () => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  setSortBy: (sortBy: 'date' | 'name' | 'size') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  setSearchQuery: (q: string) => void;
  setIsLoading: (loading: boolean) => void;
  triggerUpload: () => void;
}

export const useFileStore = create<FileStore>((set) => ({
  currentFolderId: null,
  files: [],
  selectedFiles: new Set(),
  viewMode: 'grid',
  sortBy: 'date',
  sortOrder: 'desc',
  searchQuery: '',
  isLoading: false,
  uploadTrigger: 0,

  setCurrentFolder: (folderId) => set({ currentFolderId: folderId, selectedFiles: new Set() }),
  setFiles: (files) => set({ files }),
  toggleSelect: (id) =>
    set((state) => {
      const newSet = new Set(state.selectedFiles);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return { selectedFiles: newSet };
    }),
  selectAll: () => set((state) => ({ selectedFiles: new Set(state.files.map((f) => f.id)) })),
  clearSelection: () => set({ selectedFiles: new Set() }),
  setViewMode: (viewMode) => set({ viewMode }),
  setSortBy: (sortBy) => set({ sortBy }),
  setSortOrder: (sortOrder) => set({ sortOrder }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setIsLoading: (isLoading) => set({ isLoading }),
  triggerUpload: () => set((state) => ({ uploadTrigger: state.uploadTrigger + 1 })),
}));
