"use client";

import { useState } from "react";

/* ── 중위소득 150% 기준 (2026, 세전 월소득, 만원) ── */
const INCOME_LIMITS: Record<number, number> = {
  1: 384,
  2: 630,
  3: 804,
  4: 974,
  5: 1134,
  6: 1290,
  7: 1443,
};

/* ── 1인당 지급액 (만원) ── */
const AMOUNTS: Record<string, Record<string, number>> = {
  general: { metro: 10, non_metro: 15, decline_pref: 20, decline_special: 25 },
  near_poverty: { metro: 45, non_metro: 50, decline_pref: 50, decline_special: 50 },
  basic_livelihood: { metro: 55, non_metro: 60, decline_pref: 60, decline_special: 60 },
};

const REGION_LABELS: Record<string, string> = {
  metro: "수도권 (서울·경기·인천)",
  non_metro: "비수도권 (그 외 광역시·도)",
  decline_pref: "인구감소 우대지역 (49곳)",
  decline_special: "인구감소 특별지역 (40곳)",
};

const STATUS_LABELS: Record<string, string> = {
  general: "일반 (소득하위 70%)",
  near_poverty: "차상위계층 / 한부모가구",
  basic_livelihood: "기초생활수급자",
};

const STATUS_EMOJI: Record<string, string> = {
  general: "👨‍👩‍👧‍👦",
  near_poverty: "🤲",
  basic_livelihood: "🏠",
};

export default function FuelSubsidyCalculator() {
  const [members, setMembers] = useState(4);
  const [income, setIncome] = useState("");
  const [region, setRegion] = useState("metro");
  const [status, setStatus] = useState("general");
  const [result, setResult] = useState<null | {
    eligible: boolean;
    perPerson: number;
    total: number;
    limit: number;
  }>(null);

  function calculate() {
    const incomeNum = parseFloat(income);
    if (!incomeNum || incomeNum <= 0) return;

    const limit = INCOME_LIMITS[Math.min(members, 7)] || INCOME_LIMITS[7];

    // 기초수급자/차상위는 소득 무관 자격
    const eligible = status !== "general" || incomeNum <= limit;

    const perPerson = eligible ? AMOUNTS[status][region] : 0;
    const total = perPerson * members;

    setResult({ eligible, perPerson, total, limit });
  }

  const limit = INCOME_LIMITS[Math.min(members, 7)] || INCOME_LIMITS[7];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-amber-50/40 to-pink-50" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_30%,rgba(59,130,246,0.08),transparent_60%)]" />
        <div className="relative max-w-3xl mx-auto px-6 pt-28 pb-12 text-center">
          <p className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-stone-200/60 text-stone-500 text-xs font-medium mb-6 shadow-sm">
            <span className="text-base">⛽</span>
            2026 고유가 피해지원금
          </p>
          <h1 className="text-3xl lg:text-5xl font-extrabold text-stone-800 font-headline tracking-tight leading-tight mb-4">
            우리 가족은<br />
            <span className="text-primary">얼마</span> 받을 수 있을까?
          </h1>
          <p className="text-stone-500 leading-relaxed max-w-lg mx-auto">
            가구원 수, 월소득, 거주지역만 입력하면<br className="hidden sm:block" />
            예상 수령액을 바로 확인할 수 있어요.
          </p>
        </div>
      </section>

      {/* Calculator */}
      <section className="relative -mt-2 pb-20">
        <div className="max-w-2xl mx-auto px-6">
          <div className="bg-white rounded-3xl shadow-card ring-1 ring-stone-200/60 overflow-hidden">
            {/* Form */}
            <div className="p-6 lg:p-8 space-y-6">
              {/* 가구원 수 */}
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-3">
                  👨‍👩‍👧‍👦 가구원 수
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <button
                      key={n}
                      onClick={() => { setMembers(n); setResult(null); }}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                        members === n
                          ? "bg-primary text-white shadow-md shadow-primary/20"
                          : "bg-stone-50 text-stone-500 hover:bg-blue-50 hover:text-primary"
                      }`}
                    >
                      {n}{n === 7 ? "+" : ""}명
                    </button>
                  ))}
                </div>
              </div>

              {/* 월소득 */}
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">
                  💰 세전 월소득 (만원)
                </label>
                <p className="text-xs text-stone-400 mb-3">
                  {members}인 가구 기준 중위소득 150%: <span className="font-bold text-primary">{limit}만원</span> 이하 시 지급 대상
                </p>
                <div className="relative">
                  <input
                    type="number"
                    value={income}
                    onChange={(e) => { setIncome(e.target.value); setResult(null); }}
                    placeholder={`예: ${Math.round(limit * 0.7)}`}
                    className="w-full px-5 py-3.5 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-800 font-medium text-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-medium">만원</span>
                </div>
              </div>

              {/* 거주 지역 */}
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-3">
                  📍 거주 지역
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(REGION_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => { setRegion(key); setResult(null); }}
                      className={`px-4 py-3 rounded-xl text-xs font-medium text-left transition-all duration-200 ${
                        region === key
                          ? "bg-primary text-white shadow-md shadow-primary/20"
                          : "bg-stone-50 text-stone-500 hover:bg-blue-50 hover:text-primary ring-1 ring-stone-100"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {(region === "decline_pref" || region === "decline_special") && (
                  <p className="mt-2 text-[11px] text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                    💡 인구감소지역 여부는 <span className="font-bold">행정안전부 인구감소지역 지정 현황</span>에서 확인할 수 있어요.
                  </p>
                )}
              </div>

              {/* 수급 유형 */}
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-3">
                  📋 수급 유형
                </label>
                <div className="space-y-2">
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => { setStatus(key); setResult(null); }}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-left transition-all duration-200 ${
                        status === key
                          ? "bg-primary text-white shadow-md shadow-primary/20"
                          : "bg-stone-50 text-stone-600 hover:bg-blue-50 hover:text-primary ring-1 ring-stone-100"
                      }`}
                    >
                      <span className="text-lg">{STATUS_EMOJI[key]}</span>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 계산 버튼 */}
              <button
                onClick={calculate}
                disabled={!income}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-blue-600 text-white font-extrabold text-base shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                🧮 계산하기
              </button>
            </div>

            {/* Result */}
            {result && (
              <div className={`border-t ${result.eligible ? "border-emerald-100 bg-gradient-to-b from-emerald-50/80 to-white" : "border-red-100 bg-gradient-to-b from-red-50/60 to-white"} p-6 lg:p-8`}>
                {result.eligible ? (
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold mb-5">
                      ✅ 지급 대상입니다!
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-white rounded-2xl p-5 ring-1 ring-stone-100">
                        <p className="text-xs text-stone-400 mb-1">1인당 지급액</p>
                        <p className="text-2xl font-extrabold text-stone-800 font-headline">
                          {result.perPerson}<span className="text-base font-bold text-stone-400">만원</span>
                        </p>
                      </div>
                      <div className="bg-white rounded-2xl p-5 ring-1 ring-primary/20 shadow-soft">
                        <p className="text-xs text-primary mb-1 font-medium">우리 가족 총 수령액</p>
                        <p className="text-3xl font-extrabold text-primary font-headline">
                          {result.total}<span className="text-base font-bold text-primary/60">만원</span>
                        </p>
                      </div>
                    </div>

                    <div className="bg-blue-50/80 rounded-xl p-4 text-left space-y-2">
                      <p className="text-xs font-bold text-stone-600">📌 계산 내역</p>
                      <div className="text-xs text-stone-500 space-y-1">
                        <p>• 가구원 {members}명 × 1인당 {result.perPerson}만원 = <span className="font-bold text-primary">{result.total}만원</span></p>
                        <p>• 지역: {REGION_LABELS[region]}</p>
                        <p>• 유형: {STATUS_LABELS[status]}</p>
                        <p>• 지급방식: 지역화폐 또는 카드</p>
                      </div>
                    </div>

                    <div className="mt-5 bg-amber-50/80 rounded-xl p-4 text-left">
                      <p className="text-xs font-bold text-amber-700 mb-1">⏰ 신청 일정</p>
                      <div className="text-xs text-amber-600 space-y-1">
                        <p>• 4월 말: 취약계층 1차 자동 지급</p>
                        <p>• 5월 1일~: 일반 대상 신청 개시 (정부24, 복지로)</p>
                        <p>• 사용기한: 지급일로부터 약 4개월</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-100 text-red-700 text-xs font-bold mb-5">
                      ❌ 지급 대상이 아닙니다
                    </div>
                    <p className="text-sm text-stone-500 mb-4">
                      {members}인 가구 기준 월소득 <span className="font-bold text-stone-700">{income}만원</span>은
                      중위소득 150%({result.limit}만원)를 초과합니다.
                    </p>
                    <div className="bg-stone-50 rounded-xl p-4 text-left">
                      <p className="text-xs font-bold text-stone-600 mb-2">💡 참고하세요</p>
                      <div className="text-xs text-stone-500 space-y-1">
                        <p>• K-패스 환급률 인상은 소득과 무관하게 모든 이용자에게 적용됩니다</p>
                        <p>• 석유 최고가격제로 주유소 기름값 인하 혜택은 모두 받을 수 있어요</p>
                        <p>• 대중교통 이용 시 K-패스 환급률 최대 30% (일반 기준)</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 소득 기준표 */}
          <div className="mt-8 bg-white rounded-2xl shadow-card ring-1 ring-stone-200/60 overflow-hidden">
            <div className="p-6 lg:p-8">
              <h2 className="text-lg font-extrabold text-stone-800 font-headline mb-1">📊 가구별 소득 기준표</h2>
              <p className="text-xs text-stone-400 mb-5">2026년 중위소득 150% 기준 (세전 월소득)</p>
              <div className="overflow-x-auto -mx-2">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-primary to-blue-600 text-white">
                      <th className="px-4 py-3 text-left font-semibold rounded-tl-lg">가구원 수</th>
                      <th className="px-4 py-3 text-right font-semibold rounded-tr-lg">소득 기준 (이하)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(INCOME_LIMITS).map(([size, limit], idx) => (
                      <tr key={size} className={`${idx % 2 === 0 ? "bg-stone-50/50" : "bg-white"} ${members === parseInt(size) ? "ring-2 ring-primary/30 bg-blue-50/50" : ""}`}>
                        <td className="px-4 py-3 font-medium text-stone-700">{size}인 가구</td>
                        <td className="px-4 py-3 text-right font-bold text-stone-800">{limit}만원</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 지역별 지급액 */}
          <div className="mt-6 bg-white rounded-2xl shadow-card ring-1 ring-stone-200/60 overflow-hidden">
            <div className="p-6 lg:p-8">
              <h2 className="text-lg font-extrabold text-stone-800 font-headline mb-1">💳 지역·유형별 1인당 지급액</h2>
              <p className="text-xs text-stone-400 mb-5">지역화폐 또는 카드로 지급</p>
              <div className="overflow-x-auto -mx-2">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-primary to-blue-600 text-white">
                      <th className="px-3 py-3 text-left font-semibold rounded-tl-lg text-xs">구분</th>
                      <th className="px-3 py-3 text-center font-semibold text-xs">수도권</th>
                      <th className="px-3 py-3 text-center font-semibold text-xs">비수도권</th>
                      <th className="px-3 py-3 text-center font-semibold text-xs">인구감소<br/>우대</th>
                      <th className="px-3 py-3 text-center font-semibold rounded-tr-lg text-xs">인구감소<br/>특별</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { key: "general", label: "일반 하위70%" },
                      { key: "near_poverty", label: "차상위/한부모" },
                      { key: "basic_livelihood", label: "기초수급자" },
                    ].map((row, idx) => (
                      <tr key={row.key} className={`${idx % 2 === 0 ? "bg-stone-50/50" : "bg-white"} ${status === row.key ? "ring-2 ring-primary/30 bg-blue-50/50" : ""}`}>
                        <td className="px-3 py-3 font-medium text-stone-700 text-xs">{row.label}</td>
                        {["metro", "non_metro", "decline_pref", "decline_special"].map((r) => (
                          <td key={r} className={`px-3 py-3 text-center font-bold text-xs ${region === r && status === row.key ? "text-primary" : "text-stone-800"}`}>
                            {AMOUNTS[row.key][r]}만원
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 사용처 안내 */}
          <div className="mt-6 bg-white rounded-2xl shadow-card ring-1 ring-stone-200/60 overflow-hidden">
            <div className="p-6 lg:p-8">
              <h2 className="text-lg font-extrabold text-stone-800 font-headline mb-5">🛒 지역화폐 사용처</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-xl bg-emerald-50/80 border border-emerald-100 p-4">
                  <p className="text-xs font-bold text-emerald-700 mb-2">✅ 사용 가능</p>
                  <ul className="text-xs text-emerald-600 space-y-1.5">
                    <li>• 전통시장 · 골목상점</li>
                    <li>• 동네 편의점 · 슈퍼마켓</li>
                    <li>• 주유소 · 충전소</li>
                    <li>• 소상공인 가맹점</li>
                    <li>• 동네 음식점 · 카페</li>
                  </ul>
                </div>
                <div className="rounded-xl bg-red-50/80 border border-red-100 p-4">
                  <p className="text-xs font-bold text-red-700 mb-2">❌ 사용 불가</p>
                  <ul className="text-xs text-red-600 space-y-1.5">
                    <li>• 대형마트 (이마트, 홈플러스 등)</li>
                    <li>• 백화점</li>
                    <li>• 면세점</li>
                    <li>• 유흥업소</li>
                    <li>• 온라인 쇼핑몰</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* 면책 */}
          <p className="mt-8 text-[11px] text-stone-400 text-center leading-relaxed max-w-lg mx-auto">
            ※ 본 계산기는 정부 발표 자료(2026.03.31 국무회의)를 기반으로 제작되었으며, 실제 지급액은
            국회 심의 결과 및 시행령에 따라 변경될 수 있습니다. 정확한 정보는 정부24 또는 복지로에서 확인하세요.
          </p>
        </div>
      </section>
    </div>
  );
}
