import { Lock } from "lucide-react";
import { LegalShell, legalMetadata } from "@/components/legal/LegalShell";

export const metadata = legalMetadata(
  "Privacy",
  "Your key stays in your browser. We never sell data. Privacy for Control Key.",
  "/privacy"
);

export default function PrivacyPage() {
  return (
    <LegalShell icon={<Lock size={20} strokeWidth={1.75} />} title="Privacy — your key stays yours" updated="2026-09-23">
      <h2>1. The short version</h2>
      <p>
        Your chats and your OpenRouter API key never touch our servers. They stay in YOUR browser’s
        localStorage only. We store just your profile (name, age, email) and your locks in Supabase
        so sync works. We never sell data. No ads. No chat-content tracking.
      </p>
      <h2>2. Your API key — never stored on our servers</h2>
      <p>
        Your OpenRouter key is saved only on your device in localStorage (<code>ck_openrouter_key</code>).
        It is never sent to Supabase or our backend. Chat requests go straight from your browser to
        OpenRouter. Clearing your browser site data deletes it. There is no cloud backup of your key —
        you must re-enter it on each new device.
      </p>
      <h2>3. Your conversations — never stored on our servers</h2>
      <p>
        Chat history is stored only in your browser (<code>ck_chats_v1</code> + <code>ck_messages_v1</code>).
        We do not save, read, or track your chat text on our servers. To get an answer, your message +
        your locks must be sent to OpenRouter and its model provider — their privacy rules apply to
        that request.
      </p>
      <h2>4. What Supabase stores (only when you log in)</h2>
      <ul>
        <li>Account: email + password handled by Supabase Auth (passwords are hashed). Session token lives in your browser.</li>
        <li>Profile: display name, age, email mirror — so the coach talks at your level.</li>
        <li>Locks: rule title, instruction, ON/OFF, priority — so they sync across devices.</li>
      </ul>
      <p>All are private to you — you can only see your own data. Demo without login stores nothing in Supabase.</p>
      <h2>5. What else stays in your browser only</h2>
      <p>
        Theme, sidebar, model choice, font size, and onboarding draft stay in localStorage on your
        device. Error reports contain only page + code — never chat text, never keys. Exports and
        screenshots always mask your key (for example <code>sk-or-...****1234</code>).
      </p>
      <h2>6. What we NEVER do</h2>
      <ul>
        <li>Never sell your data. Never show ads. Never share your key.</li>
        <li>Never store conversations or API keys on our servers.</li>
        <li>Never track chat content for analytics.</li>
      </ul>
      <h2>7. Under 13?</h2>
      <p>Ask a parent or teacher to help you create the OpenRouter key and your account. They can read our parents page too.</p>
      <h2>8. You are in control — delete everything</h2>
      <ul>
        <li>Remove key: Settings → Delete key (removes it from this device).</li>
        <li>Delete cloud data: Settings → Delete my account wipes your profile + locks. Type DELETE to confirm.</li>
        <li>Wipe this device: clear browser site data removes all chats + key stored locally. This cannot be undone.</li>
      </ul>
    </LegalShell>
  );
}
