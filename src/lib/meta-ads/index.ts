/**
 * Meta Ads Library API Client
 *
 * Provides access to Facebook/Meta Ads Library for searching and analyzing
 * advertising creatives across Meta platforms.
 *
 * @module lib/meta-ads
 *
 * @example
 * ```typescript
 * import { getMetaAdsClient, MetaAd, MetaAdsSearchParams } from '@/lib/meta-ads';
 *
 * const client = getMetaAdsClient();
 *
 * // Basic search
 * const response = await client.searchAds({
 *   searchTerms: 'sneakers',
 *   adReachedCountries: 'JP',
 *   limit: 50,
 * });
 *
 * // Process results
 * for (const ad of response.data) {
 *   console.log(`${ad.page_name}: ${ad.ad_snapshot_url}`);
 * }
 *
 * // Paginate through all results
 * const allAds = await client.searchAllAds({
 *   searchTerms: 'fashion',
 *   adReachedCountries: ['JP', 'US'],
 *   adActiveStatus: 'ACTIVE',
 * }, 5); // max 5 pages
 * ```
 */

// Client and singleton getter
export {
  MetaAdsClient,
  getMetaAdsClient,
  resetMetaAdsClient,
  MetaAdsApiError,
} from './client';

// Types
export type {
  MetaAd,
  MetaAdsSearchResponse,
  MetaAdsSearchParams,
  MetaAdsClientConfig,
  AdType,
  AdActiveStatus,
  MediaType,
} from './client';
