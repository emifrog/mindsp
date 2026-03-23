/**
 * Service IA — Interface avec OpenRouter (modèles gratuits ou payants)
 *
 * Utilise le SDK OpenAI avec baseURL OpenRouter.
 * Gère le streaming SSE et l'historique des conversations.
 *
 * Modèles gratuits recommandés :
 * - meta-llama/llama-4-maverick:free
 * - google/gemini-2.0-flash-exp:free
 * - mistralai/mistral-small-3.1-24b-instruct:free
 */

import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { SYSTEM_PROMPT } from "./prompts";
import { buildContext } from "./context-builder";

// Lazy init
let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is required");
    }
    _client = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey,
      defaultHeaders: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://mindsp.vercel.app",
        "X-Title": "MindSP Assistant",
      },
    });
  }
  return _client;
}

const MODEL = process.env.AI_MODEL || "google/gemma-3-27b-it:free";
const MAX_TOKENS = parseInt(process.env.AI_MAX_TOKENS || "4096");

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  content: string;
  tokensUsed: number;
  conversationId: string;
}

export class AIService {
  /**
   * Envoyer un message et recevoir une réponse (non-streaming)
   */
  static async chat(
    tenantId: string,
    userId: string,
    message: string,
    conversationId?: string
  ): Promise<ChatResponse> {
    const context = await buildContext(tenantId, message);
    const history = conversationId
      ? await this.loadHistory(conversationId)
      : [];

    const client = getClient();
    const response = await client.chat.completions.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [
        { role: "system", content: SYSTEM_PROMPT + context },
        ...history.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        { role: "user", content: message },
      ],
    });

    const assistantContent = response.choices[0]?.message?.content || "";
    const tokensUsed =
      (response.usage?.prompt_tokens || 0) +
      (response.usage?.completion_tokens || 0);

    const convId = await this.saveMessages(
      tenantId,
      userId,
      conversationId,
      message,
      assistantContent,
      tokensUsed
    );

    return {
      content: assistantContent,
      tokensUsed,
      conversationId: convId,
    };
  }

  /**
   * Envoyer un message et streamer la réponse (SSE)
   */
  static async chatStream(
    tenantId: string,
    userId: string,
    message: string,
    conversationId?: string
  ): Promise<{
    stream: ReadableStream;
    conversationIdPromise: Promise<string>;
  }> {
    const context = await buildContext(tenantId, message);
    const history = conversationId
      ? await this.loadHistory(conversationId)
      : [];

    const client = getClient();

    let fullContent = "";
    let tokensUsed = 0;

    let resolveConvId: (id: string) => void;
    const conversationIdPromise = new Promise<string>((resolve) => {
      resolveConvId = resolve;
    });

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const completion = await client.chat.completions.create({
            model: MODEL,
            max_tokens: MAX_TOKENS,
            stream: true,
            messages: [
              { role: "system", content: SYSTEM_PROMPT + context },
              ...history.map((m) => ({
                role: m.role as "user" | "assistant",
                content: m.content,
              })),
              { role: "user", content: message },
            ],
          });

          for await (const chunk of completion) {
            const text = chunk.choices[0]?.delta?.content;
            if (text) {
              fullContent += text;
              controller.enqueue(
                new TextEncoder().encode(
                  `data: ${JSON.stringify({ text })}\n\n`
                )
              );
            }

            // Récupérer les tokens utilisés (dernier chunk)
            if (chunk.usage) {
              tokensUsed =
                (chunk.usage.prompt_tokens || 0) +
                (chunk.usage.completion_tokens || 0);
            }
          }

          // Sauvegarder après streaming complet
          const convId = await AIService.saveMessages(
            tenantId,
            userId,
            conversationId,
            message,
            fullContent,
            tokensUsed
          );

          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({ done: true, conversationId: convId, tokensUsed })}\n\n`
            )
          );
          resolveConvId!(convId);
          controller.close();
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : "Erreur inconnue";
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({ error: errorMsg })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return { stream, conversationIdPromise };
  }

  /**
   * Charger l'historique d'une conversation (derniers 20 messages)
   */
  private static async loadHistory(
    conversationId: string
  ): Promise<ChatMessage[]> {
    const messages = await prisma.aIMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      take: 20,
      select: { role: true, content: true },
    });

    return messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
  }

  /**
   * Sauvegarder les messages dans la conversation
   */
  private static async saveMessages(
    tenantId: string,
    userId: string,
    conversationId: string | undefined,
    userMessage: string,
    assistantMessage: string,
    tokensUsed: number
  ): Promise<string> {
    let convId = conversationId;

    if (!convId) {
      const title =
        userMessage.length > 60
          ? userMessage.substring(0, 60) + "..."
          : userMessage;

      const conversation = await prisma.aIConversation.create({
        data: { userId, tenantId, title },
      });
      convId = conversation.id;
    }

    await prisma.aIMessage.createMany({
      data: [
        {
          conversationId: convId,
          role: "user",
          content: userMessage,
          tokensUsed: 0,
        },
        {
          conversationId: convId,
          role: "assistant",
          content: assistantMessage,
          tokensUsed,
        },
      ],
    });

    await prisma.aIConversation.update({
      where: { id: convId },
      data: { updatedAt: new Date() },
    });

    return convId;
  }

  /**
   * Lister les conversations d'un utilisateur
   */
  static async listConversations(userId: string, limit: number = 20) {
    return prisma.aIConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: limit,
      include: {
        _count: { select: { messages: true } },
      },
    });
  }

  /**
   * Récupérer une conversation complète
   */
  static async getConversation(conversationId: string, userId: string) {
    return prisma.aIConversation.findFirst({
      where: { id: conversationId, userId },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    });
  }

  /**
   * Supprimer une conversation
   */
  static async deleteConversation(conversationId: string, userId: string) {
    const conv = await prisma.aIConversation.findFirst({
      where: { id: conversationId, userId },
    });
    if (!conv) return false;

    await prisma.aIMessage.deleteMany({ where: { conversationId } });
    await prisma.aIConversation.delete({ where: { id: conversationId } });
    return true;
  }
}
