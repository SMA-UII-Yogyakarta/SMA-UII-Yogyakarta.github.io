// @ts-check
/**
 * Environment validation for Astro/Vite
 * Validates required environment variables at build time
 */

/** @type {Record<string, { required: boolean; secret?: boolean; example?: string }>} */
export const requiredEnvVars = {
  // Public variables (client-side safe)
  PUBLIC_SITE_URL: { required: true, secret: false, example: 'https://lab.smauiiyk.sch.id' },
  PUBLIC_API_URL: { required: true, secret: false, example: 'https://smauii-dev-api.konxcid.workers.dev' },
  
  // Secret variables (server-side only)
  TURSO_URL: { required: true, secret: true, example: 'libsql://your-db.turso.io' },
  TURSO_TOKEN: { required: true, secret: true, example: 'your_turso_token' },
  JWT_SECRET: { required: true, secret: true, example: 'min_32_chars_secret' },
  OAUTH_GITHUB_CLIENT_ID: { required: true, secret: true, example: 'Ov23...' },
  OAUTH_GITHUB_CLIENT_SECRET: { required: true, secret: true, example: 'your_secret' },
  
  // Optional variables
  SLIMS_API_URL: { required: false, secret: true, example: 'https://slims.example.edu' },
  SLIMS_API_KEY: { required: false, secret: true, example: 'your_key' },
  GITHUB_PAT: { required: false, secret: true, example: 'ghp_...' },
};

/**
 * Validate environment variables
 * @param {Record<string, string | undefined>} env
 * @param {'development' | 'production'} mode
 */
export function validateEnv(env, mode = 'development') {
  const missing = [];
  const errors = [];
  
  for (const [key, config] of Object.entries(requiredEnvVars)) {
    const value = env[key];
    
    if (config.required && !value) {
      missing.push(key);
      continue;
    }
    
    // Validate URL format for public vars
    if (key.startsWith('PUBLIC_') && value) {
      try {
        new URL(value);
      } catch {
        errors.push(`${key} must be a valid URL, got: ${value}`);
      }
    }
    
    // Validate JWT_SECRET length
    if (key === 'JWT_SECRET' && value && value.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters');
    }
  }
  
  if (missing.length > 0) {
    console.error('\n❌ Missing required environment variables:');
    missing.forEach(key => {
      const config = requiredEnvVars[key];
      console.error(`  - ${key}${config.example ? ` (example: ${config.example})` : ''}`);
    });
    console.error('\n📝 Copy .env.example to .env.local and fill in the values.\n');
    
    if (mode === 'production') {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
  
  if (errors.length > 0) {
    console.error('\n❌ Environment variable validation errors:');
    errors.forEach(err => {
      console.error(`  - ${err}`);
    });
    console.error('\n');
    
    if (mode === 'production') {
      throw new Error(`Environment validation failed: ${errors.join(', ')}`);
    }
  }
  
  return missing.length === 0 && errors.length === 0;
}

/**
 * Get environment variable with validation
 * @param {string} key
 * @param {string?} defaultValue
 * @returns {string}
 */
export function getEnv(key, defaultValue = null) {
  const value = import.meta.env[key] || process.env[key] || defaultValue;
  
  if (!value && requiredEnvVars[key]?.required) {
    console.warn(`Warning: ${key} is not set`);
  }
  
  return value || '';
}