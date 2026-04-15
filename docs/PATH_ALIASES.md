# Path Aliases Configuration

Project ini menggunakan TypeScript path aliases untuk import yang lebih clean dan maintainable.

## Available Aliases

```typescript
@/*              → src/*
@components/*    → src/components/*
@layouts/*       → src/layouts/*
@pages/*         → src/pages/*
@lib/*           → src/lib/*
@db              → src/db/index.ts
@db/*            → src/db/*
@styles/*        → src/styles/*
```

## Usage Examples

### Before (Relative Imports)

```typescript
// ❌ Panjang dan susah maintain
import Layout from '../../../layouts/Layout.astro';
import { lucia } from '../../../lib/auth';
import { db } from '../../../db';
import { users } from '../../../db/schema';
import RegisterForm from '../../../components/RegisterForm';
```

### After (Path Aliases)

```typescript
// ✅ Clean dan mudah dibaca
import Layout from '@layouts/Layout.astro';
import { lucia } from '@lib/auth';
import { db } from '@db';
import { users } from '@db/schema';
import RegisterForm from '@components/RegisterForm';
```

## Configuration

### tsconfig.json

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@layouts/*": ["src/layouts/*"],
      "@pages/*": ["src/pages/*"],
      "@lib/*": ["src/lib/*"],
      "@db": ["src/db/index.ts"],
      "@db/*": ["src/db/*"],
      "@styles/*": ["src/styles/*"]
    }
  }
}
```

### Astro Config

Astro secara otomatis mendukung TypeScript path aliases dari `tsconfig.json`. Tidak perlu konfigurasi tambahan.

## Common Patterns

### Components

```typescript
// React components
import RegisterForm from '@components/RegisterForm';
import MemberCard from '@components/MemberCard';

// Astro components (dalam .astro files)
import Layout from '@layouts/Layout.astro';
import Header from '@components/Header.astro';
```

### Database

```typescript
// Database client
import { db } from '@db';

// Schema & types
import { users, memberTracks, sessions } from '@db/schema';
import type { User, MemberCard } from '@db/schema';
```

### Library Functions

```typescript
// Auth
import { lucia } from '@lib/auth';
import { github } from '@lib/oauth';

// Validation
import { registerSchema, trackOptions } from '@lib/validation';
```

### Styles

```typescript
// Global styles (dalam Layout)
import '@styles/global.css';
```

### API Routes

```typescript
// Dalam src/pages/api/auth/github/callback.ts
import { github } from '@lib/oauth';  // ✅ Clean
// vs
import { github } from '../../../../lib/oauth';  // ❌ Messy
```

## IDE Support

### VS Code

Path aliases otomatis ter-detect dari `tsconfig.json`. Autocomplete dan Go to Definition akan bekerja dengan baik.

**Extensions yang direkomendasikan:**
- Astro
- TypeScript and JavaScript Language Features (built-in)
- Path Intellisense

### WebStorm / IntelliJ IDEA

Otomatis support TypeScript path aliases.

### Vim / Neovim

Gunakan LSP (TypeScript Language Server) untuk autocomplete:
- `typescript-language-server`
- `coc-tsserver` (untuk coc.nvim)

## Troubleshooting

### Import Error: Cannot find module '@lib/...'

1. Pastikan `tsconfig.json` sudah benar
2. Restart TypeScript server:
   - VS Code: `Cmd/Ctrl + Shift + P` → "TypeScript: Restart TS Server"
3. Rebuild project: `pnpm build`

### Autocomplete Tidak Muncul

1. Check `tsconfig.json` syntax
2. Pastikan file ada di `include` path
3. Restart IDE

### Build Error

Jika build error tapi TypeScript tidak complain:
1. Check apakah path alias benar
2. Pastikan file yang di-import ada
3. Clear cache: `rm -rf .astro dist node_modules/.vite`

## Migration Guide

Jika ada file lama dengan relative imports:

```bash
# Find all relative imports
grep -r "from '\.\." src/

# Replace manually atau gunakan script
# Contoh: '../lib/auth' → '@lib/auth'
```

## Best Practices

### ✅ Do

```typescript
// Gunakan alias untuk cross-directory imports
import { lucia } from '@lib/auth';
import Layout from '@layouts/Layout.astro';

// Gunakan relative untuk same-directory imports
import { helper } from './helper';
import type { LocalType } from './types';
```

### ❌ Don't

```typescript
// Jangan gunakan alias untuk same-directory
import { helper } from '@lib/helper';  // ❌ Overkill

// Jangan mix relative dan alias untuk hal yang sama
import { lucia } from '../lib/auth';  // ❌ Inconsistent
import { github } from '@lib/oauth';  // ✅ Consistent
```

## Scripts Compatibility

Path aliases juga bekerja di scripts (dengan Bun):

```typescript
// scripts/seed.ts
import { db } from '@db';
import { users } from '@db/schema';

// Run with Bun (native TypeScript support)
bun run scripts/seed.ts
```

Untuk Node.js, gunakan `tsx`:

```bash
pnpm add -D tsx
tsx scripts/seed.ts
```

## Summary

Path aliases membuat codebase lebih:
- **Readable** - Jelas dari mana import berasal
- **Maintainable** - Mudah refactor struktur folder
- **Scalable** - Tidak perlu hitung `../../../`
- **Consistent** - Semua import menggunakan pattern yang sama

Gunakan alias untuk semua cross-directory imports!
