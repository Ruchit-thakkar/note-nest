export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt?: string | number;
  updatedAt?: string | number;
}

export type CopyType = 'synced' | 'personal';
export type SyncMode = CopyType; // alias for backwards compatibility

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string; // Rich HTML content
  plainText?: string; // Plain text snippet for fast search & preview
  tags: string[];
  isFavorite: boolean;
  isTrash: boolean;
  createdAt: any;
  updatedAt: any;
  deletedAt?: any | null;

  // Publishing fields (for creator notes)
  isPublished?: boolean;
  publicId?: string | null;
  version?: number; // Monotonically increases on explicit Save

  // Relationship fields (for notes added from others)
  sourcePublicId?: string | null;
  sourceNoteId?: string | null;
  sourceOwnerId?: string | null;
  sourceCreatorName?: string | null;
  copyType?: CopyType | null;
  syncMode?: CopyType | null; // alias
  sourceVersion?: number;
  lastSyncedVersion?: number;
  sourceStatus?: 'active' | 'unpublished' | 'deleted' | null;
  isOriginalDeleted?: boolean;
  createdFromSharedNoteAt?: any;

  // Phase 3: AI Vector Indexing metadata
  aiIndexStatus?: AIIndexStatus;
  aiIndexedVersion?: number;
  aiIndexedAt?: any;
}

export interface PublicNote {
  publicId: string;
  noteId: string;
  ownerId: string;
  creatorName: string;
  title: string;
  content: string;
  plainText: string;
  tags: string[];
  isPublished: boolean;
  publishedAt: any;
  updatedAt: any;
  currentVersion: number;
  
  // Share Settings
  allowCopy: boolean;
  showCreator: boolean;
  showTags: boolean;
  allowIndexing: boolean;

  // Basic privacy-conscious analytics
  viewsCount: number;
  copiesCount: number;

  // Future monetization architecture
  accessType?: 'free' | 'paid';
  price?: number;
  currency?: string;
  purchaseRequired?: boolean;
}

export interface ShareSettings {
  allowCopy: boolean;
  showCreator: boolean;
  showTags: boolean;
  allowIndexing: boolean;
  accessType?: 'free' | 'paid';
  price?: number;
  currency?: string;
}

export interface Tag {
  id: string;
  userId: string;
  name: string;
  color?: string;
  createdAt: any;
}

export type ThemeMode = 'light' | 'dark' | 'system';
export type AccentColor = 'amber' | 'indigo' | 'emerald' | 'rose' | 'sky' | 'violet';

export interface UserSettings {
  theme: ThemeMode;
  accentColor: AccentColor;
}

export type FilterView =
  | 'all'
  | 'recent'
  | 'favorites'
  | 'trash'
  | 'tag'
  | 'shared' // Notes added from others (synced or personal copies)
  | 'published'; // Notes published by this user

export type SortOption =
  | 'updated_desc'
  | 'updated_asc'
  | 'created_desc'
  | 'created_asc'
  | 'title_asc'
  | 'title_desc';

export type SaveState = 'saved' | 'unsaved' | 'saving' | 'error';
export type SaveStatus = SaveState; // alias for backwards compatibility

export type NoteSyncStatus =
  | 'synced'
  | 'update_available'
  | 'conflict'
  | 'unavailable'
  | 'personal'
  | 'none';

// Phase 3: AI & RAG Architecture Types
export type AIIndexStatus = 'idle' | 'processing' | 'indexed' | 'failed';

export interface NoteChunk {
  chunkId: string;
  noteId: string;
  userId: string;
  noteVersion: number;
  noteTitle: string;
  content: string;
  heading?: string;
}

export interface AISourceCitation {
  noteId: string;
  noteTitle: string;
  chunkSnippet: string;
  version: number;
  score?: number;
}

export interface AISearchResult {
  answer: string;
  sources: AISourceCitation[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: AISourceCitation[];
  timestamp: number;
}

export type ExplainMode = 'simple' | 'beginner' | 'key_points' | 'revision';

