# PaginaGeneradoraContenidoIA

MVP de una plataforma de contenido construida con **Next.js**, **TypeScript**, **Prisma**, **PostgreSQL**, autenticación por credenciales y generación asistida por IA para crear borradores editables desde el panel de administración.

---

## Estado actual

**Fase 5 cerrada y validada.**

### Funcionalidades incluidas

- login admin
- panel admin protegido
- creación manual de posts
- edición de posts
- eliminación de posts
- slugs únicos
- categorías con descripción
- estados editoriales:
  - `DRAFT`
  - `PENDING`
  - `SCHEDULED`
  - `PUBLISHED`
  - `REJECTED`
- listado admin con filtros por categoría y estado
- listado público de posts publicados en `/posts`
- detalle público por slug en `/posts/[slug]`
- SEO básico por post:
  - `seoTitle`
  - `seoDescription`
- `robots.txt`
- `sitemap.xml`
- publicación automática de posts programados mediante cron protegido
- historial simple de revisiones visible en admin
- generación de borradores con IA dentro de `/admin/posts/new`
- inyección del borrador generado al formulario real del post
- edición manual del contenido generado antes de guardar
- manejo de errores visibles en el bloque de IA

### Funcionalidades fuera del alcance actual

- publicación automática en redes sociales
- scraping
- browsing / investigación web en tiempo real
- recopilación real de noticias recientes desde internet
- colas complejas
- Redis
- BullMQ
- media uploads avanzados
- múltiples roles
- editor visual complejo
- analytics avanzados
- multi-tenant
- historial avanzado de prompts y consumo de IA
- múltiples proveedores de IA

---

## Stack

- Next.js
- TypeScript
- Prisma
- PostgreSQL
- NextAuth / auth por credenciales
- Server Actions
- Route Handlers
- Metadata API de Next.js
- OpenAI API

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
│  │  ├─ ai-actions.ts
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
│  │  ├─ ai-generate-post-form.tsx
│  │  ├─ category-form.tsx
│  │  ├─ confirm-delete.tsx
│  │  ├─ form-message.tsx
│  │  ├─ new-post-editor.tsx
│  │  ├─ post-form.tsx
│  │  └─ post-revisions.tsx
│  ├─ lib/
│  │  ├─ ai/
│  │  │  ├─ ai-mappers.ts
│  │  │  ├─ ai-prompts.ts
│  │  │  ├─ ai-schemas.ts
│  │  │  └─ generate-post-draft.ts
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

- Node.js 20 o superior
- npm
- PostgreSQL
- una base de datos disponible
- variables de entorno configuradas
- una API key válida del proveedor de IA
- cuota y facturación activas en la cuenta de la API si vas a usar la generación de borradores

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

AI_API_KEY="tu_api_key"
AI_MODEL="gpt-5.4"
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

Si en tu entorno local todavía no existe uno, primero debes crearlo según el flujo que ya uses en tu proyecto o directamente en tu base de datos. Después podrás iniciar sesión en:

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

- crear categorías
- editar categorías
- agregar descripción
- eliminar categorías sin posts asociados

Cada categoría tiene:

- nombre
- slug
- descripción opcional

---

## 3. Gestión de posts

Ruta:

```txt
/admin/posts
```

Desde esta sección puedes:

- ver todos los posts
- filtrar por categoría
- filtrar por estado
- crear un nuevo post
- editar un post
- eliminar un post
- abrir la vista pública del post

### Estados disponibles

- `DRAFT`: borrador, no visible públicamente
- `PENDING`: pendiente, no visible públicamente
- `SCHEDULED`: programado, no visible públicamente hasta que el cron lo publique
- `PUBLISHED`: visible públicamente
- `REJECTED`: rechazado, no visible públicamente

---

## 4. Crear un nuevo post manualmente

Ruta:

```txt
/admin/posts/new
```

Campos principales:

- título
- slug
- extracto
- categoría
- estado
- fecha programada
- SEO title
- SEO description
- contenido

### Comportamiento importante

- si dejas el slug vacío, se genera desde el título
- si el título se repite, el slug se vuelve único automáticamente
- si el estado es `SCHEDULED`, la fecha programada es obligatoria
- si el estado es `PUBLISHED`, el post queda visible en `/posts`
- si el estado no es `PUBLISHED`, el post no debe salir públicamente

---

## 5. Crear un nuevo post con IA asistida

Ruta:

```txt
/admin/posts/new
```

En la parte superior del formulario existe un bloque llamado:

```txt
Generar borrador con IA
```

### Campos del generador IA

- tema principal
- contexto adicional
- tono
- categoría sugerida

### Qué hace este bloque

- valida que el tema exista
- envía la solicitud al backend
- llama al proveedor de IA desde el servidor
- exige una respuesta estructurada
- normaliza el resultado
- rellena automáticamente el formulario real del post

### Qué genera la IA

El sistema solicita estas piezas:

- `title`
- `excerpt`
- `content`
- `seoTitle`
- `seoDescription`
- `suggestedCategoryName`

### Qué pasa después

Después de generar el borrador:

- el título se carga en el formulario
- el extracto se carga en el formulario
- el contenido se carga en el formulario
- el SEO title se carga en el formulario
- el SEO description se carga en el formulario
- el sistema intenta mapear la categoría sugerida a una categoría existente
- el estado queda en `DRAFT`
- el admin puede editar manualmente todo antes de guardar

### Límites reales de la IA en esta fase

La IA en esta fase:

- no publica automáticamente
- no aprueba contenido
- no programa publicaciones por sí sola
- no hace browsing en vivo
- no investiga noticias recientes desde internet en tiempo real
- no sustituye la revisión humana

Esto significa que prompts como:

- “reúne noticias de las últimas 6 horas”
- “compila lo último que pasó hoy”
- “investiga lo que ocurrió hace menos de 12 horas”

no están realmente soportados por el alcance actual.

---

## 6. Editar un post

Ruta:

```txt
/admin/posts/[id]/edit
```

Desde esta vista puedes:

- actualizar cualquier campo del post
- cambiar el estado editorial
- ver historial de revisiones
- eliminar el post

### Historial de revisiones

En la edición del post se muestran revisiones simples como:

- `CREATED`
- `UPDATED`
- `STATUS_CHANGED`
- `SCHEDULED`
- `PUBLISHED`
- `REJECTED`
- `AUTO_PUBLISHED`

---

## 7. Sitio público

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

## 8. SEO técnico

### robots.txt

```txt
/robots.txt
```

Incluye reglas básicas:

- permite indexar `/`
- permite indexar `/posts`
- bloquea `/admin`
- bloquea `/api`

### sitemap.xml

```txt
/sitemap.xml
```

Incluye:

- `/`
- `/posts`
- `/posts/[slug]` solo de posts publicados

### Metadata por post

En la página pública de detalle:

- si existe `seoTitle`, se usa como `<title>`
- si existe `seoDescription`, se usa como `meta description`
- si no existen, se usan fallbacks del post

---

## 9. Publicación automática de posts programados

El proyecto incluye un endpoint protegido para publicar posts vencidos:

```txt
POST /api/cron/publish-scheduled
```

### Requisitos

Debes enviar el secret correcto en headers.

Header soportado:

```txt
x-cron-secret: TU_CRON_SECRET
```

### Ejemplo en PowerShell

```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/cron/publish-scheduled" -Headers @{ "x-cron-secret" = "TU_CRON_SECRET" }
```

### Qué hace

- busca posts con estado `SCHEDULED`
- revisa si `scheduledAt <= now`
- cambia el estado a `PUBLISHED`
- llena `publishedAt`
- limpia `scheduledAt`
- crea una revisión `AUTO_PUBLISHED`
- revalida `/posts` y `/posts/[slug]`

### Seguridad

- sin secret correcto responde `401`
- abrir la ruta en el navegador por `GET` no sirve para probarlo

---

## Flujo recomendado de uso

### Flujo manual

1. iniciar sesión en `/admin/login`
2. crear categorías
3. crear post manualmente
4. revisar contenido y SEO
5. guardar como `DRAFT`, `PENDING`, `SCHEDULED` o `PUBLISHED`
6. verificar la vista pública en `/posts`

### Flujo con IA asistida

1. iniciar sesión en `/admin/login`
2. entrar a `/admin/posts/new`
3. completar el bloque “Generar borrador con IA”
4. pulsar “Generar borrador”
5. revisar el contenido cargado en el formulario inferior
6. corregir manualmente lo necesario
7. guardar el post usando el flujo editorial actual

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

## Manejo de errores conocido en Fase 5

El flujo de IA ya contempla estos casos:

- input inválido
- sesión inválida
- configuración incompleta
- respuesta inválida del proveedor
- error del proveedor
- cuota agotada o facturación inactiva de la API

Si la generación falla:

- se muestra un mensaje visible
- no se rompe la página
- el admin puede corregir el input y reintentar

---

## Nota sobre warnings de hidratación

Durante desarrollo puede aparecer un warning relacionado con hidratación si alguna extensión del navegador inyecta atributos extra en los inputs antes de que React hidrate.

Eso no forma parte de la lógica del proyecto.

Para probar con menos ruido:

- usa ventana privada
- o desactiva extensiones del navegador durante pruebas funcionales

---

## Pruebas funcionales validadas en Fase 4

Se validó correctamente:

- creación de posts en `DRAFT`
- creación de posts en `PUBLISHED`
- creación de posts en `PENDING`
- creación de posts en `SCHEDULED`
- validación de `SCHEDULED` sin fecha
- slugs únicos automáticos
- edición de posts
- categorías con descripción
- asignación de categorías
- visibilidad pública solo de `PUBLISHED`
- detalle público por slug
- filtro por categoría
- cron protegido
- publicación automática de posts vencidos
- no publicación de posts futuros
- revisiones visibles
- revisión `AUTO_PUBLISHED`
- `robots.txt`
- `sitemap.xml`
- metadata SEO de detalle público
- protección de `/admin`

---

## Pruebas funcionales validadas en Fase 5

Se validó correctamente:

- carga de `/admin/posts/new`
- render del bloque “Generar borrador con IA”
- validación local de tema obligatorio
- generación exitosa de borrador
- inyección del borrador al formulario principal
- relleno de `title`, `excerpt`, `content`, `seoTitle` y `seoDescription`
- generación automática de `slug` desde el título
- mantenimiento de `status = DRAFT` por defecto
- edición manual posterior al generado
- guardado correcto del post generado con IA
- supervivencia del flujo manual sin IA
- regeneración de borradores
- categoría inexistente sin romper el flujo
- manejo de errores del proveedor sin romper la UI
- protección del flujo por sesión
- confirmación del límite real de no browsing en vivo
- confirmación de que la IA no publica automáticamente

---

## Criterio de terminado de Fase 5

Fase 5 se considera terminada porque ya se cumple esto:

- el admin puede generar un borrador con IA desde `/admin/posts/new`
- el resultado se valida y normaliza
- el formulario principal se rellena automáticamente
- el contenido sigue siendo editable
- el guardado usa el flujo editorial existente
- el flujo manual sigue funcionando
- los errores no rompen el admin
- no hay publicación automática desde la IA

---

## Próxima fase sugerida

La siguiente fase recomendada puede ir por una de estas rutas:

### Ruta 1: calidad editorial

- regenerar solo partes específicas
- mejorar prompts
- mejorar mapeo de categorías
- pulir UX del generador

### Ruta 2: producto

- historial de generaciones
- métricas de uso de IA
- generación de copy para redes
- nuevas herramientas editoriales asistidas

---

## Licencia

Uso interno / proyecto personal en evolución.