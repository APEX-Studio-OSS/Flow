
'use client';

import { useState, useEffect } from 'react';
import { NotesList } from '@/features/notes/notes-list'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Note } from '@/types/domain';
import { NotesFilterDialog } from '@/features/notes/notes-filter-dialog';
import { Button } from '@/components/ui/button';
import { ListFilter, List, BookCopy, Search } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NotesByEventList } from '@/features/notes/notes-by-event-list';
import { useApp } from '@/components/providers/app-provider';
import { Input } from '@/components/ui/input';

export default function AllNotesPage() {
  const { notes } = useApp();
  const [filteredNotes, setFilteredNotes] = useState<Note[]>(notes);
  const [finalNotes, setFinalNotes] = useState<Note[]>(notes);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'default' | 'byEvent'>('default');

  useEffect(() => {
    setFilteredNotes(notes);
  }, [notes]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  useEffect(() => {
    if (debouncedSearchTerm) {
        setFinalNotes(filteredNotes.filter(n => 
            n.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || 
            n.person.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        ));
    } else {
        setFinalNotes(filteredNotes);
    }
  }, [debouncedSearchTerm, filteredNotes]);

  const activeFiltersCount = notes !== filteredNotes ? 1 : 0;

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8 pb-[calc(1.5rem+var(--safe-area-bottom))] pl-[calc(1rem+var(--safe-area-left))] pr-[calc(1rem+var(--safe-area-right))] max-w-7xl h-[calc(100dvh_-_var(--app-header-total-height))] flex flex-col">
      <div className="flex flex-col flex-1 min-h-0">
        <Card className="border bg-card/60 backdrop-blur-md shadow-sm rounded-2xl flex flex-col flex-1 min-h-0 overflow-hidden">
          <CardHeader className="pb-3 pt-5 px-5">
             <div className="space-y-1.5">
                <CardTitle className="text-xl md:text-2xl font-bold text-foreground">Notes</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">View and manage all your notes.</CardDescription>
            </div>
            <div className="flex items-center gap-2 mt-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                        placeholder="Search by keyword or person..."
                        className="pl-10 h-12 rounded-xl bg-background/50 border-input focus-visible:ring-2 focus-visible:ring-primary transition-all duration-200 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'default' | 'byEvent')}>
                    <TabsList className="h-12 rounded-2xl p-1 bg-muted/60">
                        <TabsTrigger value="default" className="h-10 rounded-xl text-xs font-semibold px-3 flex gap-1.5 items-center data-[state=active]:rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0">
                            <List className="h-4 w-4" />
                            <span className="sr-only">Default View</span>
                        </TabsTrigger>
                        <TabsTrigger value="byEvent" className="h-10 rounded-xl text-xs font-semibold px-3 flex gap-1.5 items-center data-[state=active]:rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0">
                            <BookCopy className="h-4 w-4" />
                            <span className="sr-only">By Event View</span>
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
                <NotesFilterDialog setFilteredNotes={setFilteredNotes} filteredNotes={filteredNotes}>
                  <Button variant="outline" size="sm" className="relative h-12 w-12 p-0 sm:w-auto sm:px-4 sm:py-2 rounded-xl">
                      <ListFilter className="h-5 w-5 sm:mr-2" />
                      <span className="sr-only sm:not-sr-only">Filter</span>
                      {activeFiltersCount > 0 && (
                          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                          {activeFiltersCount}
                          </span>
                      )}
                  </Button>
                </NotesFilterDialog>
            </div>
          </CardHeader>
          <CardContent className="flex-1 px-5 pb-4 min-h-0 overflow-y-auto no-scrollbar relative">
            {viewMode === 'default' ? (
              <NotesList notes={finalNotes} />
            ) : (
              <NotesByEventList notes={finalNotes} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
