const DEFAULT_API_BASE_URL = 'http://localhost:3000/api'

export const appEnv = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL,
  hcaptchaToken: import.meta.env.VITE_HCAPTCHA_TEST_TOKEN ?? '',
  defaultMfaCode: import.meta.env.VITE_ADMIN_MFA_CODE ?? '',
}
