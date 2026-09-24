PROJECT MAP
TECH ARCHITECTURE PROJECT

Required stack: **Frontend React (Next.js) + Backend Laravel + Database Supabase.** Maintainable, DRY, separated.

```
my-project/
├── frontend/                  # Next.js 14 (App Router) + React + Tailwind + shadcn/ui
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx              # Landing (/)
│   │   │   ├── onboarding/page.tsx   # /onboarding (3 steps)
│   │   │   ├── chat/page.tsx         # /chat (main app)
│   │   │   ├── guide/get-key/page.tsx
│   │   │   ├── privacy/page.tsx + terms/page.tsx + faq/page.tsx
│   │   │   ├── sitemap.xml/route.ts + robots.txt/route.ts
│   │   │   ├── layout.tsx (SEO meta, fonts, theme) + globals.css
│   │   ├── components/
│   │   │   ├── landing/ (Hero, HowItWorks, LiveDemo, RulesGallery, FAQ, Navbar, Footer)
│   │   │   ├── onboarding/ (Stepper, NameStep, AgeStep, KeyStep, KeyGuide)
│   │   │   ├── chat/ (Sidebar, ChatWindow, MessageBubble, ChatInput, ModelPicker, EmptyState)
│   │   │   ├── rules/ (RulesPanel, RuleCard, RuleModal, TemplateGallery, ConflictBanner)
│   │   │   └── ui/ (Button, Toggle, Modal, Toast, Tooltip — shadcn, DRY, no duplication)
│   │   ├── lib/
│   │   │   ├── supabaseClient.ts     # Supabase JS client (publishable key only)
│   │   │   ├── openrouter.ts         # OpenRouter calls, streaming, key validation
│   │   │   ├── promptBuilder.ts      # Builds un-overridable system prompt (pure fn, tested)
│   │   │   ├── storage.ts            # localStorage wrappers (key, sidebar, theme)
│   │   │   └── validators.ts         # name/age/key/rule validation (shared, no dup)
│   │   ├── hooks/ (useChats, useRules, useSidebar, useStreaming)
│   │   ├── public/ (key-illustration.svg, og-image.png, icons, screenshots)
│   └── package.json (node >=18 required)
│
├── backend/                   # Laravel 11 (API only, stateless)
│   ├── routes/api.php         # /api/validate-key, /api/chat (proxy), /api/feedback
│   ├── app/Http/Controllers/ (ChatController, KeyController, FeedbackController)
│   ├── app/Services/ (OpenRouterService, PromptBuilderService — mirrors frontend, DRY via shared spec)
│   ├── app/Models/ (thin — real storage in Supabase via PostgREST; Laravel validates + proxies to hide secrets)
│   └── .env (SUPABASE_URL, SUPABASE_SERVICE_KEY, OPENROUTER_REFERER — NEVER committed)
│
├── supabase/
│   ├── migrations/            # SQL migrations (profiles, sessions, messages, rules...)
│   └── seed.sql (rule_templates seed)
│
├── README.md + .gitignore + sitemap.xml + robots.txt (mirrored in frontend/public)