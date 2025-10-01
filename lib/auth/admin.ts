import { User } from "@supabase/supabase-js"

/**
 * List of admin email addresses
 * In production, consider moving this to a database table or environment variable
 */
const ADMIN_EMAILS = [
  "dave@25northventures.com",
  // Add more admin emails here
]

/**
 * Check if a user is an admin based on their email
 */
export function isAdmin(user: User | null): boolean {
  if (!user?.email) return false
  return ADMIN_EMAILS.includes(user.email.toLowerCase())
}

/**
 * Check if an email is an admin email
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase())
}
