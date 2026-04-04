import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

const COLLECTION = "subscribers";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "유효한 이메일 주소를 입력해주세요." },
        { status: 400 }
      );
    }

    const normalized = email.trim().toLowerCase();

    // 중복 체크
    const existing = await getDb()
      .collection(COLLECTION)
      .where("email", "==", normalized)
      .limit(1)
      .get();

    if (!existing.empty) {
      return NextResponse.json(
        { error: "이미 구독 중인 이메일입니다." },
        { status: 409 }
      );
    }

    // Firestore에 저장
    await getDb().collection(COLLECTION).add({
      email: normalized,
      subscribedAt: new Date().toISOString(),
      active: true,
    });

    // 외부 웹훅 (Google Sheets, Zapier 등)
    const webhookUrl = process.env.NEWSLETTER_WEBHOOK_URL;
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalized, subscribedAt: new Date().toISOString() }),
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Newsletter API error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const key = req.headers.get("authorization")?.replace("Bearer ", "");
    if (key !== process.env.NEWSLETTER_ADMIN_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const snapshot = await getDb()
      .collection(COLLECTION)
      .where("active", "==", true)
      .orderBy("subscribedAt", "desc")
      .get();

    const subscribers = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ count: subscribers.length, subscribers });
  } catch (error) {
    console.error("Newsletter GET error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
