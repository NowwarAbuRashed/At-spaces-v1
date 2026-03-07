import * as Joi from 'joi';

type NodeEnv = 'development' | 'test' | 'production';

type EnvironmentConfig = {
  NODE_ENV: NodeEnv;
  ENABLE_SWAGGER: string;
  COOKIE_SECURE: string;
  COOKIE_SAMESITE: string;
  CORS_ALLOWED_ORIGINS: string;
  HCAPTCHA_TEST_BYPASS: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  HMAC_APPROVAL_REQUESTS_KEY: string;
  HMAC_VENDOR_NOTIFICATIONS_KEY: string;
  S3_SSE_MODE: 'SSE-S3' | 'SSE-KMS';
  S3_KMS_KEY_ID: string;
  AWS_S3_SSE_MODE: 'SSE-S3' | 'SSE-KMS';
  AWS_S3_KMS_KEY_ID: string;
} & Record<string, unknown>;

const BOOLEAN_STRING = Joi.string().valid('true', 'false');

const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(3000),
  HOST: Joi.string().default('0.0.0.0'),

  DATABASE_URL: Joi.string().uri({ scheme: ['postgresql', 'postgres'] }).required(),
  REDIS_URL: Joi.string().uri({ scheme: ['redis', 'rediss'] }).required(),

  JWT_ACCESS_SECRET: Joi.string().min(8).required(),
  JWT_REFRESH_SECRET: Joi.string().min(8).required(),
  ACCESS_TOKEN_TTL_MIN: Joi.number().integer().min(1).max(60).default(15),
  REFRESH_TOKEN_TTL_DAYS: Joi.number().integer().min(1).max(30).default(14),
  ADMIN_INACTIVITY_TTL_MIN: Joi.number().integer().min(5).max(240).default(30),

  COOKIE_NAME_REFRESH: Joi.string().default('atspaces_rt'),
  COOKIE_DOMAIN: Joi.string().allow('').default(''),
  COOKIE_SECURE: BOOLEAN_STRING.required(),
  COOKIE_SAMESITE: Joi.string()
    .valid('Strict', 'Lax', 'None', 'strict', 'lax', 'none')
    .default('Strict'),

  ENABLE_SWAGGER: BOOLEAN_STRING.default('true'),
  SWAGGER_PATH: Joi.string().default('api/docs'),
  ENABLE_REQUEST_LOGGING: BOOLEAN_STRING.default('true'),
  LOG_LEVEL: Joi.string().valid('debug', 'info', 'warn', 'error').default('info'),

  CORS_ALLOWED_ORIGINS: Joi.string().allow('').default(''),
  CORS_ALLOW_CREDENTIALS: BOOLEAN_STRING.default('true'),
  TRUST_PROXY: Joi.string().allow('').default(''),

  HCAPTCHA_SECRET: Joi.string().required(),
  HCAPTCHA_SITE_KEY: Joi.string().required(),
  HCAPTCHA_TEST_BYPASS: BOOLEAN_STRING.default('false'),

  HMAC_APPROVAL_REQUESTS_KEY: Joi.string().min(8).required(),
  HMAC_VENDOR_NOTIFICATIONS_KEY: Joi.string().min(8).required(),

  AWS_REGION: Joi.string().required(),
  AWS_SES_FROM_EMAIL: Joi.string().email().required(),
  AWS_SES_SECURITY_TEAM_INBOX: Joi.string().email().required(),
  SES_FROM_EMAIL: Joi.string().email().required(),
  SES_SECURITY_TEAM_INBOX: Joi.string().email().required(),

  AWS_S3_BUCKET_PRIVATE_REPORTS: Joi.string().required(),
  AWS_S3_PRESIGN_EXP_SECONDS: Joi.number().integer().min(1).max(300).default(300),
  AWS_S3_SSE_MODE: Joi.string().valid('SSE-S3', 'SSE-KMS').default('SSE-S3'),
  AWS_S3_KMS_KEY_ID: Joi.string().allow('').default(''),

  S3_BUCKET_PRIVATE_REPORTS: Joi.string().required(),
  S3_PRESIGN_EXP_SECONDS: Joi.number().integer().min(1).max(300).default(300),
  S3_SSE_MODE: Joi.string().valid('SSE-S3', 'SSE-KMS').default('SSE-S3'),
  S3_KMS_KEY_ID: Joi.string().allow('').default(''),

  REPORT_EXPORT_MOCK: BOOLEAN_STRING.default('false'),
  UPLOAD_PUBLIC_BASE_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .default('https://uploads.local'),
  UPLOADS_S3_BUCKET: Joi.string().allow('').optional(),

  ADMIN_SEED_FULL_NAME: Joi.string().allow('').optional(),
  ADMIN_SEED_EMAIL: Joi.string().allow('').optional(),
  ADMIN_SEED_PASSWORD: Joi.string().allow('').optional(),
  ADMIN_SEED_TOTP_SECRET: Joi.string().allow('').optional(),
});

function getConfigErrorMessage(error: Joi.ValidationError): string {
  return error.details.map((detail) => detail.message).join('; ');
}

function assertProductionConfig(config: EnvironmentConfig): void {
  const longSecretKeys = [
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'HMAC_APPROVAL_REQUESTS_KEY',
    'HMAC_VENDOR_NOTIFICATIONS_KEY',
  ] as const;

  for (const key of longSecretKeys) {
    const value = config[key];
    if (typeof value !== 'string' || value.length < 32) {
      throw new Error(`${key} must be at least 32 characters in production`);
    }
  }

  if (config.COOKIE_SECURE.toLowerCase() !== 'true') {
    throw new Error('COOKIE_SECURE must be true in production');
  }

  if (config.COOKIE_SAMESITE.toLowerCase() !== 'strict') {
    throw new Error('COOKIE_SAMESITE must be Strict in production');
  }

  if (config.HCAPTCHA_TEST_BYPASS.toLowerCase() === 'true') {
    throw new Error('HCAPTCHA_TEST_BYPASS must be false in production');
  }

  const corsOrigins = config.CORS_ALLOWED_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
  if (corsOrigins.length === 0) {
    throw new Error('CORS_ALLOWED_ORIGINS must include at least one origin in production');
  }

  if (config.S3_SSE_MODE === 'SSE-KMS' && config.S3_KMS_KEY_ID.trim().length === 0) {
    throw new Error('S3_KMS_KEY_ID is required when S3_SSE_MODE is SSE-KMS');
  }

  if (
    config.AWS_S3_SSE_MODE === 'SSE-KMS' &&
    config.AWS_S3_KMS_KEY_ID.trim().length === 0
  ) {
    throw new Error('AWS_S3_KMS_KEY_ID is required when AWS_S3_SSE_MODE is SSE-KMS');
  }
}

export function validateEnvironment(
  rawConfig: Record<string, unknown>,
): Record<string, unknown> {
  const { error, value } = validationSchema.validate(rawConfig, {
    abortEarly: false,
    allowUnknown: true,
  });

  if (error) {
    throw new Error(`Environment validation failed: ${getConfigErrorMessage(error)}`);
  }

  const validatedConfig = value as EnvironmentConfig;
  if (!Object.prototype.hasOwnProperty.call(rawConfig, 'ENABLE_SWAGGER')) {
    validatedConfig.ENABLE_SWAGGER =
      validatedConfig.NODE_ENV === 'production' ? 'false' : 'true';
  }

  if (validatedConfig.NODE_ENV === 'production') {
    assertProductionConfig(validatedConfig);
  }

  return validatedConfig;
}
