import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'

/**
 * Escape user-controlled strings for safe HTML rendering in email bodies.
 */
function escapeHtml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

/**
 * Create an in-app notification and optionally send an email.
 *
 * For server actions: import and call this when something noteworthy happens
 * (leave approved, invoice overdue, task over deadline, etc.)
 */
export async function createNotification(
    userId: string,
    type: string,
    title: string,
    description?: string,
    href?: string,
    sendEmailCopy = false,
): Promise<string | null> {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('notifications')
            .insert({
                user_id: userId,
                type,
                title,
                description: description || null,
                href: href || null,
            })
            .select('id')
            .single()

        if (error) {
            console.error('Failed to create notification:', error)
            return null
        }

        const notificationId = data.id

        // Optionally send email copy
        if (sendEmailCopy) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('email, contact_email')
                .eq('id', userId)
                .single()

            const emailAddr = profile?.contact_email || profile?.email
            if (emailAddr) {
                const safeTitle = escapeHtml(title)
                const safeDescription = description ? escapeHtml(description) : ''
                const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
                const safeUrl = href ? baseUrl + href : ''

                const result = await sendEmail({
                    to: [emailAddr],
                    subject: safeTitle,
                    html: [
                        '<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">',
                        '  <h2 style="color: #1a1a1a;">' + safeTitle + '</h2>',
                        safeDescription ? '  <p style="color: #555;">' + safeDescription + '</p>' : '',
                        safeUrl ? '  <p><a href="' + safeUrl + '" style="display: inline-block; padding: 10px 20px; background: #000; color: #fff; text-decoration: none; border-radius: 8px;">View Details</a></p>' : '',
                        '</div>',
                    ].filter(Boolean).join('\n'),
                })

                if (result.success) {
                    await supabase
                        .from('notifications')
                        .update({ email_sent: true })
                        .eq('id', notificationId)
                }
            }
        }

        return notificationId
    } catch (err) {
        console.error('createNotification error:', err)
        return null
    }
}

/**
 * Mark a notification as read.
 */
export async function markNotificationRead(notificationId: string): Promise<void> {
    try {
        const supabase = await createClient()
        await supabase
            .from('notifications')
            .update({ read_at: new Date().toISOString() })
            .eq('id', notificationId)
    } catch (err) {
        console.error('markNotificationRead error:', err)
    }
}

/**
 * Get unread notification count for the current user.
 */
export async function getUnreadCount(): Promise<number> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return 0

        const { count } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .is('read_at', null)

        return count || 0
    } catch {
        return 0
    }
}
