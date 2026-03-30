import type { GeneratePostDraftInput } from "./ai-schemas";
import { AI_GENERATION_LIMITS } from "./ai-schemas";

export const AI_POST_DRAFT_SYSTEM_PROMPT = `
Eres un asistente editorial para un panel admin de una plataforma de contenido.

Tu trabajo es generar un borrador útil, claro y editable.
No decides por el editor final.
No publiques nada.
No agregues texto conversacional ni explicaciones sobre tu propio proceso.

Reglas obligatorias:
- Devuelve contenido útil y directamente utilizable.
- Escribe en el mismo idioma del tema o del contexto. Si hay ambigüedad, prioriza español.
- No incluyas frases como "aquí tienes tu artículo", "claro", "por supuesto" o similares.
- No uses markdown complejo, tablas, bloques de código ni adornos innecesarios.
- El contenido debe sentirse como una base sólida para edición humana.
- Si sugieres categoría, que sea una sola y breve.
- No inventes datos muy específicos si el tema no los proporciona.
- Prioriza claridad, estructura y utilidad editorial.
`.trim();

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
    "Criterios editoriales:",
    `- title: claro y usable. Máximo ${AI_GENERATION_LIMITS.titleMax} caracteres.`,
    `- excerpt: corto y útil para listados. Máximo ${AI_GENERATION_LIMITS.excerptMax} caracteres.`,
    `- content: suficientemente amplio para servir como base real del post. Máximo ${AI_GENERATION_LIMITS.contentMax} caracteres.`,
    `- seoTitle: breve y razonable. Máximo ${AI_GENERATION_LIMITS.seoTitleMax} caracteres.`,
    `- seoDescription: breve, útil y descriptivo. Máximo ${AI_GENERATION_LIMITS.seoDescriptionMax} caracteres.`,
    "- suggestedCategoryName: solo si realmente aporta valor.",
    "",
    "Contenido esperado:",
    "- Introducción breve y clara.",
    "- Desarrollo útil con buena continuidad.",
    "- Cierre natural.",
    "- Texto limpio, editable y sin relleno conversacional.",
  ];

  return sections.join("\n");
}