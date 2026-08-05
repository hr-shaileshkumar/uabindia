# ERP UI Component Library

This directory contains the reusable UI component library for the ERP application. All components follow the ERP design system with support for light/dark themes and ERP design tokens.

## Components

### Base Components

| Component | Description | Status |
|-----------|-------------|--------|
| `Button` | Interactive button with semantic variants | ✅ |
| `Input` | Text input field with ERP styling | ✅ |
| `Textarea` | Multi-line text input | ✅ |
| `Card` | Container component with header/footer | ✅ |
| `Table` | Data table structure | ✅ |
| `Badge` | Status labels and tags | ✅ |
| `Alert` | System messages with variant types | ✅ |
| `Switch` | Toggle switch component | ✅ |

### UI Patterns

| Component | Description | Status |
|-----------|-------------|--------|
| `DashboardCard` | Dashboard-specific card variant | ✅ |
| `EntityProfileCard` | Entity profile display | ✅ |
| `GlobalDrawer` | Global side drawer | ✅ |
| `QuickEditDrawer` | Quick edit functionality | ✅ |

### Dialog Components

| Component | Description | Status |
|-----------|-------------|--------|
| `Dialog` | Modal dialog | ✅ |
| `Sheet` | Sheet drawer | ✅ |

### Interactive Components

| Component | Description | Status |
|-----------|-------------|--------|
| `Checkbox` | Checkbox input | ✅ |
| `DropdownMenu` | Dropdown menu | ✅ |
| `Tabs` | Tab navigation | ✅ |

### Loading States

| Component | Description | Status |
|-----------|-------------|--------|
| `Skeleton` | Loading skeleton | ✅ |

### Utilities

| Component | Description | Status |
|-----------|-------------|--------|
| `useConfirmDialog` | Confirm dialog hook | ✅ |

## Usage

### Import Components

```tsx
import { Button, Input, Alert, Badge, Switch } from "@/components/ui";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableRow, TableHeader } from "@/components/ui/table";
```

### Design Tokens

All components use ERP design tokens defined in `globals.css`:

```css
--erp-primary: #4f46e5;
--erp-primary-hover: #4338ca;
--erp-border: #e2e8f0;
--erp-ink: #0f172a;
--erp-muted: #475569;
```

### Theme Support

Components support both light and dark themes automatically. Use `next-themes` to toggle themes:

```tsx
import { ThemeProvider } from "@/components/layout/ThemeProvider";

<ThemeProvider>
  <App />
</ThemeProvider>
```

## Component Variants

### Button Variants

```tsx
<Button variant="default">Primary</Button>      // Main action
<Button variant="secondary">Secondary</Button>   // Supporting action
<Button variant="outline">Outline</Button>       // Outlined button
<Button variant="ghost">Ghost</Button>           // Text only
<Button variant="destructive">Delete</Button>    // Danger action
<Button variant="success">Approve</Button>       // Success action
<Button variant="warning">Flag</Button>          // Warning action
```

### Alert Variants

```tsx
<Alert variant="info">Information message</Alert>
<Alert variant="success">Success message</Alert>
<Alert variant="warning">Warning message</Alert>
<Alert variant="error">Error message</Alert>
<Alert variant="default">Default message</Alert>
<Alert variant="destructive">Destructive message</Alert>
```

### Badge Variants

```tsx
<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Destructive</Badge>
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="info">Info</Badge>
```

## Best Practices

1. **Use ERP Design Tokens**: Always use CSS variables instead of hardcoded colors
2. **Maintain Consistent Spacing**: Use ERP spacing tokens for padding and margins
3. **Accessibility**: All components are built on Radix UI primitives for ARIA compliance
4. **TypeScript**: All components have explicit TypeScript interfaces
5. **Responsive**: Components work on all screen sizes by default

## Testing

Components use `vitest` for testing. Run tests with:

```bash
npm run test
```

## Adding New Components

1. Create component file in `/src/components/ui/`
2. Use ERP design tokens in CSS
3. Add JSDoc documentation with examples
4. Export component from `index.ts` if needed
5. Add to this README with status
