import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { AIService } from "@/lib/ai/ai-service";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60s max pour le streaming

// POST /api/ai/chat — Envoyer un message à l'assistant IA (streaming SSE)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "Assistant IA non configuré" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { message, conversationId, stream: useStream = true } = body;

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: "Le message ne peut pas être vide" },
        { status: 400 }
      );
    }

    if (message.length > 5000) {
      return NextResponse.json(
        { error: "Message trop long (max 5000 caractères)" },
        { status: 400 }
      );
    }

    const tenantId = session.user.tenantId;
    const userId = session.user.id;

    // Mode streaming (SSE)
    if (useStream) {
      const { stream } = await AIService.chatStream(
        tenantId,
        userId,
        message.trim(),
        conversationId
      );

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Mode non-streaming (JSON)
    const response = await AIService.chat(
      tenantId,
      userId,
      message.trim(),
      conversationId
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erreur POST /api/ai/chat:", error);
    return NextResponse.json(
      { error: "Erreur lors de la communication avec l'assistant" },
      { status: 500 }
    );
  }
}

// GET /api/ai/chat — Lister les conversations
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    // Si conversationId fourni, retourner la conversation complète
    if (conversationId) {
      const conversation = await AIService.getConversation(
        conversationId,
        session.user.id
      );

      if (!conversation) {
        return NextResponse.json(
          { error: "Conversation non trouvée" },
          { status: 404 }
        );
      }

      return NextResponse.json({ conversation });
    }

    // Sinon, lister les conversations
    const conversations = await AIService.listConversations(session.user.id);
    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("Erreur GET /api/ai/chat:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des conversations" },
      { status: 500 }
    );
  }
}

// DELETE /api/ai/chat — Supprimer une conversation
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId requis" },
        { status: 400 }
      );
    }

    const deleted = await AIService.deleteConversation(
      conversationId,
      session.user.id
    );

    if (!deleted) {
      return NextResponse.json(
        { error: "Conversation non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE /api/ai/chat:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}
