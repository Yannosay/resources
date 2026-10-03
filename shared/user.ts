export const USER_ROLES = ['admin', 'member'] as const
export type UserRole = (typeof USER_ROLES)[number]

export const USERNAME_MIN_LENGTH = 3
export const USERNAME_MAX_LENGTH = 24
export const USERNAME_PATTERN = /^[a-z0-9][a-z0-9_-]{1,22}[a-z0-9]$/

export const DISPLAY_NAME_MIN_LENGTH = 1
export const DISPLAY_NAME_MAX_LENGTH = 40
export const BIO_MAX_LENGTH = 500

export const LINK_MAX_COUNT = 5
export const LINK_LABEL_MAX_LENGTH = 30
export const LINK_URL_MAX_LENGTH = 500

export const PASSWORD_MIN_LENGTH = 12
export const PASSWORD_MAX_LENGTH = 512

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024
export const BANNER_MAX_BYTES = 5 * 1024 * 1024

export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif'
])

export const RESERVED_USERNAMES = new Set([
  'admin', 'root', 'system', 'yannosay', 'api', 'www',
  'help', 'support', 'login', 'signup', 'logout',
  'settings', 'browse', 'resource', 'resources',
  'about', 'contact', 'legal', 'me', 'new', 'edit', 'u',
  'team', 'staff', 'moderator', 'mod', 'owner', 'founder',
  'official', 'mail', 'email', 'ftp', 'cdn', 'static',
  'dashboard', 'auth', 'account', 'user', 'users', 'profile'
])

export interface UserLink {
  label: string
  url: string
}

export interface PublicUser {
  username: string
  displayName: string
  bio: string
  links: UserLink[]
  avatarUrl: string | null
  bannerUrl: string | null
  createdAt: string
}

export interface SessionUser {
  username: string
  displayName: string
  role: UserRole
  avatarUrl: string | null
}

export interface UsernameValidationOptions {
  allowReserved?: boolean
}

export function isValidUsername(value: unknown, options?: UsernameValidationOptions): value is string {
  if (typeof value !== 'string') return false
  if (!USERNAME_PATTERN.test(value)) return false
  if (!options?.allowReserved && RESERVED_USERNAMES.has(value)) return false
  return true
}

export function usernameError(value: string, options?: UsernameValidationOptions): string | null {
  if (!value) return null
  if (value.length < USERNAME_MIN_LENGTH) {
    return `At least ${USERNAME_MIN_LENGTH} characters.`
  }
  if (value.length > USERNAME_MAX_LENGTH) {
    return `At most ${USERNAME_MAX_LENGTH} characters.`
  }
  if (!/^[a-z0-9]/.test(value)) {
    return 'Must start with a lowercase letter or digit.'
  }
  if (!/[a-z0-9]$/.test(value)) {
    return 'Must end with a lowercase letter or digit.'
  }
  if (!/^[a-z0-9_-]+$/.test(value)) {
    return 'Only lowercase letters, digits, hyphens, and underscores.'
  }
  if (!options?.allowReserved && RESERVED_USERNAMES.has(value)) {
    return 'This username is reserved. Ask an admin to grant it.'
  }
  return null
}

export function normalizeDisplayName(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase()
}

export function isValidRole(value: unknown): value is UserRole {
  return typeof value === 'string' && (USER_ROLES as readonly string[]).includes(value)
}