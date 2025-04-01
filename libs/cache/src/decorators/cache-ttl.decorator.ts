import { SetMetadata } from '@nestjs/common';

export const CACHE_TTL_METADATA = 'cache_ttl';

/**
 * Decorator để đặt TTL (Time To Live) cho cache
 */
export const CacheTTL = (ttl: number) => SetMetadata(CACHE_TTL_METADATA, ttl);
