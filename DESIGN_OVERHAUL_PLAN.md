# E5 Chronicles Design Unification Plan

## Issues Found

1. **Login Page**: sky-blue gradient, completely different primary accent (sky-500 vs M3 orange)
2. **Theme Toggle**: hardcoded zinc/sky colors instead of M3 tokens
3. **Table Pages** (attendance, invoices, expenses, employees, clients): hardcoded zinc-900/zinc-800/zinc-200 classes instead of M3 surface/outline tokens
4. **Invoice/Expense Detail**: hardcoded badge colors, zinc border/background
5. **Employee Task Card**: hardcoded zinc classes
6. **Badge Colors**: inconsistent - some use M3 tokens, some use hardcoded emerald/sky/amber
7. **Template Files**: redundant double-wrapping with PageTransition
8. **Morph Animations**: not applied consistently across interactive elements
9. **Filter bars**: inconsistent styling between pages

## Fix Strategy

### Phase 1: Core Infrastructure
- ✅ globals.css already has excellent M3 design system and morph animations

### Phase 2: Fix Inconsistent Pages (9 files)
- Login page → match M3 orange identity
- Theme toggle → M3 tokens
- Attendance pages → M3 tokens
- Invoice/Expense tables → M3 tokens
- Employees/Clients pages → M3 tokens
- Invoice detail → M3 tokens
- Employee task-card → M3 tokens

### Phase 3: Template Unification
- Remove redundant template.tsx files (handled by layout.tsx)

### Phase 4: Animation Enhancement
- Ensure morph animations on all interactive elements
- Add framer-motion page transitions
- Stagger load animations

### Phase 5: Verify
- TypeScript check
- Build check
- Visual consistency review
