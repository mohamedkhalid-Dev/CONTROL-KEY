"use client";

import { Input } from "@/components/ui/Input";
import { validateAge } from "@/lib/validators";

export function AgeStep({
  age,
  setAge,
}: {
  age: number;
  setAge: (v: number) => void;
}) {
  const result = validateAge(age);
  const invalid = !result.ok;
  // Slider stays within bounds for usability; typing accepts any 1-120 value.
  const sliderValue = Number.isFinite(age) ? Math.min(120, Math.max(1, age)) : 14;

  return (
    <div>
      <h2 className="font-heading text-2xl font-extrabold text-[#0F172A] dark:text-white">
        How old are you?
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        We adjust words to your age.
      </p>
      <div className="mt-6">
        <label
          htmlFor="age-slider"
          className="mb-2 block text-center text-5xl font-extrabold text-[#4F46E5]"
        >
          {Number.isFinite(age) ? age : "–"}
          <span className="text-lg text-slate-500"> yrs</span>
        </label>
        <input
          id="age-slider"
          type="range"
          min={1}
          max={120}
          step={1}
          value={sliderValue}
          onChange={(e) => setAge(Number(e.target.value))}
          aria-label="Pick your age"
          className="h-3 w-full accent-[#4F46E5]"
        />
        <div className="mt-4">
          <Input
            label="Or type your age"
            type="number"
            inputMode="numeric"
            min={1}
            max={120}
            value={Number.isFinite(age) ? String(age) : ""}
            onChange={(e) =>
              setAge(e.target.value === "" ? NaN : Number(e.target.value))
            }
            error={invalid ? result.error : undefined}
          />
        </div>
      </div>
    </div>
  );
}
