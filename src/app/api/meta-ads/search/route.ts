import { NextRequest, NextResponse } from 'next/server';
import { getMetaAdsClient, MetaAd, MetaAdsApiError } from '@/lib/meta-ads';
import { ProjectRepository, CompetitorRepository } from '@/lib/supabase/repositories';
import { getGeminiClient } from '@/lib/gemini';
import {
  buildSearchKeywordsPrompt,
  parseSearchKeywordsResponse,
  ProductInfo,
} from '@/lib/utils/competitor-prompts';
import { ApiResponse } from '@/types/api';

interface SearchRequestBody {
  projectId: string;
  searchTerms?: string[];
  keywords?: string[]; // UIから送られるフィールド名にも対応
  countryCode?: string;
  limit?: number;
}

interface SearchResponseData {
  ads: MetaAd[];
  keywords: string[];
  count: number; // UIが参照するフィールド
}

// POST /api/meta-ads/search - Search competitor ads from Meta Ads Library
export async function POST(request: NextRequest) {
  try {
    const body: SearchRequestBody = await request.json();

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

    const countryCode = body.countryCode ?? 'JP';
    const limit = body.limit ?? 50;

    // Get project info
    const projectRepo = new ProjectRepository();
    const project = await projectRepo.findById(body.projectId);

    if (!project) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Project not found',
        },
        { status: 404 }
      );
    }

    // Determine search terms (UIは keywords、APIは searchTerms の両方を受け付ける)
    let keywords: string[] = body.searchTerms ?? body.keywords ?? [];

    // If no search terms provided, generate from product info using Gemini
    if (keywords.length === 0) {
      // Check if project has product info
      if (!project.productName || !project.productCategory) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error:
              'Either searchTerms must be provided, or project must have productName and productCategory set',
          },
          { status: 400 }
        );
      }

      // Get target info features if available
      const targetInfo = project.targetInfo as Record<string, unknown> | null;
      const features: string[] = Array.isArray(targetInfo?.features)
        ? (targetInfo.features as string[])
        : [];

      const productInfo: ProductInfo = {
        productName: project.productName,
        productCategory: project.productCategory,
        features: features,
      };

      try {
        const geminiClient = getGeminiClient();
        const prompt = buildSearchKeywordsPrompt(productInfo);
        const response = await geminiClient.generateText(prompt);
        const parsed = parseSearchKeywordsResponse(response);

        if (!parsed || !parsed.keywords || parsed.keywords.length === 0) {
          return NextResponse.json<ApiResponse>(
            {
              success: false,
              error: 'Failed to generate search keywords from product info',
            },
            { status: 500 }
          );
        }

        keywords = parsed.keywords;
      } catch (geminiError) {
        console.error('Gemini API error:', geminiError);
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: 'Failed to generate search keywords using AI',
          },
          { status: 502 }
        );
      }
    }

    // Search for ads using Meta Ads API
    const metaAdsClient = getMetaAdsClient();
    const competitorRepo = new CompetitorRepository();
    const allAds: MetaAd[] = [];
    const seenAdIds = new Set<string>();

    // Search for each keyword
    for (const keyword of keywords) {
      try {
        const response = await metaAdsClient.searchAds({
          searchTerms: keyword,
          adReachedCountries: countryCode,
          limit: Math.min(limit, 100), // Meta API max is 100 per request
          adActiveStatus: 'ACTIVE',
        });

        // Process and save each ad
        for (const ad of response.data) {
          // Skip duplicates
          if (seenAdIds.has(ad.id)) {
            continue;
          }
          seenAdIds.add(ad.id);
          allAds.push(ad);

          // Save to database using upsert to handle duplicates
          try {
            await competitorRepo.upsertAd({
              projectId: body.projectId,
              metaAdId: ad.id,
              pageName: ad.page_name,
              pageId: ad.page_id,
              adCreativeBody: ad.ad_creative_bodies?.[0] ?? undefined,
              adSnapshotUrl: ad.ad_snapshot_url,
              mediaType: ad.media_type ?? undefined,
              publisherPlatforms: ad.publisher_platforms ?? [],
              adDeliveryStartDate: ad.ad_delivery_start_date ?? undefined,
              searchTerm: keyword,
              countryCode: countryCode,
            });
          } catch (dbError) {
            // Log but continue - don't fail the entire operation for one ad
            console.error(`Failed to save ad ${ad.id}:`, dbError);
          }
        }
      } catch (searchError) {
        // Log the error but continue with other keywords
        if (searchError instanceof MetaAdsApiError) {
          console.error(
            `Meta Ads API error for keyword "${keyword}":`,
            searchError.message
          );
        } else {
          console.error(`Error searching for keyword "${keyword}":`, searchError);
        }
      }
    }

    const responseData: SearchResponseData = {
      ads: allAds,
      keywords: keywords,
      count: allAds.length, // UIが参照するcountフィールドを追加
    };

    return NextResponse.json<ApiResponse<SearchResponseData>>({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error('Error in meta-ads search:', error);

    if (error instanceof MetaAdsApiError) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: `Meta Ads API Error: ${error.message}`,
        },
        { status: error.code >= 400 && error.code < 600 ? error.code : 502 }
      );
    }

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to search competitor ads',
      },
      { status: 500 }
    );
  }
}
