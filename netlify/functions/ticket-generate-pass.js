// Ticket System - Apple Wallet Pass Generator
// Generates .pkpass file for Apple Wallet

import { ticketConfig, getWalletConfig } from './lib/ticketConfig.js';
import { createClient } from '@supabase/supabase-js';
import { PKPass } from 'passkit-generator';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = typeof import.meta !== 'undefined' && import.meta.url ? fileURLToPath(import.meta.url) : '';
const __dirname = typeof import.meta !== 'undefined' && import.meta.url ? dirname(__filename) : (typeof process !== 'undefined' ? process.cwd() : '');

function getCertPath(filename) {
    const paths = [
        path.join(__dirname, 'certs', filename),
        path.join(__dirname, '..', 'certs', filename),
        path.join(__dirname, 'netlify/functions/certs', filename),
        path.join(process.cwd(), 'netlify/functions/certs', filename),
        path.join(process.cwd(), 'certs', filename)
    ];
    for (const p of paths) {
        if (fs.existsSync(p)) return p;
    }
    return path.join(__dirname, 'certs', filename);
}

function getAssetPath(filename) {
    const paths = [
        path.join(__dirname, 'assets', filename),
        path.join(__dirname, '..', 'assets', filename),
        path.join(__dirname, 'netlify/functions/assets', filename),
        path.join(process.cwd(), 'netlify/functions/assets', filename),
        path.join(process.cwd(), 'assets', filename)
    ];
    for (const p of paths) {
        if (fs.existsSync(p)) return p;
    }
    return path.join(__dirname, 'assets', filename);
}

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const handler = async (event) => {
    try {
        const ticketId = event.queryStringParameters?.ticketId;

        if (!ticketId) {
            return {
                statusCode: 400,
                body: 'Ticket ID required'
            };
        }

        // Fetch ticket with event details
        const { data: ticket, error: ticketError } = await supabase
            .from('tickets')
            .select(`
        *,
        ticket_events (
          name,
          description,
          date,
          time,
          location
        )
      `)
            .eq('id', ticketId)
            .single();

        if (ticketError || !ticket) {
            return {
                statusCode: 404,
                body: 'Ticket not found'
            };
        }

        const event = ticket.ticket_events;

        // Get wallet config
        const walletConfig = getWalletConfig();

        // Create pass
        const pass = await PKPass.from({
            model: getAssetPath('ticket.pass'),
            certificates: {
                wwdr: getCertPath('wwdr.pem'),
                signerCert: getCertPath('signerCert.pem'),
                signerKey: getCertPath('signerKey.pem'),
                signerKeyPassphrase: walletConfig.passphrase || ''
            }
        }, {
            serialNumber: ticket.id,
            description: `${walletConfig.passNamePrefix}${event.name}`,
            organizationName: ticketConfig.branding.appName,
            passTypeIdentifier: walletConfig.passTypeIdentifier,
            teamIdentifier: walletConfig.teamIdentifier,
            webServiceURL: process.env.URL,
            authenticationToken: ticket.qr_token
        });

        // Set pass fields
        pass.headerFields.push({
            key: 'event',
            label: 'ESEMÉNY',
            value: event.name
        });

        pass.primaryFields.push({
            key: 'name',
            label: 'NÉV',
            value: ticket.buyer_name
        });

        pass.secondaryFields.push({
            key: 'date',
            label: 'DÁTUM',
            value: new Date(event.date).toLocaleDateString('hu-HU')
        }, {
            key: 'time',
            label: 'IDŐPONT',
            value: event.time
        });

        pass.auxiliaryFields.push({
            key: 'location',
            label: 'HELYSZÍN',
            value: event.location
        }, {
            key: 'guests',
            label: 'VENDÉGEK',
            value: `${ticket.guest_count} fő`
        });

        pass.backFields.push({
            key: 'terms',
            label: 'Feltételek',
            value: 'Ez a jegy csak egyszer használható fel. Kérjük, mutasd fel a QR kódot a belépéskor.'
        });

        // Set barcode
        pass.setBarcodes({
            message: ticket.qr_token,
            format: 'PKBarcodeFormatQR',
            messageEncoding: 'iso-8859-1'
        });

        // Generate pass buffer
        const buffer = pass.getAsBuffer();

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/vnd.apple.pkpass',
                'Content-Disposition': `attachment; filename="ticket-${ticket.id}.pkpass"`
            },
            body: buffer.toString('base64'),
            isBase64Encoded: true
        };

    } catch (error) {
        console.error('Pass generation error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
