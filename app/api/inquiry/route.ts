import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

const COLLECTION = "inquiries";

const VALID_SERVICES = ["blog", "seo", "website", "pipeline", "monetize"];
const VALID_BUDGETS = ["starter", "pro", "enterprise"];

interface Inquiry {
  services: string[];
  budget: string;
  email: string;
  company?: string;
  createdAt: string;
  status: "new" | "contacted" | "closed";
}

export async function POST(req: NextRequest) {
  try {
    const { services, budget, email, company } = await req.json();

    if (!Array.isArray(services) || services.length === 0 || !services.every((s: string) => VALID_SERVICES.includes(s))) {
      return NextResponse.json({ error: "서비스를 선택해주세요." }, { status: 400 });
    }
    if (!VALID_BUDGETS.includes(budget)) {
      return NextResponse.json({ error: "예산 범위를 선택해주세요." }, { status: 400 });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "유효한 이메일을 입력해주세요." }, { status: 400 });
    }

    const inquiry: Inquiry = {
      services,
      budget,
      email: email.trim().toLowerCase(),
      company: company?.trim() || undefined,
      createdAt: new Date().toISOString(),
      status: "new",
    };

    // Firestore에 저장
    await getDb().collection(COLLECTION).add(inquiry);

    // 외부 웹훅
    const webhookUrl = process.env.INQUIRY_WEBHOOK_URL;
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inquiry),
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Inquiry API error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const key = req.headers.get("authorization")?.replace("Bearer ", "");
    if (key !== process.env.ADMIN_TOKEN) {
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
