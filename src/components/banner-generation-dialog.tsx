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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ImageIcon, Loader2, CheckCircle, XCircle } from 'lucide-react';

interface Persona {
  id: string;
  name: string;
  ageRange: string | null;
  gender: string | null;
  occupation: string | null;
}

interface BannerGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  personas: Persona[];
  onSuccess: () => void;
}

type AspectRatio = '1:1' | '16:9' | '9:16' | '4:5';
type BannerSize = 'small' | 'medium' | 'large';

interface GenerationStatus {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  completedCount: number;
  totalCount: number;
  results: Array<{
    bannerId: string;
    status: string;
    imagePath?: string;
    error?: string;
  }>;
}

const ASPECT_RATIO_OPTIONS: { value: AspectRatio; label: string }[] = [
  { value: '1:1', label: '正方形 (1:1)' },
  { value: '16:9', label: '横長 (16:9)' },
  { value: '9:16', label: '縦長 (9:16)' },
  { value: '4:5', label: 'Instagram (4:5)' },
];

const SIZE_OPTIONS: { value: BannerSize; label: string }[] = [
  { value: 'small', label: '小 (512px)' },
  { value: 'medium', label: '中 (1024px)' },
  { value: 'large', label: '大 (2048px)' },
];

export function BannerGenerationDialog({
  open,
  onOpenChange,
  projectId,
  personas,
  onSuccess,
}: BannerGenerationDialogProps) {
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([]);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [size, setSize] = useState<BannerSize>('medium');
  const [generating, setGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePersonaToggle = (personaId: string) => {
    setSelectedPersonas((prev) =>
      prev.includes(personaId)
        ? prev.filter((id) => id !== personaId)
        : [...prev, personaId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPersonas.length === personas.length) {
      setSelectedPersonas([]);
    } else {
      setSelectedPersonas(personas.map((p) => p.id));
    }
  };

  const pollBannerStatus = async (totalCount: number) => {
    const maxAttempts = 120;
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/banners`);
        const data = await response.json();

        if (data.success && data.data) {
          const banners = data.data;
          const completedCount = banners.filter(
            (b: { status: string }) => b.status === 'completed' || b.status === 'failed'
          ).length;
          const successCount = banners.filter(
            (b: { status: string }) => b.status === 'completed'
          ).length;
          const failedCount = banners.filter(
            (b: { status: string }) => b.status === 'failed'
          ).length;
          const processingCount = banners.filter(
            (b: { status: string }) => b.status === 'processing'
          ).length;

          const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

          setGenerationStatus({
            jobId: 'polling',
            status: completedCount >= totalCount ? 'completed' : 'processing',
            progress,
            completedCount,
            totalCount,
            results: banners.slice(-totalCount).map((b: { id: string; status: string; imagePath?: string; errorMessage?: string }) => ({
              bannerId: b.id,
              status: b.status,
              imagePath: b.imagePath,
              error: b.errorMessage,
            })),
          });

          if (completedCount >= totalCount || (processingCount === 0 && completedCount > 0)) {
            setGenerating(false);
            setTimeout(() => {
              onSuccess();
            }, 1500);
            return;
          }
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000);
        } else {
          setError('生成がタイムアウトしました');
          setGenerating(false);
        }
      } catch (err) {
        console.error('Error polling banner status:', err);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 3000);
        } else {
          setError('ステータスの取得に失敗しました');
          setGenerating(false);
        }
      }
    };

    poll();
  };

  const handleGenerate = async () => {
    if (selectedPersonas.length === 0) {
      setError('ペルソナを選択してください');
      return;
    }

    setError(null);
    setGenerating(true);
    setGenerationStatus(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/banners/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personaIds: selectedPersonas,
          settings: {
            aspectRatios: [aspectRatio],
            size: size === 'small' ? '512p' : size === 'medium' ? '1080p' : '2048p',
            count: 1,
            style: 'professional',
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        const totalCount = selectedPersonas.length;
        setGenerationStatus({
          jobId: 'starting',
          status: 'pending',
          progress: 0,
          completedCount: 0,
          totalCount,
          results: [],
        });
        pollBannerStatus(totalCount);
      } else {
        setError(data.error || 'バナー生成の開始に失敗しました');
        setGenerating(false);
      }
    } catch (err) {
      console.error('Error starting generation:', err);
      setError('バナー生成の開始に失敗しました');
      setGenerating(false);
    }
  };

  const handleClose = () => {
    if (!generating) {
      setSelectedPersonas([]);
      setAspectRatio('1:1');
      setSize('medium');
      setGenerationStatus(null);
      setError(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            バナー生成
          </DialogTitle>
          <DialogDescription>
            ペルソナを選択して、バナーを自動生成します
          </DialogDescription>
        </DialogHeader>

        {!generationStatus ? (
          <>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>ペルソナを選択</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    {selectedPersonas.length === personas.length ? '全解除' : '全選択'}
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto border rounded-md p-2">
                  {personas.map((persona) => (
                    <div
                      key={persona.id}
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                        selectedPersonas.includes(persona.id)
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                      onClick={() => handlePersonaToggle(persona.id)}
                    >
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center ${
                          selectedPersonas.includes(persona.id)
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-gray-300'
                        }`}
                      >
                        {selectedPersonas.includes(persona.id) && (
                          <CheckCircle className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{persona.name}</p>
                        <div className="flex gap-1 mt-1">
                          {persona.ageRange && (
                            <Badge variant="secondary" className="text-xs">
                              {persona.ageRange}
                            </Badge>
                          )}
                          {persona.gender && (
                            <Badge variant="secondary" className="text-xs">
                              {persona.gender}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  {selectedPersonas.length}個のペルソナを選択中
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>アスペクト比</Label>
                  <Select
                    value={aspectRatio}
                    onValueChange={(value) => setAspectRatio(value as AspectRatio)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ASPECT_RATIO_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>サイズ</Label>
                  <Select
                    value={size}
                    onValueChange={(value) => setSize(value as BannerSize)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SIZE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                キャンセル
              </Button>
              <Button
                type="button"
                onClick={handleGenerate}
                disabled={generating || selectedPersonas.length === 0}
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4 mr-2" />
                    生成開始
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="py-6 space-y-6">
            <div className="text-center">
              {generationStatus.status === 'completed' ? (
                <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-2" />
              ) : generationStatus.status === 'failed' ? (
                <XCircle className="w-12 h-12 mx-auto text-red-500 mb-2" />
              ) : (
                <Loader2 className="w-12 h-12 mx-auto text-blue-500 mb-2 animate-spin" />
              )}
              <h3 className="text-lg font-medium">
                {generationStatus.status === 'completed'
                  ? '生成完了'
                  : generationStatus.status === 'failed'
                  ? '生成失敗'
                  : '生成中...'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {generationStatus.completedCount} / {generationStatus.totalCount} 完了
              </p>
            </div>

            <Progress value={generationStatus.progress} className="w-full" />

            {generationStatus.results.length > 0 && (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {generationStatus.results.map((result, index) => (
                  <div
                    key={result.bannerId || index}
                    className={`flex items-center gap-2 p-2 rounded text-sm ${
                      result.status === 'completed'
                        ? 'bg-green-50'
                        : result.status === 'failed'
                        ? 'bg-red-50'
                        : 'bg-gray-50'
                    }`}
                  >
                    {result.status === 'completed' ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : result.status === 'failed' ? (
                      <XCircle className="w-4 h-4 text-red-500" />
                    ) : (
                      <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
                    )}
                    <span className="flex-1">
                      バナー {index + 1}
                      {result.error && (
                        <span className="text-red-500 text-xs ml-2">
                          ({result.error})
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {(generationStatus.status === 'completed' ||
              generationStatus.status === 'failed') && (
              <DialogFooter>
                <Button type="button" onClick={handleClose}>
                  閉じる
                </Button>
              </DialogFooter>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
