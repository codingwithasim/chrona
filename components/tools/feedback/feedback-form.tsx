"use client";

import { type FormEvent, useState } from "react";
import {
  Bug,
  ExternalLink,
  Lightbulb,
  Loader2,
  Mail,
  MessageSquare,
  Send,
  Sparkles,
} from "lucide-react";
import { BsGithub } from "react-icons/bs";
import { FaLinkedinIn, FaXTwitter } from "react-icons/fa6";

import { ToolFrame } from "@/components/shell/tool-frame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { say } from "@/stores/dialogue-store";

type FeedbackType = "bug" | "improvement" | "other";

type SubmissionState = "idle" | "submitting" | "success" | "error";

const feedbackTypes = [
  {
    value: "bug",
    label: "Bug",
    jp: "バグ",
    description: "Something broke",
    icon: Bug,
    color: "var(--sakura)",
  },
  {
    value: "improvement",
    label: "Idea",
    jp: "アイデア",
    description: "Make it better",
    icon: Lightbulb,
    color: "var(--honey)",
  },
  {
    value: "other",
    label: "Other",
    jp: "そのほか",
    description: "Just saying hi",
    icon: MessageSquare,
    color: "var(--mint)",
  },
] satisfies Array<{
  value: FeedbackType;
  label: string;
  jp: string;
  description: string;
  icon: typeof Bug;
  color: string;
}>;

const placeholders: Record<FeedbackType, string> = {
  bug: "What happened? What did you expect, and what steps led there?",
  improvement: "What would you like Chrona to do differently?",
  other: "Share anything on your mind…",
};

const socialLinks = [
  {
    label: "GitHub",
    description: "View the project",
    href: "https://github.com/codingwithasim",
    icon: BsGithub,
  },
  {
    label: "LinkedIn",
    description: "Connect on LinkedIn",
    href: "https://www.linkedin.com/in/codingwithasim",
    icon: FaLinkedinIn,
  },
  {
    label: "Twitter",
    description: "Follow project updates",
    href: "https://x.com/codingwithasim",
    icon: FaXTwitter,
  },
  {
    label: "Email",
    description: "Contact me directly",
    href: "mailto:asim.dev.pro@gmail.com",
    icon: Mail,
  },
];

function Envelope() {
  return (
    <svg viewBox="0 0 160 110" className="w-40 float-soft" aria-hidden="true">
      <rect x="6" y="14" width="148" height="90" rx="10" fill="var(--card)" stroke="var(--ink)" strokeWidth="3" />
      <path d="M8 20 L80 66 L152 20" fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinejoin="round" />
      <path d="M8 100 L62 56 M152 100 L98 56" stroke="var(--ink)" strokeWidth="2.5" opacity="0.5" />
      <circle cx="80" cy="66" r="13" fill="var(--sakura)" stroke="var(--ink)" strokeWidth="2.5" />
      <path d="M80 72 C 72 66 74 60 78 61 C 79 61 80 62 80 63 C 80 62 81 61 82 61 C 86 60 88 66 80 72 Z" fill="#fff" />
    </svg>
  );
}

export function FeedbackForm() {
  const [type, setType] = useState<FeedbackType>("bug");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [submissionState, setSubmissionState] = useState<SubmissionState>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedMessage = message.trim();

    if (normalizedMessage.length < 10) {
      setError("Please write at least 10 characters.");
      return;
    }

    setSubmissionState("submitting");
    setError(null);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          message: normalizedMessage,
          email: email.trim(),
          website,
          page: window.location.pathname,
          userAgent: window.navigator.userAgent,
        }),
      });

      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error || "Feedback could not be sent.");
      }

      setSubmissionState("success");
      setMessage("");
      setEmail("");
      setWebsite("");

      say({ text: "Delivered! Thank you for the letter~ We read every one." });
    } catch (caughtError) {
      setSubmissionState("error");
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Feedback could not be sent."
      );
    }
  }

  if (submissionState === "success") {
    return (
      <ToolFrame href="/feedback">
        <div className="flex flex-col items-center py-10 text-center">
          <Envelope />

          <h2 className="mt-6 font-display text-2xl">Letter sent!</h2>
          <p className="mt-1 text-xs font-bold tracking-[0.3em] text-muted-foreground">
            おてがみ ありがとう
          </p>

          <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
            Thank you for helping make Chrona cozier. Your letter
            has been received.
          </p>

          <Button
            variant="outline"
            className="mt-6"
            onClick={() => setSubmissionState("idle")}
          >
            Write another letter
          </Button>
        </div>
      </ToolFrame>
    );
  }

  return (
    <ToolFrame href="/feedback" className="max-w-5xl">
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <fieldset className="space-y-3">
            <legend className="text-sm font-bold">
              What&apos;s your letter about?
            </legend>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {feedbackTypes.map(({ value, label, jp, description, icon: Icon, color }) => {
                const active = type === value;

                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setType(value)}
                    className={cn(
                      "relative flex flex-col items-center gap-1 rounded-xl border border-dashed p-3 text-center transition-all",
                      active
                        ? "-rotate-1 border-black/10 text-[#1b1530] shadow-cel"
                        : "border-border hover:-translate-y-0.5 hover:bg-muted"
                    )}
                    style={active ? { backgroundColor: color } : undefined}
                  >
                    <Icon className="size-5" />
                    <span className="text-sm font-bold">{label}</span>
                    <span className="hidden text-[11px] opacity-75 sm:block">
                      {description}
                    </span>
                    <span className="absolute top-1.5 right-2 text-[9px] font-bold opacity-60">
                      {jp}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="feedback-message" className="text-sm font-bold">
                Your letter
              </label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {message.length}/2000
              </span>
            </div>

            <div className="rounded-2xl border border-(--panel-line) bg-[#fffaf0] p-4 text-[#3b2e4a] shadow-cel-sm">
              <p className="font-display text-sm text-[#7f6e93]">Dear Chrona,</p>
              <textarea
                id="feedback-message"
                value={message}
                maxLength={2000}
                rows={8}
                required
                placeholder={placeholders[type]}
                onChange={(event) => {
                  setMessage(event.target.value);

                  if (error) {
                    setError(null);
                  }
                }}
                className="paper-lines mt-1 w-full resize-none bg-transparent text-[15px] outline-none placeholder:text-[#a497b4]"
              />
            </div>

            <p className="text-xs leading-5 text-muted-foreground">
              For bugs, mention the tool you were using and whether
              you were on mobile or desktop.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="feedback-email" className="text-sm font-bold">
              Signed,
              <span className="ml-1 font-normal text-muted-foreground">
                your email (optional)
              </span>
            </label>

            <Input
              id="feedback-email"
              type="email"
              value={email}
              maxLength={254}
              autoComplete="email"
              placeholder="you@example.com"
              onChange={(event) => setEmail(event.target.value)}
            />

            <p className="text-xs leading-5 text-muted-foreground">
              Only if you&apos;d like a reply. It&apos;s never used for marketing.
            </p>
          </div>

          {/* Spam honeypot */}
          <div aria-hidden="true" className="absolute -left-[9999px]">
            <label htmlFor="website">Website</label>
            <input
              id="website"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
            />
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm font-bold text-destructive"
            >
              {error}
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full sm:w-auto"
            disabled={submissionState === "submitting"}
          >
            {submissionState === "submitting" ? (
              <>
                <Loader2 className="animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Send />
                Send letter
              </>
            )}
          </Button>
        </form>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card/50 p-4">
            <h2 className="font-display text-sm">Say hello</h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Follow Chrona updates or reach the developer directly.
            </p>

            <div className="mt-3 space-y-1">
              {socialLinks.map(({ label, description, href, icon: Icon }) => {
                const isExternal = href.startsWith("http");

                return (
                  <a
                    key={label}
                    href={href}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noreferrer" : undefined}
                    className="group flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-black/10 bg-card dark:border-border">
                      <Icon className="size-4" />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold">{label}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {description}
                      </span>
                    </span>

                    {isExternal && (
                      <ExternalLink className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    )}
                  </a>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-border p-4">
            <h2 className="flex items-center gap-2 font-display text-sm">
              <Sparkles className="size-4 text-honey" />
              Helpful letters
            </h2>
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-5 text-muted-foreground">
              <li>Describe what you expected to happen.</li>
              <li>Name the tool where it happened.</li>
              <li>Mention mobile or desktop.</li>
            </ul>
          </div>
        </aside>
      </div>
    </ToolFrame>
  );
}
