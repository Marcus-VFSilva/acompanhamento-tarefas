interface EmlAttachment {
  filename: string;
  blob: Blob;
}

interface BuildEmlOptions {
  fromEmail: string;
  fromName: string;
  toEmail?: string;
  subject: string;
  body: string;
  attachments: EmlAttachment[];
}

const CRLF = "\r\n";

function encodeMimeHeader(value: string): string {
  if (/^[\x20-\x7E]*$/.test(value)) return value;
  const encoded = btoa(
    encodeURIComponent(value).replace(/%([0-9A-F]{2})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
    ),
  );
  return `=?UTF-8?B?${encoded}?=`;
}

function encodeBase64Utf8(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function blobToBase64Lines(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }

  const base64 = btoa(binary);
  return base64.match(/.{1,76}/g)?.join(CRLF) ?? base64;
}

function mimeTypeFor(filename: string): string {
  if (filename.endsWith(".xlsx")) {
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }
  if (filename.endsWith(".pdf")) return "application/pdf";
  return "application/octet-stream";
}

export async function buildOperationalEml(options: BuildEmlOptions): Promise<Blob> {
  const boundary = `----=_Report_${Date.now()}`;
  const plainBody = options.body.replace(/\n/g, CRLF);
  const parts: string[] = [];

  parts.push(`From: ${encodeMimeHeader(options.fromName)} <${options.fromEmail}>`);
  if (options.toEmail) parts.push(`To: ${options.toEmail}`);
  parts.push(`Subject: ${encodeMimeHeader(options.subject)}`);
  parts.push("MIME-Version: 1.0");
  parts.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
  parts.push("");

  parts.push(`--${boundary}`);
  parts.push("Content-Type: text/plain; charset=UTF-8");
  parts.push("Content-Transfer-Encoding: base64");
  parts.push("");
  parts.push(encodeBase64Utf8(plainBody));
  parts.push("");

  for (const attachment of options.attachments) {
    const base64 = await blobToBase64Lines(attachment.blob);
    parts.push(`--${boundary}`);
    parts.push(`Content-Type: ${mimeTypeFor(attachment.filename)}; name="${attachment.filename}"`);
    parts.push("Content-Transfer-Encoding: base64");
    parts.push(`Content-Disposition: attachment; filename="${attachment.filename}"`);
    parts.push("");
    parts.push(base64);
    parts.push("");
  }

  parts.push(`--${boundary}--`);
  parts.push("");

  return new Blob([parts.join(CRLF)], { type: "message/rfc822" });
}
