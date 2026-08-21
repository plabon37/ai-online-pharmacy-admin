import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  generatePharmacyChatReply,
  type GeminiChatMessage,
} from "@/lib/ai/gemini";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

/* ============================================================
   TYPES
============================================================ */

type ChatRequestBody = {
  message?: unknown;

  history?: unknown;
};

type ChatResponse = {
  success: boolean;

  data:
    | {
        reply: string;
      }
    | null;

  message: string;
};

/* ============================================================
   CORS
============================================================ */

function getClientOrigin() {
  return (
    process.env.CLIENT_ORIGIN?.trim() ||
    "http://localhost:3001"
  ).replace(
    /\/+$/,
    ""
  );
}

function applyCors(
  response: NextResponse
) {
  response.headers.set(
    "Access-Control-Allow-Origin",
    getClientOrigin()
  );

  response.headers.set(
    "Access-Control-Allow-Credentials",
    "true"
  );

  response.headers.set(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
  );

  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Accept"
  );

  response.headers.set(
    "Access-Control-Max-Age",
    "86400"
  );

  response.headers.set(
    "Vary",
    "Origin"
  );

  return response;
}

function isAllowedOrigin(
  request: NextRequest
) {
  const origin =
    request.headers.get(
      "origin"
    );

  if (!origin) {
    return true;
  }

  return (
    origin.replace(
      /\/+$/,
      ""
    ) === getClientOrigin()
  );
}

/* ============================================================
   OPTIONS
============================================================ */

export async function OPTIONS(
  request: NextRequest
) {
  if (
    !isAllowedOrigin(
      request
    )
  ) {
    return new NextResponse(
      null,
      {
        status: 403,
      }
    );
  }

  return applyCors(
    new NextResponse(
      null,
      {
        status: 204,
      }
    )
  );
}

/* ============================================================
   POST - PHARMACY CHATBOT
============================================================ */

export async function POST(
  request: NextRequest
) {
  try {
    /* ========================================================
       ORIGIN
    ======================================================== */

    if (
      !isAllowedOrigin(
        request
      )
    ) {
      return applyCors(
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Invalid client origin",
          } satisfies ChatResponse,
          {
            status: 403,
          }
        )
      );
    }

    /* ========================================================
       BODY
    ======================================================== */

    let body:
      | ChatRequestBody
      | null = null;

    try {
      body =
        (await request.json()) as ChatRequestBody;
    } catch {
      return applyCors(
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Invalid JSON request body",
          } satisfies ChatResponse,
          {
            status: 400,
          }
        )
      );
    }

    /* ========================================================
       MESSAGE
    ======================================================== */

    const message =
      typeof body?.message ===
      "string"
        ? body.message.trim()
        : "";

    if (!message) {
      return applyCors(
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Message is required",
          } satisfies ChatResponse,
          {
            status: 400,
          }
        )
      );
    }

    if (
      message.length >
      4000
    ) {
      return applyCors(
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Message cannot exceed 4000 characters",
          } satisfies ChatResponse,
          {
            status: 400,
          }
        )
      );
    }

    /* ========================================================
       HISTORY
    ======================================================== */

    const incomingHistory =
      Array.isArray(
        body?.history
      )
        ? body.history
        : [];

    const history: GeminiChatMessage[] =
      incomingHistory
        .slice(-20)
        .map(
          (item) => {
            if (
              !item ||
              typeof item !==
                "object"
            ) {
              return null;
            }

            const candidate =
              item as {
                role?: unknown;
                text?: unknown;
              };

            const role =
              candidate.role ===
              "model"
                ? "model"
                : candidate.role ===
                    "user"
                  ? "user"
                  : null;

            const text =
              typeof candidate.text ===
              "string"
                ? candidate.text.trim()
                : "";

            if (
              !role ||
              !text
            ) {
              return null;
            }

            return {
              role,
              text,
            };
          }
        )
        .filter(
          (
            item
          ): item is GeminiChatMessage =>
            item !== null
        );

    /* ========================================================
       GEMINI
    ======================================================== */

    const result =
      await generatePharmacyChatReply(
        message,
        history
      );

    /* ========================================================
       SUCCESS
    ======================================================== */

    return applyCors(
      NextResponse.json(
        {
          success: true,

          data: {
            reply:
              result.reply,
          },

          message:
            "Chat response generated successfully",
        } satisfies ChatResponse,
        {
          status: 200,
        }
      )
    );
  } catch (error) {
    console.error(
      "Pharmacy Chat API Error:",
      error
    );

    const errorMessage =
      error instanceof
      Error
        ? error.message
        : "Failed to generate chatbot response";

    /* ========================================================
       CONFIG ERROR
    ======================================================== */

    if (
      errorMessage ===
      "GEMINI_API_KEY is not configured"
    ) {
      return applyCors(
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "Gemini API is not configured",
          } satisfies ChatResponse,
          {
            status: 500,
          }
        )
      );
    }

    /* ========================================================
       GEMINI UNAVAILABLE / RATE LIMIT
    ======================================================== */

    if (
      errorMessage
        .toLowerCase()
        .includes(
          "high demand"
        ) ||
      errorMessage
        .toLowerCase()
        .includes(
          "unavailable"
        ) ||
      errorMessage
        .toLowerCase()
        .includes(
          "overloaded"
        )
    ) {
      return applyCors(
        NextResponse.json(
          {
            success: false,
            data: null,
            message:
              "The AI service is temporarily busy. Please try again in a moment.",
          } satisfies ChatResponse,
          {
            status: 503,
          }
        )
      );
    }

    /* ========================================================
       GENERIC ERROR
    ======================================================== */

    return applyCors(
      NextResponse.json(
        {
          success: false,
          data: null,
          message:
            errorMessage ||
            "Failed to generate chatbot response",
        } satisfies ChatResponse,
        {
          status: 500,
        }
      )
    );
  }
}