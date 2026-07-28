export interface EmailConfig {
    provider: 'resend' | 'sendgrid'
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
