export type PostInput = {
  title: string;
  slug: string;
  content: string;
};

export type PostValidationErrors = {
  title?: string;
  slug?: string;
  content?: string;
  general?: string;
};

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validatePostInput(input: PostInput): PostValidationErrors {
  const errors: PostValidationErrors = {};

  const title = input.title.trim();
  const slug = input.slug.trim();
  const content = input.content.trim();

  if (!title) {
    errors.title = "El título es obligatorio.";
  }

  if (!content) {
    errors.content = "El contenido es obligatorio.";
  }

  if (slug && !SLUG_REGEX.test(slug)) {
    errors.slug = "El slug es inválido.";
  }

  return errors;
}