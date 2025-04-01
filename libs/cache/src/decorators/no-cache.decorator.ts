import { SetMetadata } from '@nestjs/common';

export const NO_CACHE_METADATA = 'no_cache';

/**
 * Decorator để vô hiệu hóa cache cho một route
 */
export const NoCache = () => SetMetadata(NO_CACHE_METADATA, true);
