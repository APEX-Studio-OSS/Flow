
'use client';

import { useState } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CategoryIcon } from '@/components/icons/category-icon';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Trash2, User } from 'lucide-react';
import type { Note } from '@/types/domain';

import { DeleteNoteDialog } from './delete-note-dialog';
import { EditNoteDialog } from './edit-note-dialog';
import { DateEventDialog } from './date-event-dialog';
import { useApp } from '@/components/providers/app-provider';
import { motion, AnimatePresence } from 'framer-motion';

interface NotesListProps {
  notes: Note[];
}

export function NotesList({ notes }: NotesListProps) {
  const { currency, deleteNote, categories, dateEvents } = useApp();
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [noteToEdit, setNoteToEdit] = useState<Note | null>(null);
  const [editingEventDate, setEditingEventDate] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [displayLimit, setDisplayLimit] = useState(50);
  const sortedNotes = notes; // pre-sorted descending in provider

  const visibleNotes = sortedNotes.slice(0, displayLimit);

  const groupedNotes = visibleNotes.reduce((acc, note) => {
    const dateStr = formatDate(note.date);
    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }
    acc[dateStr].push(note);
    return acc;
  }, {} as Record<string, Note[]>);

  const handleDelete = (id: string) => {
    deleteNote(id);
    setNoteToDelete(null);
  };

  const handleMenuToggle = (id: string) => {
    setOpenMenuId(prevId => (prevId === id ? null : id));
  };
  
  return (
    <>
      <div className="space-y-6">
        {Object.keys(groupedNotes).length > 0 ? (
          <>
            {Object.entries(groupedNotes).map(([date, notesOnDate]) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-xs font-medium uppercase text-muted-foreground tracking-wider px-3 py-1 bg-muted rounded-full inline-block">{date}</h3>
                  {dateEvents[date] && <p className="text-sm text-muted-foreground font-medium truncate">- {dateEvents[date]}</p>}
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingEventDate(date)}>
                    <Pencil className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </div>
                <ul className="space-y-4 pt-2">
                  {notesOnDate.map((note) => {
                      const categoryDetails = categories.find(c => c.name === note.category);
                      const isMenuOpen = openMenuId === note.id;
                      return (
                        <li key={note.id} className="flex items-center space-x-4 group">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: categoryDetails ? `${categoryDetails.color}20` : undefined }}>
                            {categoryDetails && <CategoryIcon name={categoryDetails.icon} style={{color: categoryDetails.color}} className="h-5 w-5 transition-transform group-hover:scale-110" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{note.description}</p>
                            <div className='flex items-center gap-2'>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <User className="h-3 w-3" />
                                  <span>{note.person}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <AnimatePresence mode="wait">
                              <motion.div
                                key={isMenuOpen ? 'actions' : 'info'}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                                className="flex items-center gap-2"
                              >
                                {isMenuOpen ? (
                                  <>
                                    <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => { setNoteToEdit(note); setOpenMenuId(null); }}>
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="destructive" size="icon" className="h-9 w-9" onClick={() => { setNoteToDelete(note); setOpenMenuId(null); }}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                ) : (
                                  <div className="text-right">
                                    <p className="font-semibold">{formatCurrency(note.amount, currency)}</p>
                                  </div>
                                )}
                              </motion.div>
                            </AnimatePresence>
                            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => handleMenuToggle(note.id)}>
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">More</span>
                            </Button>
                          </div>
                        </li>
                      );
                  })}
                </ul>
              </div>
            ))}
            {sortedNotes.length > displayLimit && (
              <div className="flex justify-center pt-4">
                <Button variant="outline" size="sm" onClick={() => setDisplayLimit(prev => prev + 50)} className="rounded-xl h-10 px-4 text-xs font-semibold">
                  Load More
                </Button>
              </div>
            )}
          </>
        ) : (
          <p className="py-12 text-center text-sm text-muted-foreground">No notes found for the selected filters.</p>
        )}
      </div>
      <AnimatePresence>
        {noteToEdit && (
          <EditNoteDialog
            note={noteToEdit}
            onOpenChange={(open) => !open && setNoteToEdit(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {noteToDelete && (
          <DeleteNoteDialog
            note={noteToDelete}
            onDelete={() => handleDelete(noteToDelete.id)}
            onCancel={() => setNoteToDelete(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {editingEventDate && (
          <DateEventDialog 
            date={editingEventDate}
            onOpenChange={(open) => !open && setEditingEventDate(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
