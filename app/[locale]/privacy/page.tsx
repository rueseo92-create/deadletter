import { Metadata } from "next";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: `${siteConfig.company.name} 개인정보처리방침`,
};

const c = siteConfig.company;

// 처리 위탁·국외 이전 업체. 실제로 쓰는 서비스만 적는다.
const processors = [
  { name: "Vercel Inc.", task: "웹사이트 호스팅, 접속 기록 처리", items: "접속 IP, 브라우저 정보, 접속 시각" },
  { name: "Google LLC (Firebase)", task: "상담 신청·뉴스레터 구독 정보 저장", items: "상담 신청 항목 전체, 구독 이메일" },
  { name: "Google LLC (Google Analytics·AdSense)", task: "방문 통계 분석, 광고 게재", items: "쿠키, 방문 페이지, 기기·브라우저 정보" },
  { name: "Telegram Messenger Inc.", task: "상담 신청 접수 알림을 담당자에게 전달", items: "상담 신청 항목 전체" },
  { name: "Resend, Inc.", task: "상담 신청 접수 알림 메일 발송(설정 시)", items: "상담 신청 항목 전체" },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-[42.5rem] px-4 pb-10 pt-10 sm:px-6 sm:pt-14">
      <header className="mb-10 border-b border-line pb-8">
        <h1 className="text-[1.9rem] font-bold tracking-[-0.03em] text-ink sm:text-[2.3rem]">
          개인정보처리방침
        </h1>
        <p className="mt-2 text-[14px] text-ink-3">시행일: {c.privacyEffectiveDate}</p>
      </header>

      <div className="prose">
        <p>
          {c.name}(이하 &quot;회사&quot;)는 {siteConfig.name} {siteConfig.studio} 웹사이트(
          {siteConfig.url}, 이하 &quot;사이트&quot;)를 운영하며, 「개인정보 보호법」에 따라 이용자의
          개인정보를 보호하고 관련 고충을 원활하게 처리하기 위해 다음과 같이 개인정보처리방침을 둡니다.
        </p>

        <h2>1. 처리 목적</h2>
        <ul>
          <li>상담 신청 접수, 답변, 견적·계약 진행</li>
          <li>뉴스레터 발송(구독한 경우)</li>
          <li>방문 통계 분석과 사이트 개선, 광고 게재</li>
        </ul>

        <h2>2. 처리 항목과 수집 방법</h2>
        <ul>
          <li>
            상담 신청(필수): 이름 또는 상호, 연락처(이메일 또는 휴대폰 번호), 문의 내용 / (선택): 업종,
            관심 서비스
          </li>
          <li>
            상담 신청 시 함께 전송: 유입 경로(광고 링크 표시값, 이전 사이트 도메인, 처음 본 페이지) —
            브라우저에 30일 보관되며 신청할 때만 전송
          </li>
          <li>뉴스레터 구독: 이메일 주소</li>
          <li>자동 수집: 접속 IP, 쿠키, 방문 기록, 브라우저·기기 정보</li>
        </ul>

        <h2>3. 보유 기간과 파기</h2>
        <ul>
          <li>상담 신청 정보: 상담 종료 후 1년 보관 뒤 파기. 계약으로 이어지면 아래 법정 기간을 따릅니다.</li>
          <li>뉴스레터 이메일: 구독 해지 시 바로 삭제</li>
          <li>
            「전자상거래 등에서의 소비자보호에 관한 법률」에 따른 보관: 계약·청약철회 기록 5년, 대금결제·재화
            공급 기록 5년, 소비자 불만·분쟁처리 기록 3년
          </li>
          <li>「통신비밀보호법」에 따른 웹사이트 방문 기록: 3개월</li>
        </ul>
        <p>
          보유 기간이 끝나거나 목적을 달성한 개인정보는 지체 없이 파기합니다. 전자 파일은 복구할 수 없는
          방법으로 삭제하고, 종이 문서는 분쇄합니다.
        </p>

        <h2>4. 제3자 제공</h2>
        <p>회사는 이용자의 개인정보를 제3자에게 제공하지 않습니다. 법령에 근거가 있는 경우는 예외로 합니다.</p>

        <h2>5. 처리 위탁과 국외 이전</h2>
        <p>
          회사는 서비스 운영을 위해 아래 업체에 개인정보 처리를 맡기며, 이 업체들의 서버는 국외(미국 등)에
          있을 수 있습니다. 정보는 수집 시점에 네트워크를 통해 전송되며, 보유 기간은 3절과 같습니다. 국외
          이전을 원하지 않으면 상담 신청 대신 이메일({c.email})로 문의할 수 있습니다.
        </p>
        <table>
          <thead>
            <tr>
              <th>받는 자</th>
              <th>맡기는 일</th>
              <th>이전 항목</th>
            </tr>
          </thead>
          <tbody>
            {processors.map((p) => (
              <tr key={p.name}>
                <td>{p.name}</td>
                <td>{p.task}</td>
                <td>{p.items}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2>6. 이용자의 권리</h2>
        <p>
          이용자는 언제든지 자신의 개인정보 열람·정정·삭제·처리정지를 요구할 수 있습니다. {c.email}로
          요청하시면 지체 없이 처리합니다.
        </p>

        <h2>7. 쿠키</h2>
        <p>
          사이트는 방문 통계(Google Analytics)와 광고(Google AdSense)를 위해 쿠키를 씁니다. 브라우저 설정에서
          쿠키 저장을 거부할 수 있으며, 거부해도 글 읽기와 상담 신청은 그대로 이용할 수 있습니다.
        </p>

        <h2>8. 안전성 확보 조치</h2>
        <ul>
          <li>관리 화면·저장소 접근 권한을 담당자로 제한</li>
          <li>전송 구간 암호화(HTTPS)</li>
          <li>접근 키는 서버 환경변수로만 관리</li>
        </ul>

        <h2>9. 개인정보 보호책임자</h2>
        <ul>
          <li>책임자: {c.privacyOfficer}</li>
          <li>
            연락처: <a href={`mailto:${c.email}`}>{c.email}</a>
            {c.phone && <> · {c.phone}</>}
          </li>
        </ul>
        <p>
          개인정보 침해 신고·상담은 개인정보침해신고센터(privacy.kisa.or.kr, 국번 없이 118),
          개인정보분쟁조정위원회(www.kopico.go.kr, 1833-6972)에도 할 수 있습니다.
        </p>

        <h2>10. 콘텐츠 안내</h2>
        <blockquote>{siteConfig.disclaimer}</blockquote>

        <h2>11. 변경</h2>
        <p>
          이 방침은 {c.privacyEffectiveDate}부터 적용됩니다. 내용이 바뀌면 시행 7일 전부터 이 페이지에
          알립니다.
        </p>
      </div>
    </div>
  );
}
