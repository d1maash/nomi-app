export interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
  tokenType?: string;
  providerToken?: string;
  type?: string;
}

type RawParams = Record<string, string>;

const parseKeyValueString = (value?: string | null): RawParams => {
  if (!value) return {};

  return value
    .split('&')
    .filter(Boolean)
    .reduce<RawParams>((acc, part) => {
      const [rawKey, rawValue = ''] = part.split('=');
      if (!rawKey) return acc;

      const key = decodeURIComponent(rawKey);
      const decodedValue = decodeURIComponent(rawValue);
      acc[key] = decodedValue;
      return acc;
    }, {});
};

const buildTokens = (params: RawParams): OAuthTokens | null => {
  const accessToken = params['access_token'];
  const refreshToken = params['refresh_token'];

  if (!accessToken || !refreshToken) {
    return null;
  }

  return {
    accessToken,
    refreshToken,
    expiresIn: params['expires_in'] ? Number(params['expires_in']) : undefined,
    tokenType: params['token_type'],
    providerToken: params['provider_token'],
    type: params['type'],
  };
};

/**
 * Извлекает токены OAuth из URL (используется для deep linking)
 */
export const extractOAuthTokensFromUrl = (url?: string | null): OAuthTokens | null => {
  if (!url) return null;

  const queryIndex = url.indexOf('?');
  const hashIndex = url.indexOf('#');

  const queryString =
    queryIndex >= 0
      ? url.substring(queryIndex + 1, hashIndex >= 0 ? hashIndex : undefined)
      : '';

  const hashString = hashIndex >= 0 ? url.substring(hashIndex + 1) : '';

  const params: RawParams = {
    ...parseKeyValueString(queryString),
    ...parseKeyValueString(hashString),
  };

  return buildTokens(params);
};

/**
 * Извлекает токены OAuth из объекта параметров роутера
 */
export const extractOAuthTokensFromParams = (
  params: Record<string, string | string[] | undefined>
): OAuthTokens | null => {
  const normalizedEntries = Object.entries(params).reduce<RawParams>((acc, [key, value]) => {
    if (Array.isArray(value)) {
      if (value[0]) acc[key] = value[0];
    } else if (typeof value === 'string' && value.length > 0) {
      acc[key] = value;
    }
    return acc;
  }, {});

  return buildTokens(normalizedEntries);
};
