import { useCallback } from 'react';
import type { Note } from '@/types/domain';
import usePersistentState from '@/hooks/use-persistent-state';
import { STORAGE_KEYS } from '@/constants/storage-keys';

export function useNotesState() {
  const [notes, setNotes, areNotesLoaded] = usePersistentState<Note[]>(STORAGE_KEYS.notes, []);

  const addNote = useCallback((noteData: Omit<Note, 'id' | 'date'>, date: Date = new Date()) => {
    setNotes(prev => [{ id: `note-${Date.now()}`, date, ...noteData }, ...prev]);
  }, [setNotes]);

  const updateNote = useCallback((updated: Note) => {
    setNotes(prev => prev.map(n => (n.id === updated.id ? updated : n)));
  }, [setNotes]);

  const deleteNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  }, [setNotes]);

  return {
    notes,
    setNotes,
    areNotesLoaded,
    addNote,
    updateNote,
    deleteNote
  };
}
