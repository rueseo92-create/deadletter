import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "deadletter — 보내지 못한 편지",
  description:
    "절대 전달되지 않을 편지를 쓰세요. 대신, 낯선 사람이 읽습니다. 당신의 말 못한 말이 누군가의 위로가 됩니다.",
  openGraph: {
    title: "deadletter — 보내지 못한 편지",
    description: "절대 전달되지 않을 편지를 쓰세요. 대신, 낯선 사람이 읽습니다.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
