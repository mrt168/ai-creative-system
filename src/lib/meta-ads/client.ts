/**
 * Meta Ads Library API Client
 *
 * This client provides access to the Facebook Ads Library API for searching
 * and retrieving ad creatives from Meta's advertising platforms.
 *
 * @see https://www.facebook.com/ads/library/api/
 */

// =============================================================================
// Types
// =============================================================================

/**
 * Represents a single ad from the Meta Ads Library
 */
export interface MetaAd {
  id: string;
  page_name: string;
  page_id: string;
  ad_creative_bodies?: string[];
  ad_snapshot_url: string;
  publisher_platforms?: string[];
  ad_delivery_start_date?: string;
  media_type?: string;
}

/**
 * Response structure from Meta Ads Library API search endpoint
 */
export interface MetaAdsSearchResponse {
  data: MetaAd[];
  paging?: {
    cursors?: {
      before?: string;
      after?: string;
    };
    next?: string;
  };
}

/**
 * Allowed ad types for search
 */
export type AdType = 'ALL' | 'POLITICAL_AND_ISSUE_ADS' | 'HOUSING' | 'EMPLOYMENT' | 'CREDIT';

/**
 * Allowed ad active status for filtering
 */
export type AdActiveStatus = 'ALL' | 'ACTIVE' | 'INACTIVE';

/**
 * Allowed media types for filtering
 */
export type MediaType = 'ALL' | 'IMAGE' | 'VIDEO' | 'MEME' | 'NONE';

/**
 * Search parameters for the Ads Library API
 */
export interface MetaAdsSearchParams {
  /** Keywords to search for in ads */
  searchTerms: string;
  /** Country codes where ads were shown (e.g., 'JP', 'US') */
  adReachedCountries: string | string[];
  /** Type of ads to search for */
  adType?: AdType;
  /** Filter by active/inactive status */
  adActiveStatus?: AdActiveStatus;
  /** Filter by media type */
  mediaType?: MediaType;
  /** Number of results per page (max 100) */
  limit?: number;
  /** Pagination cursor for next page */
  after?: string;
}

/**
 * Configuration options for MetaAdsClient
 */
export interface MetaAdsClientConfig {
  /** Meta API access token */
  accessToken: string;
  /** API version (default: v18.0) */
  apiVersion?: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
}

/**
 * Error response from Meta API
 */
interface MetaApiError {
  error: {
    message: string;
    type: string;
    code: number;
    fbtrace_id?: string;
  };
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_API_VERSION = 'v18.0';
const DEFAULT_TIMEOUT = 30000;
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;
const BASE_URL = 'https://graph.facebook.com';

/** Fields to request from the API */
const DEFAULT_FIELDS = [
  'id',
  'page_name',
  'page_id',
  'ad_creative_bodies',
  'ad_snapshot_url',
  'publisher_platforms',
  'ad_delivery_start_date',
  'media_type',
].join(',');

// =============================================================================
// MetaAdsClient Class
// =============================================================================

/**
 * Client for interacting with the Meta Ads Library API
 *
 * @example
 * ```typescript
 * const client = new MetaAdsClient({ accessToken: 'your-token' });
 *
 * // Search for ads
 * const response = await client.searchAds({
 *   searchTerms: 'nike',
 *   adReachedCountries: 'JP',
 *   limit: 50,
 * });
 *
 * console.log(response.data); // Array of MetaAd objects
 *
 * // Iterate through all pages
 * for await (const ad of client.searchAdsIterator({ searchTerms: 'nike', adReachedCountries: 'JP' })) {
 *   console.log(ad.page_name, ad.ad_snapshot_url);
 * }
 * ```
 */
export class MetaAdsClient {
  private readonly accessToken: string;
  private readonly apiVersion: string;
  private readonly timeout: number;
  private readonly baseEndpoint: string;

  constructor(config: MetaAdsClientConfig) {
    if (!config.accessToken) {
      throw new Error('MetaAdsClient: accessToken is required');
    }

    this.accessToken = config.accessToken;
    this.apiVersion = config.apiVersion ?? DEFAULT_API_VERSION;
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
    this.baseEndpoint = `${BASE_URL}/${this.apiVersion}/ads_archive`;
  }

  /**
   * Search for ads in the Meta Ads Library
   *
   * @param params - Search parameters
   * @returns Promise resolving to search response with ads and pagination info
   * @throws Error if the API request fails
   */
  async searchAds(params: MetaAdsSearchParams): Promise<MetaAdsSearchResponse> {
    const url = this.buildSearchUrl(params);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        const errorData = data as MetaApiError;
        throw new MetaAdsApiError(
          errorData.error?.message ?? 'Unknown API error',
          errorData.error?.code ?? response.status,
          errorData.error?.type,
          errorData.error?.fbtrace_id
        );
      }

      return data as MetaAdsSearchResponse;
    } catch (error) {
      if (error instanceof MetaAdsApiError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new MetaAdsApiError('Request timeout', 408, 'TimeoutError');
        }
        throw new MetaAdsApiError(error.message, 500, 'NetworkError');
      }

      throw new MetaAdsApiError('Unknown error occurred', 500, 'UnknownError');
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Fetch the next page of results using the paging.next URL
   *
   * @param nextUrl - The full URL from paging.next
   * @returns Promise resolving to the next page of results
   */
  async fetchNextPage(nextUrl: string): Promise<MetaAdsSearchResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(nextUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        const errorData = data as MetaApiError;
        throw new MetaAdsApiError(
          errorData.error?.message ?? 'Unknown API error',
          errorData.error?.code ?? response.status,
          errorData.error?.type,
          errorData.error?.fbtrace_id
        );
      }

      return data as MetaAdsSearchResponse;
    } catch (error) {
      if (error instanceof MetaAdsApiError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new MetaAdsApiError('Request timeout', 408, 'TimeoutError');
        }
        throw new MetaAdsApiError(error.message, 500, 'NetworkError');
      }

      throw new MetaAdsApiError('Unknown error occurred', 500, 'UnknownError');
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Async iterator for paginating through all search results
   *
   * @param params - Search parameters
   * @param maxPages - Maximum number of pages to fetch (default: Infinity)
   * @yields MetaAd objects one at a time
   *
   * @example
   * ```typescript
   * const ads: MetaAd[] = [];
   * for await (const ad of client.searchAdsIterator({ searchTerms: 'keyword', adReachedCountries: 'JP' }, 5)) {
   *   ads.push(ad);
   * }
   * ```
   */
  async *searchAdsIterator(
    params: MetaAdsSearchParams,
    maxPages: number = Infinity
  ): AsyncGenerator<MetaAd, void, unknown> {
    let pageCount = 0;
    let response = await this.searchAds(params);

    while (pageCount < maxPages) {
      pageCount++;

      for (const ad of response.data) {
        yield ad;
      }

      if (!response.paging?.next) {
        break;
      }

      response = await this.fetchNextPage(response.paging.next);
    }
  }

  /**
   * Fetch all ads matching the search criteria (handles pagination automatically)
   *
   * @param params - Search parameters
   * @param maxPages - Maximum number of pages to fetch (default: 10)
   * @returns Promise resolving to array of all fetched ads
   *
   * @example
   * ```typescript
   * const allAds = await client.searchAllAds({ searchTerms: 'keyword', adReachedCountries: 'JP' }, 5);
   * console.log(`Found ${allAds.length} ads`);
   * ```
   */
  async searchAllAds(
    params: MetaAdsSearchParams,
    maxPages: number = 10
  ): Promise<MetaAd[]> {
    const ads: MetaAd[] = [];

    for await (const ad of this.searchAdsIterator(params, maxPages)) {
      ads.push(ad);
    }

    return ads;
  }

  /**
   * Build the search URL with query parameters
   */
  private buildSearchUrl(params: MetaAdsSearchParams): URL {
    const url = new URL(this.baseEndpoint);

    // Required parameters
    url.searchParams.set('access_token', this.accessToken);
    url.searchParams.set('search_terms', params.searchTerms);

    // Handle country codes (can be single string or array)
    const countries = Array.isArray(params.adReachedCountries)
      ? params.adReachedCountries.join(',')
      : params.adReachedCountries;
    url.searchParams.set('ad_reached_countries', countries);

    // Optional parameters with defaults
    url.searchParams.set('ad_type', params.adType ?? 'ALL');
    url.searchParams.set('ad_active_status', params.adActiveStatus ?? 'ACTIVE');
    url.searchParams.set('media_type', params.mediaType ?? 'ALL');

    // Limit with bounds checking
    const limit = Math.min(Math.max(1, params.limit ?? DEFAULT_LIMIT), MAX_LIMIT);
    url.searchParams.set('limit', limit.toString());

    // Fields to retrieve
    url.searchParams.set('fields', DEFAULT_FIELDS);

    // Pagination cursor
    if (params.after) {
      url.searchParams.set('after', params.after);
    }

    return url;
  }
}

// =============================================================================
// Custom Error Class
// =============================================================================

/**
 * Custom error class for Meta Ads API errors
 */
export class MetaAdsApiError extends Error {
  readonly code: number;
  readonly type?: string;
  readonly fbTraceId?: string;

  constructor(message: string, code: number, type?: string, fbTraceId?: string) {
    super(message);
    this.name = 'MetaAdsApiError';
    this.code = code;
    this.type = type;
    this.fbTraceId = fbTraceId;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MetaAdsApiError);
    }
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let clientInstance: MetaAdsClient | null = null;

/**
 * Get or create a singleton instance of MetaAdsClient
 *
 * Uses META_ADS_ACCESS_TOKEN environment variable for authentication.
 *
 * @returns MetaAdsClient singleton instance
 * @throws Error if META_ADS_ACCESS_TOKEN is not set
 *
 * @example
 * ```typescript
 * import { getMetaAdsClient } from '@/lib/meta-ads';
 *
 * const client = getMetaAdsClient();
 * const response = await client.searchAds({
 *   searchTerms: 'fashion',
 *   adReachedCountries: 'JP',
 * });
 * ```
 */
export function getMetaAdsClient(): MetaAdsClient {
  if (!clientInstance) {
    const accessToken = process.env.META_ADS_ACCESS_TOKEN;

    if (!accessToken) {
      throw new Error(
        'META_ADS_ACCESS_TOKEN environment variable is not set. ' +
        'Please set it with a valid Meta API access token.'
      );
    }

    clientInstance = new MetaAdsClient({ accessToken });
  }

  return clientInstance;
}

/**
 * Reset the singleton instance (useful for testing)
 */
export function resetMetaAdsClient(): void {
  clientInstance = null;
}
