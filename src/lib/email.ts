import QRCode from "qrcode";
import { db, type Registration } from "./db";
import { ticketEmail } from "./ticket-email";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
export async function sendTicket(registration: Registration): Promise<boolean> {
  try {
    const from = process.env.EMAIL_FROM?.trim();
    if (!from) throw new Error("EMAIL_FROM_NOT_CONFIGURED");
    const message = ticketEmail(
      registration,
      process.env.APP_URL || "http://localhost:3000",
    );
    const qr = await QRCode.toBuffer(registration.secure_token, {
      width: 360,
      margin: 3,
      errorCorrectionLevel: "M",
    });
    const attachments = await Promise.all([
      readFile(join(process.cwd(), "public/images/college-seal.webp")),
      readFile(join(process.cwd(), "public/images/kaizen-logo.webp")),
      readFile(
        join(
          process.cwd(),
          "public",
          registration.locale === "en" ? "event-en.ics" : "event.ics",
        ),
      ),
    ]);
    const encodedAttachments = [
      {
        filename: "ticket-qr.png",
        content: qr.toString("base64"),
        content_type: "image/png",
        content_id: "ticket-qr",
      },
      {
        filename: "college-seal.webp",
        content: attachments[0].toString("base64"),
        content_type: "image/webp",
        content_id: "college-seal",
      },
      {
        filename: "kaizen-logo.webp",
        content: attachments[1].toString("base64"),
        content_type: "image/webp",
        content_id: "kaizen-logo",
      },
      {
        filename: "event.ics",
        content: attachments[2].toString("base64"),
        content_type: "text/calendar; charset=utf-8",
      },
    ];

    if ((process.env.EMAIL_PROVIDER || "resend") === "smtp") {
      const nodemailer = (await import("nodemailer")).default;
      if (!process.env.SMTP_HOST) throw new Error("SMTP_NOT_CONFIGURED");
      const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
          : undefined,
        connectionTimeout: 8000,
        socketTimeout: 12000,
      });
      await transport.sendMail({
        from,
        to: registration.email,
        ...message,
        attachments: [
          { filename: "ticket-qr.png", content: qr, cid: "ticket-qr" },
          {
            filename: "college-seal.webp",
            content: attachments[0],
            contentType: "image/webp",
            cid: "college-seal",
          },
          {
            filename: "kaizen-logo.webp",
            content: attachments[1],
            contentType: "image/webp",
            cid: "kaizen-logo",
          },
          {
            filename: "event.ics",
            content: attachments[2],
            contentType: "text/calendar; charset=utf-8",
          },
        ],
      });
    } else {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) throw new Error("RESEND_API_KEY_NOT_CONFIGURED");
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [registration.email],
          subject: message.subject,
          html: message.html,
          text: message.text,
          attachments: encodedAttachments,
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) {
        const result = (await response.json().catch(() => ({}))) as {
          name?: string;
          statusCode?: number;
        };
        throw new Error(result.name || `RESEND_HTTP_${response.status}`);
      }
    }
    await db().execute(
      "INSERT INTO email_logs (registration_id,status) VALUES (?,'SENT')",
      [registration.id],
    );
    return true;
  } catch (error) {
    await db().execute(
      "INSERT INTO email_logs (registration_id,status,error_code) VALUES (?,'FAILED',?)",
      [
        registration.id,
        ((error as { code?: string; message?: string }).code ||
          (error as { message?: string }).message ||
          "DELIVERY_FAILED")
          .replace(/[^A-Za-z0-9_-]/g, "_")
          .slice(0, 80),
      ],
    );
    return false;
  }
}
