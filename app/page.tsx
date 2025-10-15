"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Role = "user" | "assistant" | "system";

const quickPrompts = [
  "Who won IPL 2024 and by how many runs/wickets?",
  "Who was the Orange Cap winner in IPL 2024?",
  "List the top 3 wicket-takers in IPL 2024.",
  "Give a summary of the IPL 2025 auction highlights.",
  "Predict key players to watch in IPL 2025 and why.",
];

export default function IPLChat() {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState<
    {
      id: string;
      role: "user" | "ai";
      parts: { type: "text"; text: string }[];
    }[]
  >([]);

  const [status, setStatus] = useState<"idle" | "in_progress" | "done">("idle");

  useEffect(() => {
    // Auto-scroll to latest
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, status]);

  async function handleSend(text?: string) {
    const content = typeof text === "string" ? text : messageInput.trim();
    if (!content) return;

    // 1️⃣ Add user message
    const newUserMsg = {
      id: crypto.randomUUID(),
      role: "user" as const,
      parts: [{ type: "text" as const, text: content }],
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setMessageInput("");
    setStatus("in_progress");

    const newAssistantMsg = {
      id: crypto.randomUUID(),
      role: "ai" as const,
      parts: [{ type: "text" as const, text: "" }],
    };
    setMessages((prev) => [...prev, newAssistantMsg]);

    try {
   
      const res = await fetch("/api/ipl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: content }],
        }),
      });
      console.log(res, "res");
      if (!res.body) throw new Error("No response body from API");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        assistantText += chunk;

        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last.role === "ai") {
            last.parts = [{ type: "text", text: assistantText }];
          }
          return updated;
        });
      }

      setStatus("done");
    } catch (err) {
      console.error("Error streaming response:", err);
      setStatus("idle");
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl p-4 md:p-6 bg-neutral-900">
      <header className="mb-4 md:mb-6">
        <h1 className="text-balance text-2xl md:text-3xl font-semibold text-white">
          IPL Chatbot 2024 - 2025
        </h1>
        <p className=" mt-1 text-gray-300">
          Ask anything about the IPL 2024 and 2025 seasons. The assistant will
          only answer within this scope.
        </p>
      </header>

      <section aria-label="Quick prompts" className="mb-4">
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((p) => (
            <Button
              key={p}
              variant="secondary"
              size="sm"
              className=" text-white bg-blue-300 hover:bg-blue-500"
              onClick={() => handleSend(p)}
              disabled={status === "in_progress"}
            >
              {p}
            </Button>
          ))}
        </div>
      </section>

      <main
        ref={scrollRef}
        className="rounded-lg border  p-3 md:p-4 h-[55vh] bg-slate-950 overflow-y-auto"
        aria-label="Conversation"
      >
        <div className="flex flex-col gap-3">
          {messages.map((m) => (
            <MessageBubble key={m.id} role={m.role as Role}>
              {m.parts.map((part, idx) =>
                part.type === "text" ? <div key={idx}>{part.text}</div> : null
              )}
            </MessageBubble>
          ))}

          {status === "in_progress" && (
            <MessageBubble role="assistant" isLoading>
              Thinking...
            </MessageBubble>
          )}
        </div>
      </main>

      <form
        className="mt-4 flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        aria-label="Send message"
      >
        <Input
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder="Ask about IPL 2024 or 2025..."
          disabled={status === "in_progress"}
          aria-label="Message input"
          className="bg-neutral-800 text-white"
        />
        <Button
          type="submit"
          disabled={status === "in_progress" || !messageInput.trim()}
          className="bg-blue-500 text-white"
        >
          {status === "in_progress" ? (
            <div className="flex items-center gap-2">
              <Spinner />
              Sending
            </div>
          ) : (
            "Send"
          )}
        </Button>
      </form>
    </div>
  );
}

function MessageBubble({
  role,
  isLoading,
  children,
}: {
  role: Role;
  isLoading?: boolean;
  children: React.ReactNode;
}) {
  const isUser = role === "user";
  // Treat assistant as "System" label per user request to show system messages
  const label = isUser ? "You" : "System";

  return (
    <div
      className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[85%] md:max-w-[75%] rounded-lg px-3 py-2 text-sm shadow-sm",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        )}
        role="region"
        aria-label={`${label} message`}
      >
        <div className="mb-1 text-xs opacity-80">{label}</div>
        <div className="whitespace-pre-wrap leading-relaxed">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Spinner />
              <span>Thinking...</span>
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  // Token-friendly spinner (no hard colors)
  return (
    <div
      aria-label="Loading"
      className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent"
    />
  );
}
