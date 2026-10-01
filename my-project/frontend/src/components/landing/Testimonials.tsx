const QUOTES = [
  {
    name: "Layth, 13",
    text: "I stopped copying answers. My math went up.",
    badge: "7 days consistent",
  },
  {
    name: "Mohammed, 17",
    text: "AI quizzes me now. I feel ready for exams.",
    badge: "Improved recall",
  },
  {
    name: "Omar, 20",
    text: "Focus mode works. No more late-night distractions.",
    badge: "4.9 rating",
  },
];

/** Social proof — short, professional. Light Mode. */
export function Testimonials() {
  return (
    <section aria-label="What students say" className="bg-[#F8FAFC] py-16 md:py-24">
      <div className="ck-container">
        <h2 className="font-heading text-center text-3xl font-extrabold text-[#111827]">
          Students stay in control
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {QUOTES.map((q) => (
            <figure key={q.name} className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_2px_rgba(17,24,39,0.06)]">
              <blockquote className="text-sm leading-relaxed text-[#111827]">
                &ldquo;{q.text}&rdquo;
              </blockquote>
              <figcaption className="mt-4 flex items-center justify-between">
                <span className="text-sm font-bold text-[#111827]">
                  {q.name}
                </span>
                <span className="rounded-full bg-[#EFF6FF] px-2.5 py-1 text-xs font-bold text-[#2563EB]">
                  {q.badge}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
