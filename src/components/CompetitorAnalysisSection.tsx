'use client';

import { useState, useCallback } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Search,
  Sparkles,
  BarChart3,
  Plus,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Target,
  Lightbulb,
} from 'lucide-react';
import { AppealAxesChart } from './AppealAxesChart';

// Types for competitor analysis
interface TrendingMessage {
  message: string;
  frequency: number;
  examples?: string[];
}

interface DifferentiationOpportunity {
  axis: string;
  reason: string;
  suggestion: string;
}

interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
}

export interface CompetitorAnalysisResult {
  appealAxesDistribution: Record<string, number>;
  trendingMessages: TrendingMessage[];
  differentiationOpportunities: DifferentiationOpportunity[];
  recommendations: Recommendation[];
  totalAdsAnalyzed: number;
  analyzedAt: string;
}

interface CompetitorAnalysisSectionProps {
  projectId: string;
  productName?: string;
  productCategory?: string;
  onAnalysisComplete?: (analysis: CompetitorAnalysisResult) => void;
}

type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export function CompetitorAnalysisSection({
  projectId,
  productName,
  productCategory,
  onAnalysisComplete,
}: CompetitorAnalysisSectionProps) {
  // Keywords state
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');

  // Loading states for each operation
  const [keywordLoadingState, setKeywordLoadingState] = useState<LoadingState>('idle');
  const [searchLoadingState, setSearchLoadingState] = useState<LoadingState>('idle');
  const [analyzeLoadingState, setAnalyzeLoadingState] = useState<LoadingState>('idle');

  // Error states
  const [keywordError, setKeywordError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  // Results
  const [searchResultCount, setSearchResultCount] = useState<number | null>(null);
  const [analysisResult, setAnalysisResult] = useState<CompetitorAnalysisResult | null>(null);

  // Add keyword manually
  const handleAddKeyword = useCallback(() => {
    const trimmed = newKeyword.trim();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords((prev) => [...prev, trimmed]);
      setNewKeyword('');
    }
  }, [newKeyword, keywords]);

  // Remove keyword
  const handleRemoveKeyword = useCallback((keyword: string) => {
    setKeywords((prev) => prev.filter((k) => k !== keyword));
  }, []);

  // Handle Enter key in keyword input
  const handleKeywordKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddKeyword();
      }
    },
    [handleAddKeyword]
  );

  // Generate keywords automatically
  const handleGenerateKeywords = useCallback(async () => {
    setKeywordLoadingState('loading');
    setKeywordError(null);

    try {
      const response = await fetch('/api/meta-ads/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          productName,
          productCategory,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to generate keywords');
      }

      const generatedKeywords: string[] = result.data?.keywords || [];
      // Merge with existing, avoiding duplicates
      setKeywords((prev) => {
        const merged = [...prev];
        generatedKeywords.forEach((kw: string) => {
          if (!merged.includes(kw)) {
            merged.push(kw);
          }
        });
        return merged;
      });

      setKeywordLoadingState('success');
    } catch (error) {
      console.error('Keyword generation error:', error);
      setKeywordError(error instanceof Error ? error.message : 'キーワード生成に失敗しました');
      setKeywordLoadingState('error');
    }
  }, [projectId, productName, productCategory]);

  // Search competitor ads
  const handleSearchAds = useCallback(async () => {
    if (keywords.length === 0) {
      setSearchError('キーワードを入力してください');
      return;
    }

    setSearchLoadingState('loading');
    setSearchError(null);
    setSearchResultCount(null);

    try {
      const response = await fetch('/api/meta-ads/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          keywords,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to search ads');
      }

      setSearchResultCount(result.data?.count || 0);
      setSearchLoadingState('success');
    } catch (error) {
      console.error('Ad search error:', error);
      setSearchError(error instanceof Error ? error.message : '広告検索に失敗しました');
      setSearchLoadingState('error');
    }
  }, [projectId, keywords]);

  // Analyze competitor ads
  const handleAnalyze = useCallback(async () => {
    if (searchResultCount === null || searchResultCount === 0) {
      setAnalyzeError('先に競合広告を検索してください');
      return;
    }

    setAnalyzeLoadingState('loading');
    setAnalyzeError(null);

    try {
      const response = await fetch('/api/meta-ads/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to analyze ads');
      }

      const analysis: CompetitorAnalysisResult = result.data;
      setAnalysisResult(analysis);
      setAnalyzeLoadingState('success');

      // Callback for parent component
      onAnalysisComplete?.(analysis);
    } catch (error) {
      console.error('Ad analysis error:', error);
      setAnalyzeError(error instanceof Error ? error.message : '分析に失敗しました');
      setAnalyzeLoadingState('error');
    }
  }, [projectId, searchResultCount, onAnalysisComplete]);

  // Get priority badge variant
  const getPriorityVariant = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
    }
  };

  const getPriorityLabel = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return '高';
      case 'medium':
        return '中';
      case 'low':
        return '低';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          競合分析
        </CardTitle>
        <CardDescription>
          Meta広告ライブラリから競合の広告を検索・分析し、差別化のヒントを得ます
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Keywords Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>検索キーワード</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateKeywords}
              disabled={keywordLoadingState === 'loading'}
            >
              {keywordLoadingState === 'loading' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              キーワード自動生成
            </Button>
          </div>

          {/* Keyword input */}
          <div className="flex gap-2">
            <Input
              placeholder="キーワードを入力..."
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={handleKeywordKeyDown}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleAddKeyword}
              disabled={!newKeyword.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Keywords display */}
          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword) => (
                <Badge key={keyword} variant="secondary" className="gap-1 pr-1">
                  {keyword}
                  <button
                    type="button"
                    onClick={() => handleRemoveKeyword(keyword)}
                    className="ml-1 rounded-full p-0.5 hover:bg-secondary-foreground/20"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Keyword error */}
          {keywordError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>エラー</AlertTitle>
              <AlertDescription>{keywordError}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Search Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={handleSearchAds}
              disabled={keywords.length === 0 || searchLoadingState === 'loading'}
              className="gap-2"
            >
              {searchLoadingState === 'loading' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              競合広告を検索
            </Button>

            {searchResultCount !== null && searchLoadingState === 'success' && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>{searchResultCount}件の広告が見つかりました</span>
              </div>
            )}
          </div>

          {/* Search error */}
          {searchError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>検索エラー</AlertTitle>
              <AlertDescription>{searchError}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Analyze Section */}
        <div className="space-y-4">
          <Button
            onClick={handleAnalyze}
            disabled={
              searchResultCount === null ||
              searchResultCount === 0 ||
              analyzeLoadingState === 'loading'
            }
            variant="default"
            className="gap-2"
          >
            {analyzeLoadingState === 'loading' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <BarChart3 className="h-4 w-4" />
            )}
            分析を実行
          </Button>

          {/* Analyze error */}
          {analyzeError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>分析エラー</AlertTitle>
              <AlertDescription>{analyzeError}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Loading state for analysis */}
        {analyzeLoadingState === 'loading' && (
          <div className="space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {/* Analysis Results */}
        {analysisResult && analyzeLoadingState === 'success' && (
          <div className="space-y-6 pt-4 border-t">
            {/* Summary */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>
                {analysisResult.totalAdsAnalyzed}件の広告を分析しました
                （{new Date(analysisResult.analyzedAt).toLocaleString('ja-JP')}）
              </span>
            </div>

            {/* Appeal Axes Distribution */}
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                訴求軸の分布
              </h4>
              <div className="rounded-lg border bg-secondary/20 p-4">
                <AppealAxesChart distribution={analysisResult.appealAxesDistribution} />
              </div>
            </div>

            {/* Trending Messages */}
            {analysisResult.trendingMessages.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  トレンドメッセージ
                </h4>
                <div className="space-y-2">
                  {analysisResult.trendingMessages.map((item, index) => (
                    <div
                      key={index}
                      className="rounded-lg border bg-secondary/20 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium">{item.message}</p>
                        <Badge variant="outline" className="shrink-0">
                          {item.frequency}件
                        </Badge>
                      </div>
                      {item.examples && item.examples.length > 0 && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          例: {item.examples.slice(0, 2).join('、')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Differentiation Opportunities */}
            {analysisResult.differentiationOpportunities.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  差別化の機会
                </h4>
                <div className="space-y-2">
                  {analysisResult.differentiationOpportunities.map((item, index) => (
                    <div
                      key={index}
                      className="rounded-lg border bg-secondary/20 p-3 space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{item.axis}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.reason}</p>
                      <p className="text-sm font-medium">{item.suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {analysisResult.recommendations.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  推奨アクション
                </h4>
                <div className="space-y-2">
                  {analysisResult.recommendations.map((item, index) => (
                    <div
                      key={index}
                      className="rounded-lg border bg-secondary/20 p-3 space-y-1"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant={getPriorityVariant(item.priority)}>
                          優先度: {getPriorityLabel(item.priority)}
                        </Badge>
                        <span className="font-medium text-sm">{item.title}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
