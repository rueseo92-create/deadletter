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

  const webhookUrl = process.env.INQUIRY_WEBHOOK_URL;
  if (!hasFirebase() && !webhookUrl) {
    // 받을 곳이 설정되지 않았으면 화면에서 메일 보내기로 넘긴다
    return NextResponse.json({ error: "문의 접수 창구가 아직 연결되지 않았어요.", fallback: "mail" }, { status: 503 });
  }

  let saved = false;
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
