import nodemailer from 'nodemailer';
import { CARRIER_GATEWAYS, CarrierKey } from '../constants/carriers';

interface SendSMSOptions {
    phoneNumber: string;
    message: string;
    carrier: CarrierKey;
}

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
});

export async function sendSMS({ phoneNumber, message, carrier }: SendSMSOptions) {
    const gateway = CARRIER_GATEWAYS[carrier];
    if (!gateway) {
        throw new Error(`Unsupported carrier: ${carrier}`);
    }
    const digits = phoneNumber.replace(/\D/g, '').slice(-10);
    if (digits.length !== 10) {
        throw new Error('Invalid phone number');
    }
    const to = `${digits}@${gateway}`;
    const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM ?? process.env.SMTP_USER,
        to,
        subject: '',
        text: message,
    });
    return info;
}