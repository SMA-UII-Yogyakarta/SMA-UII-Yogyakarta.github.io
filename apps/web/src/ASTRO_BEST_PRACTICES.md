# 📚 Astro Best Practices - Component Composition

## ⚠️ CRITICAL: Jangan Gunakan Template Strings untuk HTML di Astro

### ❌ SALAH - HTML akan ter-escape menjadi text

```astro
---
// DON'T DO THIS!
---
<div>
  {Array.from({ length: 6 }).map(() => `
    <div class="bg-gray-900 animate-pulse">
      <div class="h-4 bg-gray-800"></div>
    </div>
  `).join('')}
</div>
```

**Result:** HTML ter-escape: `<div class="...">` (ditampilkan sebagai text!)

---

### ✅ BENAR - Gunakan JSX-like Syntax

```astro
---
// DO THIS!
---
<div>
  {Array.from({ length: 6 }).map(() => (
    <div class="bg-gray-900 animate-pulse">
      <div class="h-4 bg-gray-800"></div>
    </div>
  ))}
</div>
```

**Result:** HTML ter-render dengan benar sebagai UI component!

---

## 🎯 Rules

### Rule 1: Always Use JSX Syntax for HTML in Expressions

| Pattern | Status | Reason |
|---------|--------|--------|
| `{items.map(i => (<div>{i}</div>))}` | ✅ | Proper JSX, ter-render |
| `{items.map(i => `<div>${i}</div>`).join('')}` | ❌ | String, ter-escape |
| `{htmlString}` | ❌ | String, ter-escape |
| `<Component />` | ✅ | Component, ter-render |

### Rule 2: Use `set:html` ONLY for Trusted Content

Jika HARUS menggunakan HTML string (dari API/cms):

```astro
---
const htmlContent = '<div class="trusted">Safe HTML</div>';
---
<!-- ONLY if you trust the source! -->
<div set:html={htmlContent} />
```

⚠️ **Warning:** `set:html` bypasses escaping - XSS risk!

### Rule 3: Client-Side Rendering dengan innerHTML

Di client-side script, `innerHTML` masih bisa digunakan:

```astro
<script>
  const grid = document.getElementById('grid');
  
  // OK di client-side script
  grid.innerHTML = items.map(item => `
    <div class="card">${item.title}</div>
  `).join('');
</script>
```

**Kenapa OK?** Karena di client-side, browser parse HTML string dengan benar.

---

## 🔍 How to Detect

### Code Review Checklist:

- [ ] Ada `.map(() => \`` (backtick)?
- [ ] Ada `.join('')` setelah map?
- [ ] Ada string template dengan HTML di dalamnya?

Jika **YA** → **REFACTOR** ke JSX syntax!

### Visual Test:

1. Buka page di browser
2. Inspect element (klik kanan → Inspect)
3. Jika lihat `<div>` di Elements tab → **SALAH**
4. Jika lihat `<div>` dengan styling → **BENAR**

---

## 📖 Examples

### Example 1: Skeleton Loading

❌ **Wrong:**
```astro
<div class="grid">
  {Array.from({ length: 3 }).map(() => `
    <div class="bg-gray-900 p-4 animate-pulse">
      <div class="h-4 bg-gray-800"></div>
    </div>
  `).join('')}
</div>
```

✅ **Correct:**
```astro
<div class="grid">
  {Array.from({ length: 3 }).map(() => (
    <div class="bg-gray-900 p-4 animate-pulse">
      <div class="h-4 bg-gray-800"></div>
    </div>
  ))}
</div>
```

### Example 2: Dynamic Content

❌ **Wrong:**
```astro
---
const items = ['A', 'B', 'C'];
---
<ul>
  {items.map(item => `<li>${item}</li>`).join('')}
</ul>
```

✅ **Correct:**
```astro
---
const items = ['A', 'B', 'C'];
---
<ul>
  {items.map(item => (
    <li>{item}</li>
  ))}
</ul>
```

### Example 3: Conditional Rendering

❌ **Wrong:**
```astro
---
const showBanner = true;
---
{showBanner ? `
  <div class="banner">Hello!</div>
` : ''}
```

✅ **Correct:**
```astro
---
const showBanner = true;
---
{showBanner && (
  <div class="banner">Hello!</div>
)}
```

---

## 🛠️ Refactoring Steps

1. **Find** semua instance dengan grep:
   ```bash
   grep -r "\.map.*=>" apps/web/src/pages --include="*.astro" | grep "`"
   ```

2. **Replace** template strings dengan JSX:
   - Ganti backticks (\`) dengan parentheses `()`
   - Hapus `.join('')`
   - Pastikan proper indentation

3. **Test** di browser:
   - Inspect element
   - Verify HTML ter-render, bukan text

4. **Commit** dengan message:
   ```
   fix: refactor template strings to JSX syntax in [file].astro
   
   - Prevent HTML escaping issue
   - Follow Astro best practices
   ```

---

## 📚 References

- [Astro Template Expressions](https://docs.astro.build/en/guides/astro-syntax/#template-expressions)
- [JSX in Astro](https://docs.astro.build/en/guides/astro-syntax/#jsx-like-syntax)
- [set:html Directive](https://docs.astro.build/en/reference/directives-reference/#sethtml)

---

## 🚨 Common Pitfalls

### Pitfall 1: Mixing JSX and Strings

```astro
<!-- DON'T: Mix and match -->
<div>
  {items.map(i => `<div>${i.title}</div>`)}
  {items.map(i => (<div>{i.title}</div>))}
</div>

<!-- DO: Consistent JSX -->
<div>
  {items.map(i => (<div>{i.title}</div>))}
</div>
```

### Pitfall 2: Forgetting Parentheses

```astro
<!-- DON'T: Missing parentheses -->
{items.map(i => <div>{i}</div>)}

<!-- DO: With parentheses for multi-line -->
{items.map(i => (
  <div>{i}</div>
))}
```

### Pitfall 3: Using join() Unnecessarily

```astro
<!-- DON'T: join() is for strings -->
{items.map(i => (<div>{i}</div>)).join('')}

<!-- DO: Map returns array, Astro handles rendering -->
{items.map(i => (<div>{i}</div>))}
```

---

**Last Updated:** 2026-06-19  
**Author:** Development Team  
**Status:** Active
