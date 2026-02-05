// Ticket System - Centralized Configuration Loader
// Single source of truth for all ticket system settings

const fs = require('fs');
const path = require('path');

// Load ticket config once at module initialization
const configPath = path.resolve(__dirname, '../ticket-config.json');
const ticketConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

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

module.exports = {
    ticketConfig,
    getAppUrl,
    isTestMode,
    getStripeConfig,
    getEmailConfig,
    getWalletConfig
};
