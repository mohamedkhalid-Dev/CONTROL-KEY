import { Users } from "lucide-react";
import { LegalShell, legalMetadata } from "@/components/legal/LegalShell";

export const metadata = legalMetadata(
  "For Parents & Teachers",
  "Why Control Key helps learning instead of cheating: locks, hints-not-answers, discipline score.",
  "/parents"
);

export default function ParentsPage() {
  return (
    <LegalShell icon={<Users size={20} strokeWidth={1.75} />} title="For parents and teachers" updated="2026-09-22">
      <h2>Why this helps learning, not cheating</h2>
      <p>
        Normal AI hands over full answers — homework becomes copy-paste. Control Key flips it: the student writes their
        own boundaries (“Quiz me, don&apos;t solve”), and the AI must teach through hints. The brain stays in the loop.
      </p>
      <h2>How locks work</h2>
      <ul>
        <li>Strict locks (homework, exams, code) can never be overridden — even if the student begs in chat.</li>
        <li>Changing a lock needs an explicit click in My Locks — no chat trick can toggle it.</li>
        <li>Slips are auto-blocked and counted, so you can see them.</li>
      </ul>
      <h2>Motivation, not surveillance</h2>
      <p>
        A Discipline Score (+10 per self-solved problem) and day streaks reward honesty. Encouragement toasts celebrate
        asking for hints instead of answers. No leaderboards, no shaming, no data selling.
      </p>
      <h2>Safety & privacy</h2>
      <ul>
        <li>No passwords, no ads, no tracking for sale.</li>
        <li>API keys stay on the student&apos;s device unless you opt into the encrypted vault.</li>
        <li>Under-13 students should create the OpenRouter key together with an adult.</li>
      </ul>
      <h2>Try it together</h2>
      <p>
        Sit with your student for 5 minutes: set one lock (“Teach me, don&apos;t solve”), then ask the AI for homework
        help. Watch it give Hint 1 instead of the answer. That&apos;s the approach.
      </p>
    </LegalShell>
  );
}
