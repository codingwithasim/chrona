"use client";

import { type FormEvent, useState } from "react";
import {
  Bug,
  Check,
  Coffee,
  Lightbulb,
  Loader2,
  Mail,
  MessageSquare,
  Send,
} from "lucide-react";
import { BsGithub } from "react-icons/bs";
import { FaLinkedinIn, FaXTwitter } from "react-icons/fa6";

import { ToolFrame } from "@/components/shell/tool-frame";
import { Button } from "@/components/ui/button";
import { COFFEE_URL } from "@/lib/links";
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
    color: "var(--ember)",
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
    label: "Just saying hi",
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
        throw new Error(result.error || "Your message could not be sent.");
      }

      setSubmissionState("success");
      setMessage("");
      setEmail("");
      setWebsite("");

      say({ text: "Delivered! Thank you~ Every message gets read." });
    } catch (caughtError) {
      setSubmissionState("error");
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Your message could not be sent."
      );
    }
  }

  return (
    <ToolFrame href="/feedback" className="max-w-xl">
      {submissionState === "success" ? (
        <div className="flex flex-col items-center py-12 text-center animate-in fade-in-0 duration-700">
          <span className="grid size-14 place-items-center rounded-full bg-foreground/[0.06]">
            <Check className="size-6 text-foreground/70" strokeWidth={1.6} />
          </span>

          <h2 className="mt-6 text-lg font-medium">Message sent</h2>
          <p className="mt-1 text-[11px] tracking-[0.3em] text-muted-foreground/70">ありがとう</p>

          <p className="mt-4 max-w-xs text-[13px] leading-6 text-muted-foreground">
            Thank you for helping make Chrona better. If you left an
            email, you&apos;ll hear back soon.
          </p>

          <Button
            variant="ghost"
            className="mt-6 rounded-full px-5"
            onClick={() => setSubmissionState("idle")}
          >
            Write another
          </Button>
        </div>
      ) : (
        <form className="space-y-6" onSubmit={handleSubmit}>
          <p className="text-[13px] leading-6 text-muted-foreground">
            Found a bug, have an idea, or just want to say hi? I read
            every message.
          </p>

          <fieldset>
            <legend className="sr-only">What is it about?</legend>
            <div className="flex flex-wrap gap-1.5">
              {feedbackTypes.map(({ value, label, icon: Icon, color }) => {
                const active = type === value;

                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setType(value)}
                    className={cn(
                      "flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] transition-colors duration-300",
                      active
                        ? "bg-foreground/[0.08] text-foreground"
                        : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                    )}
                  >
                    <Icon className="size-3.5" strokeWidth={1.8} style={active ? { color } : undefined} />
                    {label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="relative">
            <label htmlFor="feedback-message" className="sr-only">
              Your message
            </label>
            <textarea
              id="feedback-message"
              value={message}
              maxLength={2000}
              rows={7}
              required
              placeholder={placeholders[type]}
              onChange={(event) => {
                setMessage(event.target.value);

                if (error) {
                  setError(null);
                }
              }}
              className="block w-full resize-none rounded-2xl border border-foreground/10 bg-foreground/[0.03] px-4 py-3.5 text-[14px] leading-6 transition-colors duration-300 outline-none placeholder:text-muted-foreground/60 focus:border-foreground/25 focus:bg-foreground/[0.045]"
            />
            <span className="pointer-events-none absolute right-4 bottom-3 text-[10px] text-muted-foreground/60 tabular-nums">
              {message.length}/2000
            </span>
          </div>

          <div>
            <label htmlFor="feedback-email" className="sr-only">
              Your email (optional)
            </label>
            <input
              id="feedback-email"
              type="email"
              value={email}
              maxLength={254}
              autoComplete="email"
              placeholder="Your email, if you'd like a reply"
              onChange={(event) => setEmail(event.target.value)}
              className="block h-11 w-full rounded-2xl border border-foreground/10 bg-foreground/[0.03] px-4 text-[14px] transition-colors duration-300 outline-none placeholder:text-muted-foreground/60 focus:border-foreground/25 focus:bg-foreground/[0.045]"
            />
            <p className="mt-2 px-1 text-[11px] text-muted-foreground/70">
              Optional, and never used for anything else.
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
            <p role="alert" className="px-1 text-[13px] text-destructive">
              {error}
            </p>
          )}

          <div className="flex justify-end">
            <Button
              type="submit"
              className="h-11 rounded-full px-6"
              disabled={submissionState === "submitting"}
            >
              {submissionState === "submitting" ? (
                <>
                  <Loader2 className="animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  Send
                  <Send className="size-3.5" strokeWidth={1.8} />
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {/* Elsewhere: quiet links, and a coffee */}
      <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-foreground/[0.06] pt-5">
        <div className="flex items-center gap-0.5">
          {socialLinks.map(({ label, href, icon: Icon }) => {
            const isExternal = href.startsWith("http");

            return (
              <a
                key={label}
                href={href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noreferrer" : undefined}
                aria-label={label}
                title={label}
                className="grid size-9 place-items-center rounded-full text-foreground/50 transition-colors duration-300 hover:bg-foreground/5 hover:text-foreground"
              >
                <Icon className="size-[15px]" />
              </a>
            );
          })}
        </div>

        <a
          href={COFFEE_URL}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-full bg-[#f6e3c4] px-4 py-2 text-[13px] text-[#4a3424] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#f3d9b0]"
        >
          <Coffee className="size-4" strokeWidth={1.8} />
          Buy me a coffee
        </a>
      </footer>
    </ToolFrame>
  );
}
