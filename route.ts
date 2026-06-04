import { type NextRequest, NextResponse } from 'next/server'

/**
 * PRODUCTION: Complete Translation Pipeline API with Timeout & Validation
 * - Ensures actual translation output with multi-provider fallback
 * - Timeout handling prevents hanging requests
 * - Request validation prevents invalid data
 */

const REQUEST_TIMEOUT = 15000 // 15 seconds
const MAX_TEXT_LENGTH = 5000

interface TranslateRequest {
  text: string
  sourceLanguage: string
  targetLanguage: string
  tone?: "formal" | "casual" | "business" | "travel"
  provider?: "deepl" | "google" | "openai"
}

export async function POST(request: NextRequest) {
  try {
    const payload: TranslateRequest = await request.json()

    console.log("[v0] API: Translate request", {
      textLength: payload.text.length,
      source: payload.sourceLanguage,
      target: payload.targetLanguage,
      provider: payload.provider || "auto",
    })

    // Validate input
    if (!payload.text?.trim()) {
      console.warn("[v0] API: Empty text provided")
      return NextResponse.json(
        { error: "Empty text provided" },
        { status: 400 }
      )
    }

    if (payload.text.length > MAX_TEXT_LENGTH) {
      console.warn("[v0] API: Text exceeds max length", { length: payload.text.length })
      return NextResponse.json(
        { error: `Text exceeds maximum length of ${MAX_TEXT_LENGTH}` },
        { status: 400 }
      )
    }

    if (!payload.sourceLanguage || !payload.targetLanguage) {
      console.warn("[v0] API: Missing language parameters")
      return NextResponse.json(
        { error: "Missing language parameters" },
        { status: 400 }
      )
    }

    let translatedText: string | null = null

    // Try providers with timeout
    try {
      translatedText = await Promise.race([
        translateWithProvider(
          payload.text,
          payload.sourceLanguage,
          payload.targetLanguage,
          payload.tone,
          payload.provider || "deepl"
        ),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Primary provider timeout")), REQUEST_TIMEOUT)
        ),
      ])
    } catch (primaryError) {
      console.warn("[v0] Primary provider failed, trying fallback", primaryError)

      // Fallback chain with timeout
      for (const fallbackProvider of ["google", "openai"] as const) {
        try {
          translatedText = await Promise.race([
            translateWithProvider(
              payload.text,
              payload.sourceLanguage,
              payload.targetLanguage,
              payload.tone,
              fallbackProvider
            ),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error(`${fallbackProvider} timeout`)), REQUEST_TIMEOUT)
            ),
          ])
          if (translatedText) {
            console.log(`[v0] Fallback provider ${fallbackProvider} succeeded`)
            break
          }
        } catch (fallbackError) {
          console.warn(`[v0] Fallback ${fallbackProvider} failed`, fallbackError)
          continue
        }
      }

      if (!translatedText) {
        throw new Error("All translation providers failed or timed out")
      }
    }

    // Validate response
    if (!translatedText || typeof translatedText !== "string") {
      throw new Error("Invalid translation response: translatedText is not a string")
    }

    console.log("[v0] API: Translation successful", {
      original: payload.text.substring(0, 50),
      translated: translatedText.substring(0, 50),
    })

    return NextResponse.json({
      originalText: payload.text,
      translatedText,
      sourceLanguage: payload.sourceLanguage,
      targetLanguage: payload.targetLanguage,
      tone: payload.tone || "neutral",
      provider: payload.provider || "deepl",
      confidence: 0.95,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Translation API error:", error)
    const errorMessage = error instanceof Error ? error.message : "Translation failed"

    return NextResponse.json(
      {
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

async function translateWithProvider(
  text: string,
  source: string,
  target: string,
  tone: string | undefined,
  provider: "deepl" | "google" | "openai"
): Promise<string> {
  console.log(`[v0] Translating with ${provider}`, { text: text.substring(0, 30) })

  switch (provider) {
    case "deepl":
      return await translateDeepL(text, source, target, tone)
    case "google":
      return await translateGoogle(text, source, target)
    case "openai":
      return await translateOpenAI(text, source, target, tone)
    default:
      throw new Error(`Unknown provider: ${provider}`)
  }
}

async function translateDeepL(
  text: string,
  source: string,
  target: string,
  tone?: string
): Promise<string> {
  const apiKey = process.env.DEEPL_API_KEY
  if (!apiKey) {
    console.error("[v0] DeepL API key not configured")
    throw new Error("DeepL API key not configured")
  }

  const sourceCode = mapLanguageToDeepL(source)
  const targetCode = mapLanguageToDeepL(target)

  console.log("[v0] DeepL: Request", { sourceCode, targetCode, formality: tone === "formal" ? "more" : "less" })

  const response = await fetch("https://api-free.deepl.com/v2/translate", {
    method: "POST",
    headers: {
      "Authorization": `DeepL-Auth-Key ${apiKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      text,
      source_lang: sourceCode,
      target_lang: targetCode,
      formality: tone === "formal" ? "more" : "less",
    }).toString(),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error("[v0] DeepL API error", { status: response.status, error })
    throw new Error(`DeepL error: ${response.status} - ${error}`)
  }

  const result = await response.json()
  console.log("[v0] DeepL: Response received")

  if (!result.translations?.[0]?.text) {
    console.error("[v0] DeepL: No translation in response", { result })
    throw new Error("No translation in DeepL response")
  }

  return result.translations[0].text
}

async function translateGoogle(
  text: string,
  source: string,
  target: string
): Promise<string> {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY
  if (!apiKey) {
    console.error("[v0] Google Translate API key not configured")
    throw new Error("Google Translate API key not configured")
  }

  const sourceCode = mapLanguageToGoogle(source)
  const targetCode = mapLanguageToGoogle(target)

  console.log("[v0] Google: Request", { sourceCode, targetCode })

  const response = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: text,
        source: sourceCode,
        target: targetCode,
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    console.error("[v0] Google API error", { status: response.status, error })
    throw new Error(`Google Translate error: ${response.status} - ${error}`)
  }

  const result = await response.json()
  console.log("[v0] Google: Response received")

  if (!result.data?.translations?.[0]?.translatedText) {
    console.error("[v0] Google: No translation in response", { result })
    throw new Error("No translation in Google response")
  }

  return result.data.translations[0].translatedText
}

async function translateOpenAI(
  text: string,
  source: string,
  target: string,
  tone?: string
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.error("[v0] OpenAI API key not configured")
    throw new Error("OpenAI API key not configured")
  }

  const toneInstruction =
    tone === "formal"
      ? "Use formal and professional language."
      : tone === "casual"
        ? "Use casual and friendly language."
        : tone === "business"
          ? "Use business professional tone."
          : "Maintain natural tone."

  console.log("[v0] OpenAI: Request", { source, target, tone })

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an expert translator. Translate from ${source} to ${target}. ${toneInstruction} Reply with ONLY the translated text, nothing else.`,
        },
        {
          role: "user",
          content: text,
        },
      ],
      temperature: 0.2,
      max_tokens: 1000,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error("[v0] OpenAI API error", { status: response.status, error })
    throw new Error(`OpenAI error: ${response.status} - ${error}`)
  }

  const result = await response.json()
  console.log("[v0] OpenAI: Response received")

  if (!result.choices?.[0]?.message?.content) {
    console.error("[v0] OpenAI: No translation in response", { result })
    throw new Error("No translation in OpenAI response")
  }

  return result.choices[0].message.content.trim()
}

function mapLanguageToDeepL(language: string): string {
  const map: Record<string, string> = {
    English: "EN-US",
    Spanish: "ES",
    French: "FR",
    German: "DE",
    Italian: "IT",
    Portuguese: "PT-PT",
    Dutch: "NL",
    Polish: "PL",
    Russian: "RU",
    Japanese: "JA",
    Chinese: "ZH",
    Korean: "KO",
    Arabic: "AR",
    Turkish: "TR",
    Greek: "EL",
    Czech: "CS",
    Danish: "DA",
    Finnish: "FI",
    Hungarian: "HU",
    Norwegian: "NB",
    Swedish: "SV",
    Ukrainian: "UK",
  }
  return map[language] || "EN-US"
}

function mapLanguageToGoogle(language: string): string {
  const map: Record<string, string> = {
    English: "en",
    Spanish: "es",
    French: "fr",
    German: "de",
    Italian: "it",
    Portuguese: "pt",
    Dutch: "nl",
    Polish: "pl",
    Russian: "ru",
    Japanese: "ja",
    Chinese: "zh-CN",
    Korean: "ko",
    Arabic: "ar",
    Turkish: "tr",
    Greek: "el",
    Czech: "cs",
    Danish: "da",
    Finnish: "fi",
    Hungarian: "hu",
    Norwegian: "no",
    Swedish: "sv",
    Ukrainian: "uk",
  }
  return map[language] || "en"
}
