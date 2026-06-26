import OpenAI from "openai";

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY not configured");
    _client = new OpenAI({ apiKey });
  }
  return _client;
}

const DEFAULT_SYSTEM_PROMPT = `You are a friendly social media assistant for an Instagram business account. 
When a user comments on a post, you craft a warm, personalized DM to send them.
Keep messages concise (2-4 sentences), friendly, and action-oriented.
Include a call-to-action when appropriate.
Never use excessive emojis. Sound human, not robotic.`;

/**
 * Generate an AI-powered DM response based on the comment context.
 */
export async function generateAiReply(params: {
  commentText: string;
  commenterUsername: string;
  staticDmTemplate: string;
  customSystemPrompt?: string;
}): Promise<{ message: string; success: boolean; error?: string }> {
  try {
    const client = getClient();

    const systemPrompt = params.customSystemPrompt || DEFAULT_SYSTEM_PROMPT;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `A user @${params.commenterUsername} commented on our Instagram post: "${params.commentText}"

Our default DM template for context: "${params.staticDmTemplate}"

Generate a personalized DM to send to this user. Make it feel personal based on their comment. Keep it brief and friendly.`,
        },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const message = response.choices[0]?.message?.content?.trim();

    if (!message) {
      return { message: params.staticDmTemplate, success: false, error: "Empty AI response, used fallback" };
    }

    return { message, success: true };
  } catch (error) {
    console.error("[AI] Error generating reply:", error);
    // Fallback to static template with placeholder replacement
    const fallback = params.staticDmTemplate.replace(
      /\{username\}/g,
      params.commenterUsername
    );
    return {
      message: fallback,
      success: false,
      error: `AI failed: ${error instanceof Error ? error.message : "Unknown error"}. Used fallback template.`,
    };
  }
}

/**
 * Generate an AI comment reply (public response to the comment).
 */
export async function generateAiCommentReply(params: {
  commentText: string;
  commenterUsername: string;
  customSystemPrompt?: string;
}): Promise<{ message: string; success: boolean; error?: string }> {
  try {
    const client = getClient();

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You write brief, friendly public comment replies for an Instagram business account. 
Keep replies to 1-2 short sentences. Be warm and encourage the user to check their DMs.
Never be salesy or pushy. Sound authentic.`,
        },
        {
          role: "user",
          content: `@${params.commenterUsername} commented: "${params.commentText}"
Write a brief public reply letting them know you've sent them a DM.`,
        },
      ],
      max_tokens: 100,
      temperature: 0.8,
    });

    const message = response.choices[0]?.message?.content?.trim();

    if (!message) {
      return { message: "Check your DMs! Just sent you the details.", success: false, error: "Empty AI response" };
    }

    return { message, success: true };
  } catch (error) {
    return {
      message: "Check your DMs! Just sent you the details.",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
