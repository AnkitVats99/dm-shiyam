// app/api/webhook/instagram/route.ts
// Fixed version — DMs now send correctly

import { NextRequest, NextResponse } from "next/server";
import { sendDM, replyToComment, personalizeMessage } from "@/lib/instagram";
// adjust this import to match your actual db module:
import { getActiveAutomations, logActivity } from "@/lib/db";

const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN!;
const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN!;
const IG_ACCOUNT_ID = process.env.INSTAGRAM_ACCOUNT_ID!;

// ─── GET — webhook verification handshake ───────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("[webhook] Verification successful");
    return new NextResponse(challenge, { status: 200 });
  }

  console.error("[webhook] Verification failed — token mismatch");
  return new NextResponse("Forbidden", { status: 403 });
}

// ─── POST — incoming events ──────────────────────────────────────────
export async function POST(req: NextRequest) {
  let body: WebhookPayload;
  try {
    body = await req.json();
  } catch {
    return new NextResponse("Bad Request", { status: 400 });
  }

  // Acknowledge immediately (Instagram requires < 5 s response)
  processWebhookAsync(body).catch((err) =>
    console.error("[webhook] Async processing error:", err)
  );

  return new NextResponse("EVENT_RECEIVED", { status: 200 });
}

// ─── Core processing ─────────────────────────────────────────────────
async function processWebhookAsync(body: WebhookPayload) {
  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "comments") continue;

      const value = change.value;

      // FIX: The sender's Instagram-scoped user ID lives at value.from.id
      // This is what you MUST pass to sendDM — not the username, not the text
      const senderId: string | undefined = value?.from?.id;
      const senderUsername: string = value?.from?.username ?? "there";
      const commentText: string = value?.text ?? "";
      const commentId: string = value?.id ?? "";

      if (!senderId) {
        console.warn("[webhook] No sender ID in payload — skipping:", JSON.stringify(value));
        continue;
      }

      console.log(`[webhook] Comment from @${senderUsername} (${senderId}): "${commentText}"`);

      const automations = await getActiveAutomations();

      for (const automation of automations) {
        const keywords: string[] = automation.trigger_keywords
          .split(",")
          .map((k: string) => k.trim().toLowerCase())
          .filter(Boolean);

        const lowerComment = commentText.toLowerCase();
        const matchedKeyword = keywords.find((kw) => lowerComment.includes(kw));

        if (!matchedKeyword) continue;

        console.log(`[webhook] Matched keyword "${matchedKeyword}" → automation "${automation.name}"`);

        const dmText = personalizeMessage(automation.dm_message, senderUsername);
        let dmSent = false;
        let commentReplied = false;
        let errorMessage: string | undefined;

        // ── Send DM ────────────────────────────────────────────────
        const dmResult = await sendDM(
          senderId,      // IG-scoped user ID (the fix)
          dmText,
          ACCESS_TOKEN,
          IG_ACCOUNT_ID  // Your business account ID (the fix)
        );

        if (dmResult.success) {
          dmSent = true;
          console.log(`[webhook] DM sent to ${senderId} (message_id: ${dmResult.messageId})`);
        } else {
          errorMessage = dmResult.error;
          console.error(`[webhook] DM failed for ${senderId}:`, dmResult.error);
        }

        // ── Reply to comment (if configured) ──────────────────────
        if (automation.reply_comment && commentId) {
          const replyResult = await replyToComment(
            commentId,
            automation.reply_comment,
            ACCESS_TOKEN
          );
          commentReplied = replyResult.success;
          if (!replyResult.success) {
            console.error(`[webhook] Comment reply failed:`, replyResult.error);
          }
        }

        // ── Log to DB ──────────────────────────────────────────────
       await logActivity({
  automation_id: automation.id,
  automation_name: automation.name,
  instagram_user_id: senderId,
  instagram_username: senderUsername,
  comment_text: commentText,
  matched_keyword: matchedKeyword,
  dm_sent: dmSent,
  comment_replied: commentReplied,
  error_message: errorMessage,
});

        // if (dmSent) {
        //   await incrementTriggered(automation.id);
        // }

        break; // Only fire the first matching automation per comment
      }
    }
  }
}

// ─── Types ────────────────────────────────────────────────────────────
interface WebhookPayload {
  object?: string;
  entry?: Array<{
    id?: string;
    changes?: Array<{
      field: string;
      value?: {
        from?: { id: string; username?: string };
        text?: string;
        id?: string;
        media?: { id?: string };
      };
    }>;
  }>;
}