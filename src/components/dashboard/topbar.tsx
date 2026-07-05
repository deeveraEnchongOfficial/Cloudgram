'use client';

import { Search, Upload, Grid, List, Sun, Moon, Menu } from 'lucide-react';
import { useTheme } from '@/providers/theme-provider';
import { useFileStore } from '@/stores/file-store';
import { cn } from '@/lib/utils/cn';

interface TopbarProps {
  onMobileMenu: () => void;
}

export function Topbar({ onMobileMenu }: TopbarProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const { viewMode, setViewMode, searchQuery, setSearchQuery, sortBy, setSortBy, sortOrder, setSortOrder, triggerUpload } = useFileStore();

  return (
    <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="flex items-center gap-3 px-4 h-14">
        <button
          onClick={onMobileMenu}
          className="md:hidden p-2 rounded-lg hover:bg-accent"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files..."
            className="w-full pl-10 pr-3 py-1.5 rounded-lg bg-muted border border-border text-sm focus:ring-2 focus:ring-ring outline-none"
          />
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="hidden sm:block px-2 py-1.5 rounded-lg bg-muted border border-border text-sm outline-none"
        >
          <option value="date">Date</option>
          <option value="name">Name</option>
          <option value="size">Size</option>
        </select>

        <button
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="hidden sm:block px-2 py-1.5 rounded-lg bg-muted border border-border text-sm"
        >
          {sortOrder === 'asc' ? '↑' : '↓'}
        </button>

        <div className="flex items-center rounded-lg bg-muted border border-border">
          <button
            onClick={() => setViewMode('grid')}
            className={cn('p-1.5 rounded-l-lg', viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn('p-1.5 rounded-r-lg', viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')}
          >
            <List className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-lg hover:bg-accent"
        >
          {resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          onClick={triggerUpload}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
        >
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">Upload</span>
        </button>
      </div>
    </header>
  );
}
