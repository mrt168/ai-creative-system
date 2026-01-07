'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface StrategyPersona {
  id: string;
  projectId: string;
  name: string;
  gender: string | null;
  ageFrom: number | null;
  ageTo: number | null;
  issue: string | null;
  funnel: string | null;
  appealAxes: string[];
  createdAt: Date;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (personas: StrategyPersona[]) => void;
  currentProjectId: string;
}

export function SavedPersonaSelectDialog({ open, onOpenChange, onSelect, currentProjectId }: Props) {
  const [personas, setPersonas] = useState<StrategyPersona[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchPersonas();
    }
  }, [open]);

  const fetchPersonas = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/strategy-personas');
      const data = await res.json();
      if (data.success) {
        setPersonas(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch personas:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleConfirm = () => {
    const selected = personas.filter(p => selectedIds.has(p.id));
    onSelect(selected);
    setSelectedIds(new Set());
    onOpenChange(false);
  };

  // Group by: current project vs other projects
  const currentProjectPersonas = personas.filter(p => p.projectId === currentProjectId);
  const otherProjectPersonas = personas.filter(p => p.projectId !== currentProjectId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>過去のターゲットペルソナから選択</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            {/* Current project */}
            {currentProjectPersonas.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  このプロジェクト
                </h3>
                <PersonaList
                  personas={currentProjectPersonas}
                  selectedIds={selectedIds}
                  onToggle={toggleSelect}
                />
              </div>
            )}

            {/* Other projects */}
            {otherProjectPersonas.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  他のプロジェクト
                </h3>
                <PersonaList
                  personas={otherProjectPersonas}
                  selectedIds={selectedIds}
                  onToggle={toggleSelect}
                />
              </div>
            )}

            {personas.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                保存されたペルソナがありません
              </p>
            )}
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleConfirm} disabled={selectedIds.size === 0}>
            選択したペルソナを追加 ({selectedIds.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PersonaList({ personas, selectedIds, onToggle }: {
  personas: StrategyPersona[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      {personas.map(persona => (
        <div
          key={persona.id}
          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
            selectedIds.has(persona.id) ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
          }`}
          onClick={() => onToggle(persona.id)}
        >
          <div className="flex items-start gap-3">
            <Checkbox
              checked={selectedIds.has(persona.id)}
              onCheckedChange={() => onToggle(persona.id)}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">{persona.name}</span>
                {persona.gender && (
                  <Badge variant="secondary" className="text-xs">
                    {persona.gender}
                  </Badge>
                )}
                {persona.ageFrom && persona.ageTo && (
                  <Badge variant="outline" className="text-xs">
                    {persona.ageFrom}〜{persona.ageTo}歳
                  </Badge>
                )}
              </div>
              {persona.issue && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  課題: {persona.issue}
                </p>
              )}
              {persona.appealAxes.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {persona.appealAxes.slice(0, 3).map((axis, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {axis}
                    </Badge>
                  ))}
                  {persona.appealAxes.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{persona.appealAxes.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
