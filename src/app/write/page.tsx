import WriteForm from "@/components/WriteForm";

export const metadata = {
  title: "편지 쓰기 — deadletter",
  description: "보내지 못한 편지를 익명으로 써보세요.",
};

export default function WritePage() {
  return (
    <section className="min-h-screen pt-32 pb-20 px-6 md:px-10">
      <WriteForm />
    </section>
  );
}
