import 'server-only'

export interface EmailPayload {
    to: string[]
    subject: string
    html: string
    cc?: string[]
}

export interface EmailResult {
    success: boolean
    messageId?: string
    error?: string
}

/**
 * Send an email using the configured provider.
 *
 * Provider is selected via env vars:
 *   EMAIL_PROVIDER=resend   → uses Resend (requires RESEND_API_KEY)
 *   EMAIL_PROVIDER=sendgrid → uses SendGrid (requires SENDGRID_API_KEY)
 *   EMAIL_PROVIDER=smtp     → uses SMTP (requires SMTP_* vars)
 *   unset / dev             → logs to console, does not send
 */
export async function sendEmail(payload: EmailPayload): Promise<EmailResult> {
    const provider = (process.env.EMAIL_PROVIDER || 'dev').toLowerCase()

    switch (provider) {
        case 'resend':
            return sendViaResend(payload)
        case 'sendgrid':
            return sendViaSendGrid(payload)
        case 'smtp':
            return sendViaSmtp(payload)
        default:
            console.log('[Email Dev] Would send:', { to: payload.to, subject: payload.subject })
            return { success: true }
    }
}

async function sendViaResend(payload: EmailPayload): Promise<EmailResult> {
    try {
        const apiKey = process.env.RESEND_API_KEY
        if (!apiKey) {
            console.error('RESEND_API_KEY not set')
            return { success: false, error: 'RESEND_API_KEY not set' }
        }

        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: process.env.EMAIL_FROM || 'E5 Chronicles <notifications@e5chronicles.com>',
                to: payload.to,
                cc: payload.cc,
                subject: payload.subject,
                html: payload.html,
            }),
        })

        if (!res.ok) {
            const errText = await res.text()
            console.error('Resend error:', errText)
            return { success: false, error: errText }
        }

        const data = await res.json()
        return { success: true, messageId: data.id }
    } catch (err: any) {
        console.error('Resend exception:', err)
        return { success: false, error: err.message }
    }
}

async function sendViaSendGrid(payload: EmailPayload): Promise<EmailResult> {
    try {
        const apiKey = process.env.SENDGRID_API_KEY
        if (!apiKey) {
            console.error('SENDGRID_API_KEY not set')
            return { success: false, error: 'SENDGRID_API_KEY not set' }
        }

        const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                personalizations: [{ to: payload.to.map(email => ({ email })), cc: payload.cc?.map(email => ({ email })) }],
                from: { email: process.env.EMAIL_FROM || 'notifications@e5chronicles.com', name: 'E5 Chronicles' },
                subject: payload.subject,
                content: [{ type: 'text/html', value: payload.html }],
            }),
        })

        if (!res.ok) {
            const errText = await res.text()
            console.error('SendGrid error:', errText)
            return { success: false, error: errText }
        }

        return { success: true, messageId: res.headers.get('x-message-id') || undefined }
    } catch (err: any) {
        console.error('SendGrid exception:', err)
        return { success: false, error: err.message }
    }
}

async function sendViaSmtp(payload: EmailPayload): Promise<EmailResult> {
    // SMTP support requires the `nodemailer` package, which is not installed.
    // Report failure so callers don't believe an email was sent.
    console.warn('SMTP email provider requires `npm install nodemailer` and SMTP_* env vars.')
    console.log('[Email SMTP] Not sent (stub):', { to: payload.to, subject: payload.subject })
    return { success: false, error: 'SMTP provider not implemented — install nodemailer and configure SMTP_* env vars, or set EMAIL_PROVIDER to resend/sendgrid' }
}
