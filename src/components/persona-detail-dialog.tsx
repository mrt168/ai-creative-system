'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Trash2, Save, X, Edit2 } from 'lucide-react';

interface Persona {
  id: string;
  name: string;
  ageRange: string | null;
  gender: string | null;
  occupation: string | null;
  interests: string[];
  painPoints: string[];
  buyingMotivation: string | null;
}

interface PersonaDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  persona: Persona | null;
  onUpdate: (persona: Persona) => void;
  onDelete: (id: string) => void;
}

export function PersonaDetailDialog({
  open,
  onOpenChange,
  persona,
  onUpdate,
  onDelete,
}: PersonaDetailDialogProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState<Partial<Persona>>({});

  if (!persona) return null;

  const handleStartEdit = () => {
    setFormData({
      name: persona.name,
      ageRange: persona.ageRange,
      gender: persona.gender,
      occupation: persona.occupation,
      interests: persona.interests,
      painPoints: persona.painPoints,
      buyingMotivation: persona.buyingMotivation,
    });
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setFormData({});
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/personas/${persona.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        onUpdate(data.data);
        setEditing(false);
      } else {
        alert(data.error || '更新に失敗しました');
      }
    } catch (error) {
      console.error('Error updating persona:', error);
      alert('更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('このペルソナを削除しますか？')) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/personas/${persona.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        onDelete(persona.id);
        onOpenChange(false);
      } else {
        alert(data.error || '削除に失敗しました');
      }
    } catch (error) {
      console.error('Error deleting persona:', error);
      alert('削除に失敗しました');
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => {
    if (!saving && !deleting) {
      setEditing(false);
      setFormData({});
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {editing ? 'ペルソナを編集' : 'ペルソナ詳細'}
          </DialogTitle>
          <DialogDescription>
            ターゲットペルソナの詳細情報
          </DialogDescription>
        </DialogHeader>

        {editing ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">名前</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ageRange">年齢層</Label>
                <Input
                  id="ageRange"
                  value={formData.ageRange || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, ageRange: e.target.value }))
                  }
                  placeholder="例: 20-30代"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">性別</Label>
                <Input
                  id="gender"
                  value={formData.gender || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, gender: e.target.value }))
                  }
                  placeholder="例: 女性"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="occupation">職業</Label>
              <Input
                id="occupation"
                value={formData.occupation || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, occupation: e.target.value }))
                }
                placeholder="例: 会社員"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="interests">興味・関心（カンマ区切り）</Label>
              <Input
                id="interests"
                value={formData.interests?.join(', ') || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    interests: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  }))
                }
                placeholder="例: 美容, ファッション, 旅行"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="painPoints">課題・悩み（カンマ区切り）</Label>
              <Input
                id="painPoints"
                value={formData.painPoints?.join(', ') || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    painPoints: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  }))
                }
                placeholder="例: 忙しい, 肌荒れ"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="buyingMotivation">購買動機</Label>
              <Textarea
                id="buyingMotivation"
                value={formData.buyingMotivation || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, buyingMotivation: e.target.value }))
                }
                rows={3}
                placeholder="購買を決める主な理由"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div>
              <h3 className="text-lg font-semibold">{persona.name}</h3>
              <div className="flex gap-2 mt-2 flex-wrap">
                {persona.ageRange && (
                  <Badge variant="secondary">{persona.ageRange}</Badge>
                )}
                {persona.gender && (
                  <Badge variant="secondary">{persona.gender}</Badge>
                )}
                {persona.occupation && (
                  <Badge variant="outline">{persona.occupation}</Badge>
                )}
              </div>
            </div>

            {persona.interests.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">興味・関心</p>
                <div className="flex gap-1 flex-wrap">
                  {persona.interests.map((interest, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {persona.painPoints.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">課題・悩み</p>
                <div className="flex gap-1 flex-wrap">
                  {persona.painPoints.map((point, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {point}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {persona.buyingMotivation && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">購買動機</p>
                <p className="text-sm text-gray-600 bg-gray-50 rounded-md p-3">
                  {persona.buyingMotivation}
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex justify-between sm:justify-between">
          {editing ? (
            <>
              <Button variant="outline" onClick={handleCancelEdit} disabled={saving}>
                <X className="w-4 h-4 mr-2" />
                キャンセル
              </Button>
              <Button onClick={handleSave} disabled={saving || !formData.name}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? '保存中...' : '保存'}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {deleting ? '削除中...' : '削除'}
              </Button>
              <Button variant="outline" onClick={handleStartEdit}>
                <Edit2 className="w-4 h-4 mr-2" />
                編集
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
