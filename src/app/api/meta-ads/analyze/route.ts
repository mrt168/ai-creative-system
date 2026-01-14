import { NextRequest, NextResponse } from 'next/server';
import { CompetitorRepository } from '@/lib/supabase/repositories';
import { getGeminiClient } from '@/lib/gemini';
import {
  buildCompetitorAnalysisPrompt,
  parseCompetitorAnalysisResponse,
  CompetitorAnalysisResponse,
} from '@/lib/utils/competitor-prompts';
import { ApiResponse } from '@/types/api';
import { APPEAL_AXES } from '@/constants/appeal-axes';

interface AnalyzeRequestBody {
  projectId: string;
  searchTerm?: string;
}

// UIが期待するレスポンス形式
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

interface UICompatibleAnalysisResponse {
  appealAxesDistribution: Record<string, number>;
  trendingMessages: TrendingMessage[];
  differentiationOpportunities: DifferentiationOpportunity[];
  recommendations: Recommendation[];
  totalAdsAnalyzed: number;
  analyzedAt: string;
}

/**
 * GeminiレスポンスをUI互換形式に変換
 */
function transformToUIFormat(
  geminiResult: CompetitorAnalysisResponse,
  adCount: number
): UICompatibleAnalysisResponse {
  // trendingMessages: string[] -> TrendingMessage[]
  const trendingMessages: TrendingMessage[] = geminiResult.trendingMessages.map(
    (msg, index) => ({
      message: msg,
      frequency: Math.max(1, Math.floor(adCount * (0.5 - index * 0.1))), // 推定頻度
      examples: undefined, // Geminiからは例が返らない
    })
  );

  // differentiationOpportunities: string[] -> DifferentiationOpportunity[]
  const differentiationOpportunities: DifferentiationOpportunity[] =
    geminiResult.differentiationOpportunities.map((opportunity) => {
      // 訴求軸キーワードを探す
      const axisEntries = Object.entries(APPEAL_AXES);
      const foundAxis = axisEntries.find(
        ([, config]) =>
          opportunity.includes(config.label) ||
          opportunity.toLowerCase().includes(config.label.toLowerCase())
      );

      return {
        axis: foundAxis ? foundAxis[1].label : '未分類',
        reason: '競合が手薄にしている領域',
        suggestion: opportunity,
      };
    });

  // recommendations: string[] -> Recommendation[]
  const recommendations: Recommendation[] = geminiResult.recommendations.map(
    (rec, index) => ({
      priority: index === 0 ? 'high' : index === 1 ? 'medium' : 'low',
      title: rec.length > 30 ? rec.substring(0, 30) + '...' : rec,
      description: rec,
    })
  );

  // AppealAxesDistribution を Record<string, number> に変換
  const appealAxesDistribution: Record<string, number> = {
    spec: geminiResult.appealAxesDistribution.spec,
    quality: geminiResult.appealAxesDistribution.quality,
    benefit: geminiResult.appealAxesDistribution.benefit,
    emotion: geminiResult.appealAxesDistribution.emotion,
    social: geminiResult.appealAxesDistribution.social,
    urgency: geminiResult.appealAxesDistribution.urgency,
    price: geminiResult.appealAxesDistribution.price,
    ease: geminiResult.appealAxesDistribution.ease,
    authority: geminiResult.appealAxesDistribution.authority,
  };

  return {
    appealAxesDistribution,
    trendingMessages,
    differentiationOpportunities,
    recommendations,
    totalAdsAnalyzed: adCount,
    analyzedAt: new Date().toISOString(),
  };
}

// POST /api/meta-ads/analyze - Analyze collected competitor ads
export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequestBody = await request.json();

    // Validate required fields
    if (!body.projectId) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'projectId is required',
        },
        { status: 400 }
      );
    }

    const competitorRepo = new CompetitorRepository();

    // Get competitor ads - either by search term or all for project
    const ads = body.searchTerm
      ? await competitorRepo.findAdsBySearchTerm(body.projectId, body.searchTerm)
      : await competitorRepo.findAdsByProjectId(body.projectId);

    if (ads.length === 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: body.searchTerm
            ? `No competitor ads found for search term: ${body.searchTerm}`
            : 'No competitor ads found for this project. Run a search first.',
        },
        { status: 404 }
      );
    }

    // Extract ad_creative_body texts for analysis
    const adTexts: string[] = ads
      .map((ad) => ad.adCreativeBody || ad.ad_creative_body)
      .filter((text): text is string => !!text && text.trim().length > 0);

    if (adTexts.length === 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'No ad creative texts found in the collected ads',
        },
        { status: 400 }
      );
    }

    // Limit to reasonable number for analysis (avoid token limits)
    const maxAdsForAnalysis = 50;
    const textsForAnalysis = adTexts.slice(0, maxAdsForAnalysis);

    // Use Gemini to analyze the ads
    let analysisResult: CompetitorAnalysisResponse;
    try {
      const geminiClient = getGeminiClient();
      const prompt = buildCompetitorAnalysisPrompt(textsForAnalysis);
      const response = await geminiClient.generateText(prompt);
      const parsed = parseCompetitorAnalysisResponse(response);

      if (!parsed) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: 'Failed to parse analysis response from AI',
          },
          { status: 500 }
        );
      }

      analysisResult = parsed;
    } catch (geminiError) {
      console.error('Gemini API error:', geminiError);
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Failed to analyze ads using AI',
        },
        { status: 502 }
      );
    }

    // GeminiレスポンスをUI互換形式に変換
    const uiResponse = transformToUIFormat(analysisResult, textsForAnalysis.length);

    // Save analysis result to database
    const searchTerm = body.searchTerm ?? 'all';
    try {
      await competitorRepo.createAnalysis({
        projectId: body.projectId,
        searchTerm: searchTerm,
        adCount: textsForAnalysis.length,
        analysisSummary: {
          trendingMessages: uiResponse.trendingMessages,
          differentiationOpportunities: uiResponse.differentiationOpportunities,
          recommendations: uiResponse.recommendations,
        },
        appealAxesDistribution: uiResponse.appealAxesDistribution,
      });
    } catch (dbError) {
      // Log but don't fail - return the analysis even if save fails
      console.error('Failed to save analysis to database:', dbError);
    }

    return NextResponse.json<ApiResponse<UICompatibleAnalysisResponse>>({
      success: true,
      data: uiResponse,
    });
  } catch (error) {
    console.error('Error in meta-ads analyze:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to analyze competitor ads',
      },
      { status: 500 }
    );
  }
}
