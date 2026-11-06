/**
 * Uabindia HRMS Enterprise - Single Source of Truth (SSOT) Version System
 * Follows Big Tech standard automated Semantic Versioning (SemVer).
 * 
 * Injected automatically by Vite from package.json and Git metadata.
 * Never hardcode version strings in UI components!
 */

/* global __APP_VERSION__, __GIT_COMMIT_HASH__, __APP_BUILD_TIME__ */

export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0'
export const GIT_COMMIT_HASH = typeof __GIT_COMMIT_HASH__ !== 'undefined' ? __GIT_COMMIT_HASH__ : 'dev'
export const BUILD_TIME = typeof __APP_BUILD_TIME__ !== 'undefined' ? __APP_BUILD_TIME__ : new Date().toISOString()

// Clean enterprise presentation formats
export const APP_RELEASE_LABEL = `v${APP_VERSION}`
export const APP_BUILD_FULL = `v${APP_VERSION} (${GIT_COMMIT_HASH})`
export const APP_FULL_NAME = `Uabindia HRMS Enterprise`

export const APP_METADATA = {
  name: APP_FULL_NAME,
  version: APP_VERSION,
  release: APP_RELEASE_LABEL,
  commit: GIT_COMMIT_HASH,
  buildTime: BUILD_TIME,
  edition: 'Enterprise Edition'
}

export default APP_METADATA

