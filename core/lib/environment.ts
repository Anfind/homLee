/**
 * 🌐 Cloud Environment Detection
 * Safely detect if running in cloud vs local environment
 */

// Check if running in cloud environment (Vercel, Railway, etc.)
export const isCloudEnvironment = () => {
  // Vercel environment
  if (process.env.VERCEL) return true
  
  // Railway environment  
  if (process.env.RAILWAY_ENVIRONMENT) return true
  
  // Generic cloud indicators
  if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_BACKEND_URL) return true
  
  return false
}

// Check if ZKTeco backend is available
export const isZKBackendAvailable = () => {
  return !!process.env.NEXT_PUBLIC_BACKEND_URL && !isCloudEnvironment()
}

// Get backend URL with fallback
export const getBackendUrl = () => {
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'
}

// Environment info for debugging
export const getEnvironmentInfo = () => {
  return {
    isCloud: isCloudEnvironment(),
    hasZKBackend: isZKBackendAvailable(),
    backendUrl: getBackendUrl(),
    nodeEnv: process.env.NODE_ENV,
    platform: process.env.VERCEL ? 'vercel' : 
              process.env.RAILWAY_ENVIRONMENT ? 'railway' : 'local'
  }
}
