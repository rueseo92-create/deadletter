import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase-admin";
import { SERVICES } from "@/lib/agency";

export const dynamic = "force-dynamic";

const COLLECTION = "inquiries";
const VALID_SERVICES = SERVICES.map((s) => s.id).concat("unsure");

interface Inquiry {
  name: string;
  contact: string;
  business?: string;
  services: string[];
  message: string;
  createdAt: string;
  status: "new" | "contacted" | "closed";
}

const hasFirebase = () =>
  Boolean(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);

const MAIL_TO = "contact@seroai.xyz";

/** 문의 알림 본문. 텔레그램과 메일에 같이 쓴다. */
function inquiryText(q: Inquiry) {
  const names = SERVICES.filter((s) => q.services.includes(s.id)).map((s) => s.name);
  return [
    `이름/상호: ${q.name}`,
    `연락처: ${q.contact}`,
    q.business ? `업종: ${q.business}` : "",
    `관심 서비스: ${names.join(", ") || "아직 모르겠음"}`,
    "",
    q.message,
    "",
    new Date(q.createdAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }),
  ]
    .filter((l, i, a) => l !== "" || a[i - 1] !== "")
    .join("\n");
}

async function notifyTelegram(subject: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: `${subject}\n\n${text}` }),
    });
    return r.ok;
  } catch (error) {
    console.error("Inquiry telegram error:", error);
    return false;
  }
}

async function sendMail(subject: string, text: string, replyTo?: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.MAIL_FROM || "딸깍스튜디오 <noreply@seroai.xyz>",
        to: [MAIL_TO],
        subject,
        text,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });
    return r.ok;
  } catch (error) {
    console.error("Inquiry mail error:", error);
    return false;
  }
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const name = str(body.name, 40);
  const contact = str(body.contact, 80);
  const business = str(body.business, 80);
  const message = str(body.message, 2000);
  const services = Array.isArray(body.services)
    ? (body.services as unknown[]).filter((s): s is string => typeof s === "string" && VALID_SERVICES.includes(s))
    : [];

  if (!name) return NextResponse.json({ error: "이름(또는 상호)을 적어 주세요." }, { status: 400 });
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
  const isPhone = /^0\d{1,2}-?\d{3,4}-?\d{4}$/.test(contact);
  if (!isEmail && !isPhone) {
    return NextResponse.json({ error: "답장받을 이메일이나 휴대폰 번호를 적어 주세요." }, { status: 400 });
  }
  if (message.length < 5) return NextResponse.json({ error: "어떤 일이 고민인지 한두 줄 적어 주세요." }, { status: 400 });

  const inquiry: Inquiry = {
    name,
    contact,
    business: business || undefined,
    services,
    message,
    createdAt: new Date().toISOString(),
    status: "new",
  };

  // 텔레그램·메일은 다른 저장소와 별개로 항상 시도한다
  const subject = `[딸깍] 상담 · ${name}`;
  const text = inquiryText(inquiry);
  const [notified, mailed] = await Promise.all([
    notifyTelegram(subject, text),
    sendMail(subject, text, isEmail ? contact : undefined),
  ]);

  const webhookUrl = process.env.INQUIRY_WEBHOOK_URL;
  if (!hasFirebase() && !webhookUrl) {
    if (notified || mailed) return NextResponse.json({ ok: true });
    // 받을 곳이 설정되지 않았으면 화면에서 메일 보내기로 넘긴다
    return NextResponse.json({ error: "문의 접수 창구가 아직 연결되지 않았어요.", fallback: "mail" }, { status: 503 });
  }

  let saved = notified || mailed;
  if (hasFirebase()) {
    try {
      await getDb().collection(COLLECTION).add(inquiry);
      saved = true;
    } catch (error) {
      console.error("Inquiry save error:", error);
    }
  }
  if (webhookUrl) {
    try {
      const r = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inquiry),
      });
      saved = saved || r.ok;
    } catch (error) {
      console.error("Inquiry webhook error:", error);
    }
  }

  if (!saved) return NextResponse.json({ error: "접수 중 오류가 났어요.", fallback: "mail" }, { status: 502 });
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  try {
    const key = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!process.env.ADMIN_TOKEN || key !== process.env.ADMIN_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const snapshot = await getDb()
      .collection(COLLECTION)
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    const inquiries = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ count: inquiries.length, inquiries });
  } catch (error) {
    console.error("Inquiry GET error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
