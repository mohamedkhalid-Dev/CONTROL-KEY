import { MessageCircleQuestion } from "lucide-react";
import { LegalShell, legalMetadata } from "@/components/legal/LegalShell";

export const metadata = legalMetadata(
  "FAQ",
  "What is OpenRouter? Is it free? Will AI disobey? Answers for students and parents.",
  "/faq"
);

const QA: [string, string][] = [
  ["What is OpenRouter?", "A shop of AI brains. You get a free key there, paste it here, and chat. Most starter models cost $0."],
  ["Is Control Key free?", "Yes — the app is 100% free. You bring your own OpenRouter key; free models exist for students."],
  ["Will AI disobey my locks?", "Locks are core instructions AI cannot override. If you beg it to break them, it refuses kindly and points to My Locks. Rare slips are auto-blocked by the Shield guard."],
  ["What if I'm under 13?", "Ask a parent or teacher to help create the OpenRouter key and agree to the terms with you."],
  ["Where is my key stored?", "In your browser only (recommended). Cloud vault is opt-in and encrypted. Exports always mask it."],
  ["Can I delete everything?", "Yes — Settings → Delete my account wipes profile, chats, and locks. Type DELETE to confirm."],
  ["Which models work?", "Any OpenRouter chat model. FREE-tagged ones (like Llama 3.1 8B Free) cost nothing. Paid ones warn before use."],
  ["Does it work offline?", "Your locks and old chats stay readable. Sending needs internet — drafts are saved and retried."],
];

export default function FaqPage() {
  return (
    <LegalShell icon={<MessageCircleQuestion size={20} strokeWidth={1.75} />} title="Questions, answered." updated="2026-09-22">
      {QA.map(([q, a]) => (
        <div key={q} className="ck-card mb-3 p-4">
          <h2 className="!mt-0 text-base">{q}</h2>
          <p className="!mb-0">{a}</p>
        </div>
      ))}
    </LegalShell>
  );
}
