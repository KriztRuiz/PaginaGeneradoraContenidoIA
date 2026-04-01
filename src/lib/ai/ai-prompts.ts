import type {
  AiRegenerableField,
  GeneratePostDraftInput,
  RegeneratePostDraftInput,
} from "./ai-schemas";
import { AI_GENERATION_LIMITS } from "./ai-schemas";

export const AI_POST_DRAFT_SYSTEM_PROMPT = `
Eres un asistente editorial para un panel admin de una plataforma de contenido.

Tu trabajo es generar texto útil, limpio y editable por una persona.
No decides por el editor final.
No publiques nada.
No expliques tu proceso.
No agregues frases conversacionales.

Reglas obligatorias:
- Devuelve contenido directamente utilizable.
- Escribe en el mismo idioma del tema o del contexto. Si hay ambigüedad, prioriza español.
- No uses frases como "aquí tienes", "claro", "por supuesto" o similares.
- No uses markdown complejo, tablas, bloques de código ni adornos innecesarios.
- El contenido debe sentirse como una base sólida para edición humana.
- No inventes datos muy específicos si no fueron dados.
- Prioriza claridad, continuidad, utilidad editorial y limpieza.
`.trim();

const PARTIAL_FIELD_GUIDANCE: Record<AiRegenerableField, string> = {
  title: `- title: debe ser claro, útil, natural y no exceder ${AI_GENERATION_LIMITS.titleMax} caracteres.`,
  excerpt: `- excerpt: debe resumir sin repetir el título y no exceder ${AI_GENERATION_LIMITS.excerptMax} caracteres.`,
  content: `- content: debe mantener coherencia con el borrador actual, estar bien estructurado y no exceder ${AI_GENERATION_LIMITS.contentMax} caracteres.`,
  seoTitle: `- seoTitle: debe ser breve, razonable y no exceder ${AI_GENERATION_LIMITS.seoTitleMax} caracteres.`,
  seoDescription: `- seoDescription: debe ser clara, útil y no exceder ${AI_GENERATION_LIMITS.seoDescriptionMax} caracteres.`,
};

function formatDraftField(label: string, value?: string) {
  return `${label}: ${value && value.trim().length > 0 ? value : "(vacío)"}`;
}

export function buildGeneratePostDraftUserPrompt(
  input: GeneratePostDraftInput,
): string {
  const sections = [
    "Genera un borrador estructurado para un post del panel admin.",
    `Tema principal: ${input.topic}`,
    `Contexto adicional: ${input.context ?? "Sin contexto adicional."}`,
    `Tono deseado: ${input.tone ?? "Profesional, claro y útil."}`,
    `Categoría sugerida por el usuario: ${input.categoryName ?? "No especificada."}`,
    "",
    "Campos obligatorios de salida:",
    "- title",
    "- excerpt",
    "- content",
    "- seoTitle",
    "- seoDescription",
    "- suggestedCategoryName",
    "",
    "Criterios editoriales:",
    `- title: claro y usable. Máximo ${AI_GENERATION_LIMITS.titleMax} caracteres.`,
    `- excerpt: corto y útil para listados. Máximo ${AI_GENERATION_LIMITS.excerptMax} caracteres.`,
    `- content: suficientemente amplio para servir como base real del post. Máximo ${AI_GENERATION_LIMITS.contentMax} caracteres.`,
    `- seoTitle: breve y razonable. Máximo ${AI_GENERATION_LIMITS.seoTitleMax} caracteres.`,
    `- seoDescription: breve, útil y descriptivo. Máximo ${AI_GENERATION_LIMITS.seoDescriptionMax} caracteres.`,
    "- suggestedCategoryName: una sola categoría breve o null si no aporta valor.",
    "",
    "Contenido esperado:",
    "- Introducción breve y clara.",
    "- Desarrollo útil con buena continuidad.",
    "- Cierre natural.",
    "- Texto limpio, editable y sin relleno conversacional.",
  ];

  return sections.join("\n");
}

export function buildRegeneratePostDraftUserPrompt(
  input: RegeneratePostDraftInput,
): string {
  const uniqueFields = [...new Set(input.targetFields)];

  const sections = [
    "Regenera únicamente partes específicas de un borrador existente.",
    `Tema principal: ${input.topic}`,
    `Contexto adicional: ${input.context ?? "Sin contexto adicional."}`,
    `Tono deseado: ${input.tone ?? "Profesional, claro y útil."}`,
    `Categoría sugerida por el usuario: ${input.categoryName ?? "No especificada."}`,
    "",
    "Borrador actual:",
    formatDraftField("title", input.currentDraft.title),
    formatDraftField("excerpt", input.currentDraft.excerpt),
    formatDraftField("content", input.currentDraft.content),
    formatDraftField("seoTitle", input.currentDraft.seoTitle),
    formatDraftField("seoDescription", input.currentDraft.seoDescription),
    "",
    `Debes regenerar únicamente estos campos: ${uniqueFields.join(", ")}.`,
    "No devuelvas campos extra.",
    "No cambies el enfoque general del tema.",
    "Conserva coherencia con el borrador actual.",
    "",
    "Criterios por campo solicitado:",
    ...uniqueFields.map((field) => PARTIAL_FIELD_GUIDANCE[field]),
  ];

  return sections.join("\n");
}