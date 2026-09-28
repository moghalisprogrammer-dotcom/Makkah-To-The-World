import QRCode from "qrcode";
import { rows, type Registration } from "@/lib/db";
import { failure, HttpError, json } from "@/lib/http";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    if (!/^[a-f0-9]{64}$/.test(token))
      throw new HttpError(404, "التذكرة غير موجودة.");
    const [r] = await rows<Registration>(
      "SELECT full_name,registration_number,status,secure_token,workshop_id FROM registrations WHERE secure_token=?",
      [token],
    );
    if (!r) throw new HttpError(404, "التذكرة غير موجودة.");
    return json({
      full_name: r.full_name,
      registration_number: r.registration_number,
      status: r.status,
      workshop_id: r.workshop_id,
      qr: await QRCode.toDataURL(token, {
        width: 360,
        margin: 3,
        errorCorrectionLevel: "M",
      }),
    });
  } catch (error) {
    return failure(error);
  }
}
