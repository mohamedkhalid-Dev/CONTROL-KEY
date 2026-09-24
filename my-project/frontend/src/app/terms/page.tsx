import { FileText } from "lucide-react";
import { LegalShell, legalMetadata } from "@/components/legal/LegalShell";

export const metadata = legalMetadata(
  "Terms",
  "Simple rules for using Control Key: be kind, do your own learning, keep your key secret.",
  "/terms"
);

export default function TermsPage() {
  return (
    <LegalShell icon={<FileText size={20} strokeWidth={1.75} />} title="Terms — the simple rules" updated="2026-09-23">
      <h2>1. What Control Key is</h2>
      <p>
        Control Key is a free learning coach. You set locks (rules like “Teach me, don’t solve my homework”).
        AI must stay inside them. You bring your own OpenRouter API key to chat. The app is free;
        OpenRouter may have its own limits or costs.
      </p>
      <h2>2. Your OpenRouter key — you hold it</h2>
      <p>
        Your key (starts with <code>sk-or-</code>) is yours. Keep it secret — anyone with your key can
        use your OpenRouter credit. It is stored only in your browser’s localStorage on this device
        (see our Privacy Policy). We never see it, store it, or back it up. If it leaks, delete it
        in OpenRouter and make a new one. Clearing your browser site data removes it from this device.
      </p>
      <h2>3. Your locks — you set them</h2>
      <p>
        You create, edit, turn ON/OFF, and delete your own locks. You are responsible for what you write
        in them. We build them into the AI’s instructions and try to keep AI inside them, but AI can
        make mistakes.
      </p>
      <h2>4. Your promises (acceptable use)</h2>
      <ul>
        <li>Keep your key secret — don&apos;t share it or paste it in public.</li>
        <li>Use locks to LEARN, not to trick teachers about who did the work.</li>
        <li>Don&apos;t try to break the app, other people&apos;s accounts, or safety limits.</li>
        <li>Don&apos;t use the app for anything illegal, harmful, or to harass others.</li>
        <li>If you are under 13, use only with a parent or teacher who agrees to these terms with you.</li>
      </ul>
      <p>We may suspend accounts that abuse the service.</p>
      <h2>5. Our promises</h2>
      <ul>
        <li>Free app — no card required to use Control Key itself.</li>
        <li>We try to keep the app working, but we may change or stop parts of it at any time.</li>
        <li>We can remove content or accounts that break these terms.</li>
      </ul>
      <h2>6. No warranty (as-is)</h2>
      <p>
        The app is provided “as is” with no guarantees. We do not promise AI will always follow your
        locks, always be correct, or always be available. OpenRouter models are run by others and may
        fail, change, or be rate-limited. If you clear your browser storage, local chats and your key
        on that device are gone — we cannot restore them.
      </p>
      <h2>7. Limitation of liability</h2>
      <p>
        To the most allowed by law, Control Key is not liable for learning results, lost local data,
        OpenRouter charges, or AI mistakes. Your only remedy is to stop using the app.
      </p>
      <h2>8. Questions?</h2>
      <p>Write to hello@controlkey.app — a person reads it.</p>
    </LegalShell>
  );
}
