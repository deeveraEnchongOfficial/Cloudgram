'use client';

import { create } from 'zustand';
import type { FolderInfo } from '@/types/file';

interface FolderStore {
  folders: FolderInfo[];
  currentFolderId: string | null;
  isLoading: boolean;
  setFolders: (folders: FolderInfo[]) => void;
  setCurrentFolder: (folderId: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  addFolder: (folder: FolderInfo) => void;
}

export const useFolderStore = create<FolderStore>((set) => ({
  folders: [],
  currentFolderId: null,
  isLoading: false,
  setFolders: (folders) => set({ folders }),
  setCurrentFolder: (folderId) => set({ currentFolderId: folderId }),
  setIsLoading: (isLoading) => set({ isLoading }),
  addFolder: (folder) => set((state) => ({ folders: [...state.folders, folder] })),
}));
