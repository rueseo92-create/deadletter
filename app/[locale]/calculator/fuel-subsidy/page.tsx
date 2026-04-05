import { Metadata } from "next";
import FuelSubsidyCalculator from "./Calculator";

export const metadata: Metadata = {
  title: "고유가 피해지원금 계산기 | 우리 가족은 얼마 받을까?",
  description:
    "2026 고유가 피해지원금 수령액을 1분 안에 계산해보세요. 가구 인원, 소득, 거주 지역만 입력하면 예상 지급액을 바로 확인할 수 있습니다.",
  openGraph: {
    title: "고유가 피해지원금 계산기 — 우리 가족은 얼마?",
    description: "가구원수·소득·지역 입력하면 예상 수령액 즉시 확인! 최대 60만원×가구원수",
  },
};

export default function Page() {
  return <FuelSubsidyCalculator />;
}
