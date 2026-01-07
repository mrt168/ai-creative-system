'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  Plus,
  X,
  Lightbulb,
  Check,
  Save,
  FolderOpen,
  Image,
  Loader2,
} from 'lucide-react';
import { FunnelType } from '@/types/strategy';
import { AppealAxisId, APPEAL_AXIS_OPTIONS } from '@/constants/appeal-axes';
import { CreativeTemplate, StrategySettings, TargetDefinition } from '@/types/template';
import { AspectRatio, ImageSize } from '@/types/banner';
import { ASPECT_RATIO_OPTIONS } from '@/constants/aspect-ratios';
import { IMAGE_SIZE_OPTIONS } from '@/constants/banner-sizes';
import { SavedPersonaSelectDialog } from './saved-persona-select-dialog';
import type { StrategyPersona } from '@/lib/supabase/repositories/strategy-persona';

interface StrategyFormData {
  funnel: FunnelType;
  appealAxes: AppealAxisId[];
  targets: TargetDefinition[];
}

interface StrategyFormProps {
  projectId: string;
  onComplete: (data: StrategyFormData) => void;
  isLoading?: boolean;
  templates?: CreativeTemplate[];
  onSaveTemplate?: (name: string, settings: StrategySettings) => Promise<void>;
  onLoadTemplate?: (template: CreativeTemplate) => void;
  initialSettings?: StrategySettings;
  onBannerGenerated?: () => void;
}

type GenerationStatus = 'idle' | 'generating' | 'success' | 'error';

export function StrategyForm({
  projectId,
  onComplete,
  isLoading = false,
  templates = [],
  onSaveTemplate,
  onLoadTemplate,
  initialSettings,
  onBannerGenerated,
}: StrategyFormProps) {
  const [funnel, setFunnel] = useState<FunnelType>(initialSettings?.funnel || 'awareness');
  const [selectedAppeals, setSelectedAppeals] = useState<AppealAxisId[]>(initialSettings?.appealAxes || []);
  const [targets, setTargets] = useState<TargetDefinition[]>(
    initialSettings?.targets?.length ? initialSettings.targets : [{ gender: '', ageFrom: '', ageTo: '', issue: '' }]
  );
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Banner generation state
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [imageSize, setImageSize] = useState<ImageSize>('1080p');
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>('idle');
  const [generationMessage, setGenerationMessage] = useState('');
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Saved persona selection dialog
  const [showPersonaSelectDialog, setShowPersonaSelectDialog] = useState(false);

  // Update form when initialSettings changes
  useEffect(() => {
    if (initialSettings) {
      setFunnel(initialSettings.funnel);
      setSelectedAppeals(initialSettings.appealAxes);
      setTargets(initialSettings.targets?.length ? initialSettings.targets : [{ gender: '', ageFrom: '', ageTo: '', issue: '' }]);
    }
  }, [initialSettings]);

  const getCurrentSettings = (): StrategySettings => ({
    funnel,
    appealAxes: selectedAppeals,
    targets,
  });

  const handleSaveTemplate = async () => {
    if (!templateName.trim() || !onSaveTemplate) return;
    setIsSaving(true);
    try {
      await onSaveTemplate(templateName.trim(), getCurrentSettings());
      setShowSaveDialog(false);
      setTemplateName('');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      // Load strategy settings from template
      const settings = template.strategySettings;
      if (settings) {
        setFunnel(settings.funnel || 'awareness');
        setSelectedAppeals(settings.appealAxes || []);
        setTargets(settings.targets?.length ? settings.targets : [{ gender: '', ageFrom: '', ageTo: '', issue: '' }]);
      }
      onLoadTemplate?.(template);
    }
  };

  const addTarget = () => {
    setTargets([...targets, { gender: '', ageFrom: '', ageTo: '', issue: '' }]);
  };

  const removeTarget = (index: number) => {
    if (targets.length > 1) {
      setTargets(targets.filter((_, i) => i !== index));
    }
  };

  const updateTarget = (
    index: number,
    field: keyof TargetDefinition,
    value: string
  ) => {
    const newTargets = [...targets];
    newTargets[index] = { ...newTargets[index], [field]: value };
    setTargets(newTargets);
  };

  const toggleAppeal = (appealId: AppealAxisId) => {
    setSelectedAppeals((prev) =>
      prev.includes(appealId)
        ? prev.filter((id) => id !== appealId)
        : [...prev, appealId]
    );
  };

  const isFormValid = () => {
    const hasValidTargets = targets.every(
      (t) => t.gender && t.ageFrom && t.ageTo && t.issue.trim()
    );
    return hasValidTargets && selectedAppeals.length > 0;
  };

  const handleSubmit = () => {
    if (!isFormValid()) return;

    onComplete({
      funnel,
      appealAxes: selectedAppeals,
      targets,
    });
  };

  // Handler for saved persona selection
  const handlePersonaSelect = (selectedPersonas: StrategyPersona[]) => {
    const newTargets: TargetDefinition[] = selectedPersonas.map((persona) => ({
      name: persona.name,
      gender: (persona.gender as 'male' | 'female' | 'all' | '') || '',
      ageFrom: persona.ageFrom?.toString() || '',
      ageTo: persona.ageTo?.toString() || '',
      issue: persona.issue || '',
    }));

    // Append to existing targets (filter out empty ones first)
    const validExistingTargets = targets.filter(
      (t) => t.gender || t.ageFrom || t.ageTo || t.issue
    );
    setTargets([...validExistingTargets, ...newTargets]);
  };

  // Banner generation handler
  const handleGenerateBanner = async () => {
    if (!isFormValid()) return;

    setGenerationStatus('generating');
    setGenerationMessage('バナー生成を開始しています...');
    setGenerationError(null);

    try {
      // Prepare targets with names
      const targetsWithNames = targets.map((t, index) => ({
        name: t.name || `ターゲット ${index + 1}`,
        gender: t.gender,
        ageFrom: parseInt(t.ageFrom, 10),
        ageTo: parseInt(t.ageTo, 10),
        issue: t.issue,
      }));

      setGenerationMessage(`${targetsWithNames.length}件のターゲットに対してバナーを生成中...`);

      const response = await fetch(`/api/projects/${projectId}/auto-banner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targets: targetsWithNames,
          funnel,
          appealAxes: selectedAppeals,
          aspectRatio,
          size: imageSize,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'バナー生成に失敗しました');
      }

      const { summary } = result.data;
      setGenerationMessage(
        `完了: ${summary.success}/${summary.total}件のバナーを生成しました`
      );
      setGenerationStatus('success');

      // Callback for parent component
      onBannerGenerated?.();
    } catch (error) {
      console.error('Banner generation error:', error);
      setGenerationError(
        error instanceof Error ? error.message : 'バナー生成中にエラーが発生しました'
      );
      setGenerationStatus('error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Template Selection and Save */}
      {(templates.length > 0 || onSaveTemplate) && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              {templates.length > 0 && (
                <div className="flex-1">
                  <Label className="mb-2 block text-sm font-medium">テンプレートから読み込み</Label>
                  <Select onValueChange={handleSelectTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="テンプレートを選択..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {onSaveTemplate && (
                <div className={templates.length > 0 ? '' : 'ml-auto'}>
                  <Label className="mb-2 block text-sm font-medium">&nbsp;</Label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowSaveDialog(true)}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    テンプレート保存
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Funnel Selection */}
      <Card>
        <CardHeader>
          <CardTitle>1. ファネル定義</CardTitle>
          <CardDescription>広告の目的を選択してください</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setFunnel('awareness')}
              className={`rounded-lg border-2 p-6 text-left transition-all ${
                funnel === 'awareness'
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card hover:border-primary/50'
              }`}
            >
              <div className="mb-2 text-lg font-semibold">認知獲得</div>
              <div className="text-sm text-muted-foreground">
                ブランド認知・興味喚起を目的とした広告
              </div>
            </button>
            <button
              type="button"
              onClick={() => setFunnel('conversion')}
              className={`rounded-lg border-2 p-6 text-left transition-all ${
                funnel === 'conversion'
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card hover:border-primary/50'
              }`}
            >
              <div className="mb-2 text-lg font-semibold">購入・アクション</div>
              <div className="text-sm text-muted-foreground">
                コンバージョン獲得を目的とした広告
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Target Persona */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>2. ターゲットペルソナ</CardTitle>
              <CardDescription>
                獲得したいターゲット層を定義してください
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowPersonaSelectDialog(true)}
                size="sm"
                variant="outline"
              >
                <FolderOpen className="mr-2 h-4 w-4" />
                過去から選択
              </Button>
              <Button onClick={addTarget} size="sm" variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                ターゲット追加
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {targets.map((target, index) => (
            <div
              key={index}
              className="rounded-lg border border-border bg-secondary/30 p-4"
            >
              <div className="mb-4 flex items-center justify-between">
                <Badge variant="outline">
                  {target.name || `ターゲット ${index + 1}`}
                </Badge>
                {targets.length > 1 && (
                  <Button
                    onClick={() => removeTarget(index)}
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>性別</Label>
                  <Select
                    value={target.gender}
                    onValueChange={(value) => updateTarget(index, 'gender', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">男性</SelectItem>
                      <SelectItem value="female">女性</SelectItem>
                      <SelectItem value="all">すべて</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>年齢（から）</Label>
                    <Input
                      type="number"
                      placeholder="18"
                      value={target.ageFrom}
                      onChange={(e) => updateTarget(index, 'ageFrom', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>年齢（まで）</Label>
                    <Input
                      type="number"
                      placeholder="65"
                      value={target.ageTo}
                      onChange={(e) => updateTarget(index, 'ageTo', e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Label>抱えている課題</Label>
                <Textarea
                  placeholder="例: 広告運用の時間がない、クリエイティブ制作のノウハウがない"
                  value={target.issue}
                  onChange={(e) => updateTarget(index, 'issue', e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Appeal Axis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            3. 訴求軸の選択
          </CardTitle>
          <CardDescription>
            クリエイティブで伝えたい訴求ポイントを選択してください（複数選択可）
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {APPEAL_AXIS_OPTIONS.map((appeal) => (
              <button
                key={appeal.id}
                type="button"
                onClick={() => toggleAppeal(appeal.id)}
                className={`rounded-lg border-2 p-4 text-left transition-all ${
                  selectedAppeals.includes(appeal.id)
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card hover:border-primary/30'
                }`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-semibold text-sm">{appeal.label}</span>
                  {selectedAppeals.includes(appeal.id) && (
                    <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {appeal.description}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Aspect Ratio & Size Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5 text-primary" />
            4. アスペクト比・サイズ選択
          </CardTitle>
          <CardDescription>
            生成するバナーの形状と解像度を選択してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <Label>アスペクト比</Label>
              <div className="grid grid-cols-2 gap-2">
                {ASPECT_RATIO_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setAspectRatio(option.value)}
                    className={`rounded-lg border-2 p-3 text-left transition-all ${
                      aspectRatio === option.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card hover:border-primary/30'
                    }`}
                  >
                    <div className="font-medium text-sm">{option.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {option.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <Label>画像サイズ</Label>
              <div className="space-y-2">
                {IMAGE_SIZE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setImageSize(option.value)}
                    className={`w-full rounded-lg border-2 p-3 text-left transition-all ${
                      imageSize === option.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card hover:border-primary/30'
                    }`}
                  >
                    <div className="font-medium text-sm">{option.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {option.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generation Status */}
      {generationStatus !== 'idle' && (
        <Card className={generationStatus === 'error' ? 'border-destructive' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              {generationStatus === 'generating' && (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              )}
              {generationStatus === 'success' && (
                <Check className="h-5 w-5 text-green-500" />
              )}
              {generationStatus === 'error' && (
                <X className="h-5 w-5 text-destructive" />
              )}
              <div>
                <p className="font-medium">
                  {generationStatus === 'generating' && '生成中...'}
                  {generationStatus === 'success' && '生成完了'}
                  {generationStatus === 'error' && 'エラー'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {generationError || generationMessage}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Buttons */}
      <div className="flex justify-end gap-3">
        <Button
          onClick={handleGenerateBanner}
          size="lg"
          variant="default"
          disabled={!isFormValid() || generationStatus === 'generating'}
          className="gap-2"
        >
          {generationStatus === 'generating' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Image className="h-4 w-4" />
              バナーを生成
            </>
          )}
        </Button>
        <Button
          onClick={handleSubmit}
          size="lg"
          variant="outline"
          disabled={!isFormValid() || isLoading}
          className="gap-2"
        >
          {isLoading ? '処理中...' : '完了'}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Save Template Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>テンプレートとして保存</DialogTitle>
            <DialogDescription>
              現在の戦略設定をテンプレートとして保存します。名前を入力してください。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="template-name">テンプレート名</Label>
            <Input
              id="template-name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="例: 認知獲得_20-30代女性"
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowSaveDialog(false);
                setTemplateName('');
              }}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleSaveTemplate}
              disabled={!templateName.trim() || isSaving}
            >
              {isSaving ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Saved Persona Select Dialog */}
      <SavedPersonaSelectDialog
        open={showPersonaSelectDialog}
        onOpenChange={setShowPersonaSelectDialog}
        onSelect={handlePersonaSelect}
        currentProjectId={projectId}
      />
    </div>
  );
}
