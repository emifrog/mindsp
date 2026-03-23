"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAIChat, AIMessage } from "@/hooks/use-ai-chat";
import { DEFAULT_SUGGESTIONS } from "@/lib/ai/prompts";

interface AIChatPanelProps {
  className?: string;
  fullPage?: boolean;
}

export function AIChatPanel({ className, fullPage = false }: AIChatPanelProps) {
  const {
    messages,
    isLoading,
    conversationId,
    sendMessage,
    newConversation,
    loadConversation,
    conversations,
    loadConversations,
    deleteConversation,
  } = useAIChat();

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Charger les conversations au montage (page complète uniquement)
  useEffect(() => {
    if (fullPage) {
      loadConversations();
    }
  }, [fullPage, loadConversations]);

  // Auto-scroll vers le bas
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const msg = input;
    setInput("");
    await sendMessage(msg);
    inputRef.current?.focus();
  };

  const handleSuggestion = async (text: string) => {
    await sendMessage(text);
  };

  return (
    <div className={cn("flex h-full", className)}>
      {/* Sidebar conversations (page complète uniquement) */}
      {fullPage && (
        <div className="hidden md:flex w-64 flex-col border-r bg-muted/30">
          <div className="p-3 border-b">
            <Button
              onClick={newConversation}
              variant="outline"
              size="sm"
              className="w-full gap-2"
            >
              <Plus className="h-4 w-4" />
              Nouvelle conversation
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm cursor-pointer hover:bg-muted transition-colors group",
                    conversationId === conv.id && "bg-muted"
                  )}
                  onClick={() => loadConversation(conv.id)}
                >
                  <Bot className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate flex-1">
                    {conv.title || "Conversation"}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conv.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {conversations.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Aucune conversation
                </p>
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Zone de chat principale */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Assistant IA</h3>
              <p className="text-xs text-muted-foreground">
                Posez vos questions sur le SDIS
              </p>
            </div>
          </div>
          {!fullPage && (
            <Button
              variant="ghost"
              size="sm"
              onClick={newConversation}
              className="gap-1"
            >
              <Plus className="h-3 w-3" />
              Nouveau
            </Button>
          )}
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className={cn(
            "flex-1 overflow-y-auto p-4 space-y-4",
            fullPage ? "max-h-[calc(100vh-220px)]" : "max-h-[400px]"
          )}
        >
          {messages.length === 0 ? (
            <EmptyState onSuggestion={handleSuggestion} />
          ) : (
            messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))
          )}
          {isLoading &&
            messages[messages.length - 1]?.role === "assistant" &&
            messages[messages.length - 1]?.content === "" && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Réflexion en cours...</span>
              </div>
            )}
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="border-t p-3 flex items-center gap-2"
        >
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Posez votre question..."
            disabled={isLoading}
            className="flex-1"
            autoFocus
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: AIMessage }) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Bot className="h-4 w-4 text-primary" />
        </div>
      )}
      <div
        className={cn(
          "rounded-lg px-4 py-2 max-w-[80%] text-sm",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted",
          message.isStreaming && "animate-pulse"
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div
            className="prose prose-sm dark:prose-invert max-w-none [&_table]:text-xs [&_table]:my-2 [&_th]:px-2 [&_td]:px-2"
            dangerouslySetInnerHTML={{
              __html: formatMarkdown(message.content),
            }}
          />
        )}
      </div>
      {isUser && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}

function EmptyState({
  onSuggestion,
}: {
  onSuggestion: (text: string) => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 py-8">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Bot className="h-8 w-8 text-primary" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-lg">Assistant IA MindSP</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Posez vos questions sur les FMPA, le personnel, les formations...
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
        {DEFAULT_SUGGESTIONS.slice(0, 4).map((suggestion) => (
          <button
            key={suggestion.text}
            onClick={() => onSuggestion(suggestion.text)}
            className="flex items-center gap-2 rounded-lg border p-3 text-left text-sm hover:bg-muted transition-colors"
          >
            <span>{suggestion.icon}</span>
            <span className="text-muted-foreground">{suggestion.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Conversion basique Markdown → HTML
 * (gras, italique, liens, tableaux, listes)
 */
function formatMarkdown(text: string): string {
  if (!text) return "";

  return (
    text
      // Tableaux
      .replace(
        /\|(.+)\|\n\|[-| ]+\|\n((?:\|.+\|\n?)*)/g,
        (_, header, body) => {
          const headers = header
            .split("|")
            .map((h: string) => h.trim())
            .filter(Boolean);
          const rows = body
            .trim()
            .split("\n")
            .map((row: string) =>
              row
                .split("|")
                .map((c: string) => c.trim())
                .filter(Boolean)
            );

          let html = '<table class="border-collapse border"><thead><tr>';
          headers.forEach(
            (h: string) =>
              (html += `<th class="border px-2 py-1 bg-muted font-medium">${h}</th>`)
          );
          html += "</tr></thead><tbody>";
          rows.forEach((row: string[]) => {
            html += "<tr>";
            row.forEach(
              (c: string) =>
                (html += `<td class="border px-2 py-1">${c}</td>`)
            );
            html += "</tr>";
          });
          html += "</tbody></table>";
          return html;
        }
      )
      // Gras
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      // Italique
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      // Liens
      .replace(
        /\[(.+?)\]\((.+?)\)/g,
        '<a href="$2" class="text-primary underline">$1</a>'
      )
      // Listes
      .replace(/^- (.+)$/gm, "<li>$1</li>")
      .replace(/(<li>.*<\/li>\n?)+/g, '<ul class="list-disc pl-4 my-1">$&</ul>')
      // Paragraphes
      .replace(/\n\n/g, "</p><p>")
      .replace(/\n/g, "<br/>")
      .replace(/^(.+)$/, "<p>$1</p>")
  );
}
