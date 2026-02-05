require('dotenv').config();
const QRCode = require('qrcode');
const { Resend } = require('resend');

// Mock Data
const ticket = {
    id: "test-ticket-id",
    qr_code_token: "test-token-12345",
    buyer_email: "test@example.com",
    buyer_name: "Test User"
};

const ticketEvent = {
    name: "Test Event",
    date: "2023-10-27",
    time: "18:00",
    location: "Test Location"
};

async function test() {
    console.log("Starting test...");

    try {
        // 1. Generate QR Code Buffer
        console.log("Generating QR Code Buffer...");
        const qrCodeBuffer = await QRCode.toBuffer(ticket.qr_code_token, {
            width: 300,
            margin: 2
        });
        console.log("QR Code Buffer generated. Type:", typeof qrCodeBuffer);
        console.log("Is Buffer?", Buffer.isBuffer(qrCodeBuffer));
        console.log("Buffer length:", qrCodeBuffer.length);

        // 2. Validate Resend logic (Dry run)
        console.log("Preparing email object...");
        const emailObject = {
            from: "Tickets <tickets@example.com>",
            to: [ticket.buyer_email],
            subject: "Test Email",
            attachments: [
                {
                    filename: 'qrcode.png',
                    content: qrCodeBuffer,
                    content_id: 'qrcode'
                }
            ],
            html: `<html><body><img src="cid:qrcode" /></body></html>`
        };

        console.log("Email object created successfully.");
        console.log("Attachments count:", emailObject.attachments.length);

        console.log("Test Passed!");

    } catch (error) {
        console.error("TEST FAILED:", error);
    }
}

test();
