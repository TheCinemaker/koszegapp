import ticketConfig from '../ticket-config.json' with { type: 'json' };

/**
 * Get the full application URL
 * @returns {string} Full URL (from env or localhost)
 */
const getAppUrl = () => {
    return process.env.URL || 'http://localhost:8888';
};

/**
 * Check if running in test/sandbox mode
 * @returns {boolean}
 */
const isTestMode = () => {
    return ticketConfig.env === 'test';
};

/**
 * Get Stripe configuration
 * @returns {object} Stripe settings
 */
const getStripeConfig = () => {
    return {
        secretKey: process.env.STRIPE_SECRET_KEY,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
        currency: ticketConfig.stripe.currency,
        successUrl: `${getAppUrl()}${ticketConfig.stripe.successPath}`,
        cancelUrl: `${getAppUrl()}${ticketConfig.stripe.cancelPath}`
    };
};

/**
 * Get email configuration
 * @returns {object} Email settings
 */
const getEmailConfig = () => {
    return {
        apiKey: process.env.RESEND_API_KEY,
        from: ticketConfig.email.from,
        subjectPrefix: ticketConfig.email.subjectPrefix,
        sendDelayMs: ticketConfig.email.sendDelayMs
    };
};

/**
 * Get Apple Wallet configuration
 * @returns {object} Wallet settings
 */
const getWalletConfig = () => {
    return {
        enabled: ticketConfig.wallet.apple.enabled,
        passNamePrefix: ticketConfig.wallet.apple.passNamePrefix,
        teamIdentifier: ticketConfig.wallet.apple.teamIdentifier,
        passTypeIdentifier: ticketConfig.wallet.apple.passTypeIdentifier,
        passphrase: process.env.PASSKIT_PASSPHRASE
    };
};

/**
 * Get Google Wallet configuration
 * @returns {object} Wallet settings
 */
const getGoogleWalletConfig = () => {
    return {
        enabled: ticketConfig.wallet.google.enabled,
        issuerId: process.env.GOOGLE_ISSUER_ID || ticketConfig.wallet.google.issuerId,
        classId: process.env.GOOGLE_TICKET_CLASS_ID || 'ticket_class'
    };
};

export {
    ticketConfig,
    getAppUrl,
    isTestMode,
    getStripeConfig,
    getEmailConfig,
    getWalletConfig,
    getGoogleWalletConfig
};
