import { TypingTest } from "@/components/TypingTest";

export function HomePage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center py-8 px-4">
      <TypingTest />
    </div>
  );
}
