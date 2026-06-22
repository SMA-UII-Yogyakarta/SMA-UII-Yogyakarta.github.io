# UI Components Library

Reusable, accessible, and composable UI components for SMA UII Lab.

## 📦 Components

### Layout Components

#### `<Stack>`
Vertical or horizontal stack with consistent spacing.

```astro
<Stack direction="vertical" gap="md" align="center">
  <p>Item 1</p>
  <p>Item 2</p>
</Stack>
```

**Props:**
- `direction`: 'vertical' | 'horizontal' (default: 'vertical')
- `gap`: 'xs' | 'sm' | 'md' | 'lg' | 'xl' (default: 'md')
- `align`: 'start' | 'center' | 'end' | 'stretch' (default: 'start')
- `justify`: 'start' | 'center' | 'end' | 'between' | 'around' (default: 'start')

---

#### `<Grid>`
Responsive grid layout.

```astro
<Grid cols={3} gap="lg">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</Grid>
```

**Props:**
- `cols`: 1 | 2 | 3 | 4 | 'auto' (default: 1)
- `gap`: 'xs' | 'sm' | 'md' | 'lg' | 'xl' (default: 'md')

---

#### `<Divider>`
Horizontal divider with optional label.

```astro
<Divider label="Or" />
```

**Props:**
- `label`: Optional text
- `variant`: 'solid' | 'dashed' | 'dotted' (default: 'solid')

---

### Data Display

#### `<StatCard>`
Statistics card with icon, value, and description.

```astro
<StatCard 
  icon="👥" 
  label="Total Members" 
  value="1,234" 
  description="5 pending"
  href="/members"
/>
```

**Props:**
- `icon`: Emoji or text icon
- `label`: Card label (required)
- `value`: Main value (required)
- `description`: Optional description
- `href`: Makes card clickable
- `onClick`: Click handler

---

#### `<Avatar>`
User avatar with image fallback to initial.

```astro
<Avatar name="John Doe" src="/avatar.jpg" size="lg" variant="ringed" />
```

**Props:**
- `name`: User name (required, for alt and fallback)
- `src`: Optional image URL
- `size`: 'sm' | 'md' | 'lg' | 'xl' (default: 'md')
- `variant`: 'solid' | 'outlined' | 'ringed' (default: 'solid')

---

#### `<AvatarListItem>`
List item with avatar, metadata, and actions.

```astro
<AvatarListItem
  avatar="/avatar.jpg"
  name="John Doe"
  description="john@example.com"
  metadata={[{ label: 'Active', variant: 'success' }]}
  href="/members/123"
>
  <Fragment slot="actions">
    <IconButton icon="⚙️" label="Settings" />
  </Fragment>
</AvatarListItem>
```

**Props:**
- `avatar`: Optional image URL
- `name`: Required name
- `description`: Optional description
- `metadata`: Array of badges
- `href`: Makes item clickable
- `onClick`: Click handler

---

#### `<Badge>`
Colored badge/tag.

```astro
<Badge label="Active" variant="success" icon="✓" />
```

**Props:**
- `label`: Badge text (required)
- `variant`: 'default' | 'success' | 'warning' | 'error' | 'info' (default: 'default')
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `icon`: Optional emoji icon

---

### Form Components

#### `<InputGroup>`
Form input with label, error, and hint.

```astro
<InputGroup
  id="email"
  label="Email"
  type="email"
  value={email}
  placeholder="you@example.com"
  required
  error={errors.email}
  hint="We'll never share your email"
/>
```

**Props:**
- `id`: Input ID (required)
- `label`: Input label (required)
- `type`: Input type (default: 'text')
- `value`: Input value
- `placeholder`: Placeholder text
- `required`: Required field
- `disabled`: Disabled state
- `error`: Error message
- `hint`: Hint text

---

#### `<SelectGroup>`
Form select with label, error, and hint.

```astro
<SelectGroup
  id="track"
  label="Track"
  options={[
    { value: 'se', label: 'Software Engineering' },
    { value: 'ds', label: 'Data Science' }
  ]}
  value={selectedTrack}
  error={errors.track}
/>
```

**Props:**
- `id`: Select ID (required)
- `label`: Select label (required)
- `options`: Array of { value, label } (required)
- `value`: Selected value
- `required`: Required field
- `disabled`: Disabled state
- `error`: Error message
- `hint`: Hint text

---

### Pattern Components

#### `<FilterBar>`
Search and filter bar.

```astro
<FilterBar
  filters={[
    { value: '', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending' }
  ]}
  activeFilter={currentFilter}
  onFilterChange={(value) => setFilter(value)}
  searchValue={searchQuery}
  onSearchChange={(value) => setSearch(value)}
  searchPlaceholder="Search members..."
/>
```

**Props:**
- `filters`: Array of { value, label } (required)
- `activeFilter`: Current filter value (required)
- `onFilterChange`: Filter change callback
- `searchValue`: Current search value
- `onSearchChange`: Search change callback
- `searchPlaceholder`: Placeholder text
- `showSearch`: Show search input (default: true)

---

#### `<SectionCard>`
Section card with header and content slots.

```astro
<SectionCard title="Recent Members" action="View all" actionHref="/members">
  <p>Content here...</p>
  
  <Fragment slot="footer">
    <p>Footer content</p>
  </Fragment>
</SectionCard>
```

**Props:**
- `title`: Section title
- `subtitle`: Optional subtitle
- `action`: Action button text
- `actionHref`: Action link
- `onAction`: Action click handler

**Slots:**
- `default`: Main content
- `header`: Custom header (overrides title/subtitle)
- `footer`: Optional footer

---

#### `<Card>`
Generic card container with slots.

```astro
<Card title="Card Title" variant="hover" padding="lg">
  <p>Card content...</p>
  
  <Fragment slot="footer">
    <button>Footer action</button>
  </Fragment>
</Card>
```

**Props:**
- `title`: Card title
- `subtitle`: Optional subtitle
- `href`: Makes card clickable
- `onClick`: Click handler
- `variant`: 'default' | 'hover' | 'interactive' (default: 'default')
- `padding`: 'none' | 'sm' | 'md' | 'lg' (default: 'md')

**Slots:**
- `default`: Card content
- `header`: Custom header
- `footer`: Custom footer

---

#### `<IconButton>`
Button or link with icon.

```astro
<IconButton
  icon="📊"
  label="View Stats"
  variant="primary"
  size="lg"
  onClick={handleClick}
/>

<IconButton
  icon="🔗"
  label="External Link"
  href="https://example.com"
  variant="bordered"
/>
```

**Props:**
- `icon`: SVG path or emoji
- `label`: Button text (required)
- `href`: Makes it a link
- `onClick`: Click handler
- `variant`: 'primary' | 'secondary' | 'bordered' | 'ghost' (default: 'secondary')
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `disabled`: Disabled state
- `ariaLabel`: Accessibility label (defaults to label)

---

## 🎨 Design Tokens

### Colors
All components use the existing Tailwind color palette:
- Primary: `blue-600`, `blue-500`, `blue-400`
- Success: `green-500/20`, `green-400`
- Warning: `yellow-500/20`, `yellow-400`
- Error: `red-500/20`, `red-400`
- Info: `blue-500/20`, `blue-400`
- Neutral: `gray-900`, `gray-800`, `gray-700`, `gray-400`

### Spacing
- `xs`: 0.25rem (gap-1)
- `sm`: 0.5rem (gap-2)
- `md`: 0.75rem (gap-3)
- `lg`: 1rem (gap-4)
- `xl`: 1.5rem (gap-6)

### Typography
- Text sizes: 'xs', 'sm', 'md', 'lg', 'xl'
- Font weights: 'medium', 'semibold', 'bold'

---

## ♿ Accessibility

All components follow accessibility best practices:
- Proper ARIA attributes
- Keyboard navigation support
- Focus indicators (`focus-visible:ring-2`)
- Screen reader friendly
- Semantic HTML

---

## 📝 Migration Guide

### Before (Duplication)
```astro
<div class="bg-gray-900 border border-gray-800 rounded-xl p-4">
  <div class="flex items-center gap-2 mb-2">
    <span class="text-lg">👥</span>
    <span class="text-xs text-gray-400">Total Members</span>
  </div>
  <p class="text-2xl font-bold">1,234</p>
  <p class="text-xs text-gray-500">5 pending</p>
</div>
```

### After (Reusable)
```astro
<StatCard 
  icon="👥" 
  label="Total Members" 
  value="1,234" 
  description="5 pending"
/>
```

---

## 🚀 Best Practices

1. **Use composition over duplication** - Extract patterns to components
2. **Use slots for flexibility** - Allow custom content injection
3. **Keep components focused** - One responsibility per component
4. **Document props with JSDoc** - Help future developers
5. **Test accessibility** - Use screen readers and keyboard navigation
6. **Follow naming conventions** - PascalCase for components, kebab-case for props