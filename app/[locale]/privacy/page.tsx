import { Metadata } from "next";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: `${siteConfig.name} 개인정보처리방침`,
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-[42.5rem] px-4 pb-10 pt-10 sm:px-6 sm:pt-14">
      <header className="mb-10 border-b border-line pb-8">
        <h1 className="text-[1.9rem] font-bold tracking-[-0.03em] text-ink sm:text-[2.3rem]">
          개인정보처리방침
        </h1>
        <p className="mt-2 text-[14px] text-ink-3">
          최종 수정일: {new Date().toISOString().split("T")[0]}
        </p>
      </header>

      <div className="prose">
        <h2>1. 개인정보의 수집 및 이용 목적</h2>
        <p>
          {siteConfig.name}(이하 &quot;사이트&quot;)는 다음 목적을 위해 개인정보를 수집 및 이용합니다.
        </p>
        <ul>
          <li>뉴스레터 발송을 위한 이메일 주소 수집</li>
          <li>웹사이트 이용 통계 분석 (Google Analytics)</li>
          <li>서비스 개선 및 사용자 경험 최적화</li>
        </ul>

        <h2>2. 수집하는 개인정보 항목</h2>
        <ul>
          <li>이메일 주소 (뉴스레터 구독 시)</li>
          <li>쿠키 및 접속 로그 (자동 수집)</li>
        </ul>

        <h2>3. 개인정보의 보유 및 이용기간</h2>
        <p>
          수집된 개인정보는 수집 목적이 달성된 후 즉시 파기합니다.
          뉴스레터 구독 해지 시 이메일 주소는 즉시 삭제됩니다.
        </p>

        <h2>4. 쿠키(Cookie) 사용</h2>
        <p>
          본 사이트는 Google Analytics를 통해 방문자 통계를 수집합니다.
          브라우저 설정에서 쿠키 저장을 거부할 수 있습니다.
        </p>

        <h2>5. 콘텐츠 출처</h2>
        <blockquote>
          {siteConfig.disclaimer}
        </blockquote>

        <h2>6. 개인정보 보호책임자</h2>
        <p>
          개인정보 관련 문의사항은{" "}
          {/* TODO: 실제 이메일 확인 */}
          <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>로 연락해 주세요.
        </p>
      </div>
    </div>
  );
}
