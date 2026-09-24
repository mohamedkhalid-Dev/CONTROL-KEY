/** Stepper — dots 1-2-3-4 + progress bar + Back/Next handled by parent. */
export function Stepper({ step }: { step: number }) {
  const steps = ["Login", "Name", "Age", "Key"];
  return (
    <div aria-label="Onboarding progress">
      <div className="flex items-center justify-center gap-2">
        {steps.map((label, i) => {
          const n = i + 1;
          const active = n === step;
          const done = n < step;
          return (
            <div key={label} className="flex items-center gap-2">
              <div className="flex flex-col items-center">
                <span
                  aria-current={active ? "step" : undefined}
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-extrabold transition ${
                    done
                      ? "bg-[#16A34A] text-white"
                      : active
                        ? "bg-[#2563EB] text-white"
                        : "bg-[#E2E8F0] text-[#64748B]"
                  }`}
                >
                  {done ? "✓" : n}
                </span>
                <span
                  className={`mt-1 text-xs font-bold ${active ? "text-[#2563EB]" : "text-[#64748B]"}`}
                >
                  {label}
                </span>
              </div>
              {n < 4 && (
                <span
                  aria-hidden
                  className={`mb-5 h-1 w-10 rounded-full sm:w-16 ${n < step ? "bg-[#16A34A]" : "bg-[#E2E8F0]"}`}
                />
              )}
            </div>
          );
        })}
      </div>
      <div
        role="progressbar"
        aria-valuenow={step}
        aria-valuemin={1}
        aria-valuemax={4}
        className="mx-auto mt-4 h-2 max-w-md overflow-hidden rounded-full bg-[#E2E8F0]"
      >
        <div
          className="h-full rounded-full bg-[#2563EB] transition-all"
          style={{ width: `${(step / 4) * 100}%` }}
        />
      </div>
    </div>
  );
}
