
'use client';

import { useState, useMemo } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CategoryIcon } from '@/components/icons/category-icon';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Trash2, User } from 'lucide-react';
import type { Note } from '@/types/domain';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

import { DeleteNoteDialog } from './delete-note-dialog';
import { EditNoteDialog } from './edit-note-dialog';
import { useApp } from '@/components/providers/app-provider';
import { motion, AnimatePresence } from 'framer-motion';

interface NotesByEventListProps {
  notes: Note[];
}

export function NotesByEventList({ notes }: NotesByEventListProps) {
  const { currency, deleteNote, categories, dateEvents } = useApp();
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [noteToEdit, setNoteToEdit] = useState<Note | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const groupedByEvent = useMemo(() => {
    const events: Record<string, { date: string; notes: Note[]; total: number }> = {};
    notes.forEach(note => {
      const dateStr = formatDate(note.date);
      const eventName = dateEvents[dateStr] || 'No Event';

      if (!events[eventName]) {
        events[eventName] = { date: dateStr, notes: [], total: 0 };
      }
      events[eventName].notes.push(note);
      events[eventName].total += note.amount;
    });

    return Object.entries(events).sort(([, a], [, b]) => {
      return new Date(b.notes[0].date).getTime() - new Date(a.notes[0].date).getTime();
    });
  }, [notes, dateEvents]);

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
        {groupedByEvent.length > 0 ? (
          <Accordion type="multiple" className="w-full space-y-4">
            {groupedByEvent.map(([eventName, eventData]) => (
              <AccordionItem value={eventName} key={eventName} className="border-b-0">
                 <AccordionTrigger className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors">
                    <div className="flex-1 text-left">
                        <p className="font-semibold text-base">{eventName}</p>
                        <p className="text-sm text-muted-foreground">{eventData.date}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <p className="font-bold text-lg">{formatCurrency(eventData.total, currency)}</p>
                    </div>
                 </AccordionTrigger>
                <AccordionContent className="pt-0">
                    <div className="border-l-2 border-dashed ml-6">
                        <ul className="space-y-4 pt-4 pl-8">
                            {eventData.notes.map((note) => {
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
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <p className="py-12 text-center text-sm text-muted-foreground">No notes found for the selected filters.</p>
        )}
      </div>
      {noteToEdit && (
        <EditNoteDialog
          note={noteToEdit}
          onOpenChange={(open) => !open && setNoteToEdit(null)}
        />
      )}
      {noteToDelete && (
        <DeleteNoteDialog
          note={noteToDelete}
          onDelete={() => handleDelete(noteToDelete.id)}
          onCancel={() => setNoteToDelete(null)}
        />
      )}
    </>
  );
}
