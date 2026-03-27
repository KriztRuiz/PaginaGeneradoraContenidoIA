# PaginaGeneradoraContenidoIA

MVP de una plataforma de contenido construida con **Next.js**, **TypeScript**, **Prisma**, **PostgreSQL** y autenticación por credenciales.

## Estado actual

**Fase 4 cerrada y validada.**

### Funcionalidades incluidas

* login admin
* panel admin protegido
* creación de posts
* edición de posts
* eliminación de posts
* slugs únicos
* categorías con descripción
* estados editoriales:

  * `DRAFT`
  * `PENDING`
  * `SCHEDULED`
  * `PUBLISHED`
  * `REJECTED`
* listado admin con filtros por categoría y estado
* listado público de posts publicados en `/posts`
* detalle público por slug en `/posts/[slug]`
* SEO básico por post:

  * `seoTitle`
  * `seoDescription`
* `robots.txt`
* `sitemap.xml`
* publicación automática de posts programados mediante cron protegido
* historial simple de revisiones visible en admin

### Funcionalidades fuera del alcance actual

* generación de contenido con IA
* publicación automática en redes sociales
* scraping
* colas complejas
* Redis
* BullMQ
* media uploads avanzados
* múltiples roles
* editor visual complejo
* analytics avanzados
* multi-tenant

---

## Stack

* Next.js
* TypeScript
* Prisma
* PostgreSQL
* NextAuth / auth por credenciales
* Server Actions
* Route Handlers
* Metadata API de Next.js

---

## Estructura actual del proyecto

```txt
PaginaGeneradoraContenidoIA/
├─ prisma/
│  ├─ migrations/
│  │  ├─ 20260320012942_init/
│  │  │  └─ migration.sql
│  │  ├─ 20260322003140_fase3_editorial/
│  │  │  └─ migration.sql
│  │  ├─ 20260324223425_phase4_editorial_foundation/
│  │  │  └─ migration.sql
│  │  └─ migration_lock.toml
│  └─ schema.prisma
├─ src/
│  ├─ actions/
│  │  ├─ auth-actions.ts
│  │  ├─ category-actions.ts
│  │  └─ post-actions.ts
│  ├─ app/
│  │  ├─ admin/
│  │  │  ├─ categories/
│  │  │  │  ├─ [id]/
│  │  │  │  │  └─ edit/
│  │  │  │  │     └─ page.tsx
│  │  │  │  └─ page.tsx
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
│  │  │  ├─ auth/
│  │  │  │  └─ [...nextauth]/
│  │  │  │     └─ route.ts
│  │  │  └─ cron/
│  │  │     └─ publish-scheduled/
│  │  │        └─ route.ts
│  │  ├─ posts/
│  │  │  ├─ [slug]/
│  │  │  │  └─ page.tsx
│  │  │  └─ page.tsx
│  │  ├─ globals.css
│  │  ├─ layout.tsx
│  │  ├─ page.tsx
│  │  ├─ robots.ts
│  │  └─ sitemap.ts
│  ├─ components/
│  │  ├─ category-form.tsx
│  │  ├─ confirm-delete.tsx
│  │  ├─ form-message.tsx
│  │  ├─ post-form.tsx
│  │  └─ post-revisions.tsx
│  ├─ lib/
│  │  ├─ auth.ts
│  │  ├─ category-validation.ts
│  │  ├─ post-revisions.ts
│  │  ├─ post-status.ts
│  │  ├─ post-validation.ts
│  │  ├─ prisma.ts
│  │  └─ slug.ts
│  ├─ types/
│  │  ├─ auth.ts
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
```

---

## Requisitos

Antes de instalar el proyecto necesitas:

* Node.js 20 o superior
* npm
* PostgreSQL
* una base de datos disponible
* variables de entorno configuradas

---

## Instalación

### 1. Clona el repositorio

```bash
git clone https://github.com/KriztRuiz/PaginaGeneradoraContenidoIA.git
cd PaginaGeneradoraContenidoIA
```

### 2. Instala dependencias

```bash
npm install
```

### 3. Crea el archivo `.env`

Crea un archivo `.env` en la raíz del proyecto con una base similar a esta:

```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/nombre_db"
NEXTAUTH_SECRET="un_secret_largo_y_seguro"
NEXTAUTH_URL="http://localhost:3000"
CRON_SECRET="un_secret_largo_y_seguro_para_el_cron"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

### 4. Ejecuta las migraciones

```bash
npx prisma migrate dev
```

### 5. Genera el cliente de Prisma

```bash
npx prisma generate
```

### 6. Inicia el servidor de desarrollo

```bash
npm run dev
```

### 7. Abre el proyecto en el navegador

```txt
http://localhost:3000
```

---

## Notas sobre el primer usuario administrador

Para usar el panel admin debes contar con un usuario válido en la tabla `User`.

Si en tu entorno local todavía no existe uno, primero debes crearlo según el flujo que ya uses en tu proyecto o en tu base de datos. Después podrás iniciar sesión en:

```txt
http://localhost:3000/admin/login
```

---

## Guía de uso del proyecto

## 1. Acceso al panel admin

Ruta:

```txt
/admin/login
```

Desde ahí inicia sesión con un usuario administrador.

---

## 2. Gestión de categorías

Ruta:

```txt
/admin/categories
```

Desde esta sección puedes:

* crear categorías
* editar categorías
* agregar descripción
* eliminar categorías sin posts asociados

Cada categoría tiene:

* nombre
* slug
* descripción opcional

---

## 3. Gestión de posts

Ruta:

```txt
/admin/posts
```

Desde esta sección puedes:

* ver todos los posts
* filtrar por categoría
* filtrar por estado
* crear un nuevo post
* editar un post
* eliminar un post
* abrir la vista pública del post

### Estados disponibles

* `DRAFT`: borrador, no visible públicamente
* `PENDING`: pendiente, no visible públicamente
* `SCHEDULED`: programado, no visible públicamente hasta que el cron lo publique
* `PUBLISHED`: visible públicamente
* `REJECTED`: rechazado, no visible públicamente

---

## 4. Crear un nuevo post

Ruta:

```txt
/admin/posts/new
```

Campos principales:

* título
* slug
* extracto
* categoría
* estado
* fecha programada
* SEO title
* SEO description
* contenido

### Comportamiento importante

* si dejas el slug vacío, se genera desde el título
* si el título se repite, el slug se vuelve único automáticamente
* si el estado es `SCHEDULED`, la fecha programada es obligatoria
* si el estado es `PUBLISHED`, el post queda visible en `/posts`
* si el estado no es `PUBLISHED`, el post no debe salir públicamente

---

## 5. Editar un post

Ruta:

```txt
/admin/posts/[id]/edit
```

Desde esta vista puedes:

* actualizar cualquier campo del post
* cambiar el estado editorial
* ver historial de revisiones
* eliminar el post

### Historial de revisiones

En la edición del post se muestran revisiones simples como:

* `CREATED`
* `UPDATED`
* `STATUS_CHANGED`
* `SCHEDULED`
* `PUBLISHED`
* `REJECTED`
* `AUTO_PUBLISHED`

---

## 6. Sitio público

### Listado público

```txt
/posts
```

Solo muestra posts con estado `PUBLISHED`.

### Detalle por slug

```txt
/posts/[slug]
```

Solo responde si el post está publicado.

### Filtro por categoría

```txt
/posts?category=slug-de-categoria
```

Solo muestra posts publicados de esa categoría.

---

## 7. SEO técnico

### robots.txt

```txt
/robots.txt
```

Incluye reglas básicas:

* permite indexar `/`
* permite indexar `/posts`
* bloquea `/admin`
* bloquea `/api`

### sitemap.xml

```txt
/sitemap.xml
```

Incluye:

* `/`
* `/posts`
* `/posts/[slug]` solo de posts publicados

### Metadata por post

En la página pública de detalle:

* si existe `seoTitle`, se usa como `<title>`
* si existe `seoDescription`, se usa como `meta description`
* si no existen, se usan fallbacks del post

---

## 8. Publicación automática de posts programados

El proyecto incluye un endpoint protegido para publicar posts vencidos:

```txt
POST /api/cron/publish-scheduled
```

### Requisitos

Debes enviar el secret correcto en headers:

Header soportado:

```txt
x-cron-secret: TU_CRON_SECRET
```

### Ejemplo en PowerShell

```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/cron/publish-scheduled" -Headers @{ "x-cron-secret" = "TU_CRON_SECRET" }
```

### Qué hace

* busca posts con estado `SCHEDULED`
* revisa si `scheduledAt <= now`
* cambia el estado a `PUBLISHED`
* llena `publishedAt`
* limpia `scheduledAt`
* crea una revisión `AUTO_PUBLISHED`
* revalida `/posts` y `/posts/[slug]`

### Seguridad

* sin secret correcto responde `401`
* abrir la ruta en el navegador por `GET` no sirve para probarlo

---

## Flujo recomendado de uso

### Flujo manual

1. iniciar sesión en `/admin/login`
2. crear categorías
3. crear post
4. revisar contenido y SEO
5. guardar como `DRAFT`, `PENDING`, `SCHEDULED` o `PUBLISHED`
6. verificar la vista pública en `/posts`

### Flujo con programación

1. crear un post con estado `SCHEDULED`
2. asignar una fecha futura
3. esperar la hora programada
4. ejecutar el cron con el secret correcto
5. verificar que el post ahora aparece en `/posts`

---

## Comandos útiles

### Ejecutar proyecto en desarrollo

```bash
npm run dev
```

### Ejecutar migraciones

```bash
npx prisma migrate dev
```

### Regenerar cliente de Prisma

```bash
npx prisma generate
```

### Abrir Prisma Studio

```bash
npx prisma studio
```

---

## Pruebas funcionales validadas en Fase 4

Se validó correctamente:

* creación de posts en `DRAFT`
* creación de posts en `PUBLISHED`
* creación de posts en `PENDING`
* creación de posts en `SCHEDULED`
* validación de `SCHEDULED` sin fecha
* slugs únicos automáticos
* edición de posts
* categorías con descripción
* asignación de categorías
* visibilidad pública solo de `PUBLISHED`
* detalle público por slug
* filtro por categoría
* cron protegido
* publicación automática de posts vencidos
* no publicación de posts futuros
* revisiones visibles
* revisión `AUTO_PUBLISHED`
* `robots.txt`
* `sitemap.xml`
* metadata SEO de detalle público
* protección de `/admin`

---

## Próxima fase sugerida

La siguiente fase recomendada es **IA asistida dentro del admin**, enfocada en generar borradores editables antes de publicar, sin automatizar todavía redes sociales ni publicación total.

---

## Licencia

Uso interno / proyecto personal en evolución.
