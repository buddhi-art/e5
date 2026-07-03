export interface EmailConfig {
    provider: 'resend' | 'sendgrid' | 'smtp'
    apiKey: string
    fromAddress: string
    fromName: string
}

export interface EmailPayload {
    to: string[]
    subject: string
    html: string
    cc?: string[]
}
