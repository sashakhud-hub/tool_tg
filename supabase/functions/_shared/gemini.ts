/** Модели Gemini в порядке приоритета (fallback при ошибке) */
const FALLBACK_MODELS = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"];

export interface GeminiGenerateOptions {
  key: string;
  model?: string;
  systemInstruction: string;
  userContent: string;
  temperature?: number;
}

export interface GeminiResult {
  ok: boolean;
  text?: string;
  error?: string;
}

export async function geminiGenerate(opts: GeminiGenerateOptions): Promise<GeminiResult> {
  const models = opts.model
    ? [opts.model, ...FALLBACK_MODELS.filter((m) => m !== opts.model)]
    : FALLBACK_MODELS;
  let lastError = "";
  for (const model of models) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${opts.key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: opts.systemInstruction }] },
            contents: [{ role: "user", parts: [{ text: opts.userContent }] }],
            generationConfig: { temperature: opts.temperature ?? 0 },
          }),
        }
      );
      const data = await r.json();
      if (data.error) {
        lastError = data.error?.message ?? "Неизвестная ошибка API";
        continue;
      }
      const parts = data.candidates?.[0]?.content?.parts ?? [];
      const text = parts.map((p: { text?: string }) => p.text ?? "").join("");
      return { ok: true, text };
    } catch (e) {
      lastError = String(e);
    }
  }
  return { ok: false, error: lastError || "Ошибка Gemini API" };
}
