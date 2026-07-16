import { useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowUp, Braces, Database, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { ExtractedMemory } from "@/types/api";
import type { Message } from "@/types/memory";

interface ChatPanelProps {
  onMessageSent?: () => void;
  onNeedsApiKey?: () => void;
}

export function ChatPanel({ onMessageSent, onNeedsApiKey }: ChatPanelProps) {
  const { user, updateUsageFromChat } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useSWR("/memories", () => api.getMemories(), { refreshInterval: 5000 });

  useEffect(() => {
    async function loadChatHistory() {
      if (!user) {
        setIsLoadingHistory(false);
        return;
      }

      try {
        setHistoryError(false);
        const history = await api.getChatHistory();
        const loadedMessages: Message[] = history.messages.map((message) => ({
          role: message.role,
          content: message.content,
          timestamp: message.created_at,
          extractedMemories: message.extracted_memories ? {
            semantic: (message.extracted_memories.semantic || []).map((memory: ExtractedMemory) => ({
              id: memory.id,
              local_id: memory.local_id,
              text: memory.text,
              type: memory.type
            })),
            bubbles: (message.extracted_memories.bubbles || []).map((memory: ExtractedMemory) => ({
              id: memory.id,
              local_id: memory.local_id,
              text: memory.text,
              type: memory.type
            }))
          } : undefined
        }));
        setMessages(loadedMessages);
      } catch {
        setHistoryError(true);
      } finally {
        setIsLoadingHistory(false);
      }
    }

    void loadChatHistory();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await api.chat(userMessage.content);
      setMessages((current) => [...current, {
        role: "assistant",
        content: response.response,
        timestamp: new Date().toISOString(),
        extractedMemories: response.extracted_memories
      }]);

      if (response.usage) updateUsageFromChat(response.usage);

      const { semantic, bubbles } = response.extracted_memories;
      if (semantic.length > 0 || bubbles.length > 0) {
        const extracted = [
          semantic.length ? `${semantic.length} semantic` : "",
          bubbles.length ? `${bubbles.length} episodic` : ""
        ].filter(Boolean).join(" · ");
        toast.success(`Memory updated: ${extracted}`, { duration: 4000 });
      }

      await mutate("/memories");
      onMessageSent?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send message";
      if (message === "API_KEY_REQUIRED") {
        toast.error("Your included messages are complete. Add an OpenRouter key to continue.");
        onNeedsApiKey?.();
      } else {
        toast.error(message);
      }
      setMessages((current) => current.slice(0, -1));
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  }

  return (
    <div className="chat-observatory">
      <header className="chat-observatory__header">
        <div>
          <span className="chat-observatory__eyebrow">Conversation stream</span>
          <h1>Working dialogue</h1>
        </div>
        <span className="chat-observatory__status"><i /> Recording context</span>
      </header>

      <div className="chat-observatory__messages" aria-live="polite">
        {isLoadingHistory ? (
          <ChatState icon={<Loader2 className="animate-spin" size={20} />} title="Loading the conversation" copy="Rebuilding the latest context stream." />
        ) : historyError ? (
          <ChatState icon={<AlertCircle size={20} />} title="Conversation unavailable" copy="The saved history could not be loaded. Refresh to try again." tone="error" />
        ) : messages.length === 0 ? (
          <div className="chat-empty">
            <div className="chat-empty__mark"><Database size={20} /></div>
            <p className="section-kicker">No context recorded</p>
            <h2>Tell the agent something worth remembering.</h2>
            <p>Preferences, ongoing work, decisions, and events will appear in the memory field as the conversation develops.</p>
            <div className="chat-empty__examples">
              <span>“I deploy on Neon.”</span>
              <span>“I prefer TypeScript.”</span>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <article className={cn("chat-turn message-enter", message.role === "user" ? "chat-turn--user" : "chat-turn--assistant")} key={`${message.timestamp}-${index}`}>
                <div className="chat-turn__meta">
                  <span>{message.role === "user" ? "YOU" : "AGENT"}</span>
                  <time>{message.timestamp ? formatRelativeTime(message.timestamp) : ""}</time>
                </div>
                <div className="chat-turn__content"><p>{message.content}</p></div>
                {message.role === "assistant" && message.extractedMemories && (
                  <div className="chat-turn__extractions">
                    {message.extractedMemories.semantic.length > 0 && (
                      <span className="is-semantic"><Braces size={12} /> Semantic {message.extractedMemories.semantic.map((memory) => `#${memory.local_id}`).join(", ")}</span>
                    )}
                    {message.extractedMemories.bubbles.length > 0 && (
                      <span className="is-episodic"><Sparkles size={12} /> Episodic {message.extractedMemories.bubbles.map((memory) => `#${memory.local_id}`).join(", ")}</span>
                    )}
                  </div>
                )}
              </article>
            ))}

            {isLoading && (
              <article className="chat-turn chat-turn--assistant message-enter">
                <div className="chat-turn__meta"><span>AGENT</span><time>Now</time></div>
                <div className="chat-turn__thinking"><span /><span /><span /> Retrieving and reasoning</div>
              </article>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <footer className="chat-composer">
        {user && !user.usage.has_api_key && (
          <div className="chat-composer__usage">
            <span>Included usage</span>
            <div><i style={{ width: `${(user.usage.free_messages_remaining / user.usage.free_message_limit) * 100}%` }} /></div>
            <strong>{user.usage.free_messages_remaining}/{user.usage.free_message_limit}</strong>
          </div>
        )}
        <div className="chat-composer__input">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add to the conversation..."
            disabled={isLoading}
            rows={1}
            aria-label="Message"
          />
          <button type="button" onClick={() => void handleSend()} disabled={!input.trim() || isLoading} aria-label="Send message">
            {isLoading ? <Loader2 size={17} className="animate-spin" /> : <ArrowUp size={17} />}
          </button>
        </div>
        <p>Enter to send · Shift + Enter for a new line</p>
      </footer>
    </div>
  );
}

function ChatState({ icon, title, copy, tone }: { icon: React.ReactNode; title: string; copy: string; tone?: "error" }) {
  return <div className={cn("chat-state", tone === "error" && "chat-state--error")}>{icon}<strong>{title}</strong><p>{copy}</p></div>;
}
