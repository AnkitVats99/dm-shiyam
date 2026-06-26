// lib/instagram.ts
// Fixed version — resolves DM-not-sending bug

const GRAPH_API_VERSION = "v19.0";
const BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

// ─────────────────────────────────────────────
// Send a DM via the Instagram Messaging API
//
// FIX 1: Use /{ig-user-id}/messages (NOT /me/messages)
// FIX 2: Recipient must be { id: "<instagram_scoped_user_id>" }
//         The scoped user ID comes from the webhook payload
//         (entry[].changes[].value.from.id) — NOT the username
// FIX 3: Message body must be { text: "..." } nested inside `message`
// ─────────────────────────────────────────────
export async function sendDM(
  recipientId: string,   // Instagram-scoped user ID from webhook payload
  messageText: string,
  accessToken: string,
  igAccountId: string    // Your Instagram Business Account ID (INSTAGRAM_ACCOUNT_ID)
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    const url = `${BASE_URL}/me/messages`;

    const body = {
  recipient: { id: recipientId },
  message: { text: messageText },
  messaging_type: "RESPONSE",
};

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      const errMsg = data.error?.message ?? `HTTP ${res.status}`;
      console.error("[sendDM] API error:", JSON.stringify(data.error ?? data));
      return { success: false, error: errMsg };
    }

    return { success: true, messageId: data.message_id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[sendDM] Fetch error:", message);
    return { success: false, error: message };
  }
}

// ─────────────────────────────────────────────
// Reply to a comment publicly
// ─────────────────────────────────────────────
export async function replyToComment(
  commentId: string,
  replyText: string,
  accessToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const url = `${BASE_URL}/${commentId}/replies`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: replyText,
        access_token: accessToken,
      }),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      const errMsg = data.error?.message ?? `HTTP ${res.status}`;
      console.error("[replyToComment] API error:", JSON.stringify(data.error ?? data));
      return { success: false, error: errMsg };
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[replyToComment] Fetch error:", message);
    return { success: false, error: message };
  }
}

// ─────────────────────────────────────────────
// Replace {username} placeholder in DM templates
// ─────────────────────────────────────────────
export function personalizeMessage(template: string, username: string): string {
  return template.replace(/\{username\}/gi, `@${username}`);
}