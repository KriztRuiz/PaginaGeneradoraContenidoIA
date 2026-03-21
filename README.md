# PaginaGeneradoraContenidoIA

MVP mínimo para una plataforma de contenido construida con **Next.js**, **TypeScript**, **Prisma**, **PostgreSQL** y autenticación por credenciales.

## Estado actual

Fase 1 estable.

### Funcionalidades incluidas
- login admin
- creación manual de posts
- edición de posts
- guardado de borradores
- publicación de posts
- listado público de posts publicados
- detalle público por slug
- bootstrap inicial para crear el primer administrador

### Funcionalidades fuera del MVP
- IA
- Redis
- workers
- redes sociales
- programación de publicaciones
- categorías
- tags
- media uploads
- múltiples roles
- revisiones
- auditoría
- logs complejos
- SEO avanzado
- editor visual complejo

---

## Stack

- Next.js
- TypeScript
- Prisma
- PostgreSQL
- Auth con credenciales
- Webpack en desarrollo (`next dev --webpack`)

---

## Estructura actual del proyecto

```txt
PaginaGeneradoraContenidoIA/
├─ prisma/
│  ├─ migrations/
│  │  ├─ 20260320012942_init/
│  │  │  └─ migration.sql
│  │  └─ migration_lock.toml
│  └─ schema.prisma
├─ src/
│  ├─ actions/
│  │  ├─ auth-actions.ts
│  │  └─ post-actions.ts
│  ├─ app/
│  │  ├─ admin/
│  │  │  ├─ login/
│  │  │  │  └─ page.tsx
│  │  │  ├─ posts/
│  │  │  │  ├─ [id]/
│  │  │  │  │  └─ edit/
│  │  │  │  │     └─ page.tsx
│  │  │  │  ├─ new/
│  │  │  │  │  └─ page.tsx
│  │  │  │  └─ page.tsx
│  │  │  └─ page.tsx
│  │  ├─ api/
│  │  │  └─ auth/
│  │  │     └─ [...nextauth]/
│  │  │        └─ route.ts
│  │  ├─ posts/
│  │  │  ├─ [slug]/
│  │  │  │  └─ page.tsx
│  │  │  └─ page.tsx
│  │  ├─ globals.css
│  │  ├─ layout.tsx
│  │  └─ page.tsx
│  ├─ components/
│  │  └─ post-form.tsx
│  ├─ lib/
│  │  ├─ auth.ts
│  │  ├─ prisma.ts
│  │  └─ slug.ts
│  ├─ types/
│  │  └─ next-auth.d.ts
│  └─ auth.ts
├─ .env
├─ .gitignore
├─ next-env.d.ts
├─ next.config.ts
├─ package-lock.json
├─ package.json
├─ README.md
└─ tsconfig.json