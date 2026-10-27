# UI Registry

Living document. Updated after every component is built. Read this before building any new component and match existing patterns exactly before inventing new ones.

---

## How to Use

Before building any component:

1. Check if a similar component already exists here.
2. If yes, match its exact classes.
3. If no, build it following `ui-rules.md` and `ui-tokens.md`, then add it here.

After building any component, record: name, file path, props, and exact classes used.

### Entry format

```
### ComponentName
- Path: components/<area>/ComponentName.tsx
- Type: server | client
- Props: { ... }
- Classes: <exact key classes>
- Used in: <pages>
```

---

## Planned Components (build in this order, then move to the entries below)

| Component        | Path                                   | Phase |
| ---------------- | -------------------------------------- | ----- |
| Navbar           | `components/layout/Navbar.tsx`         | 1     |
| PageShell        | `components/layout/PageShell.tsx`      | 1     |
| StatusBadge      | `components/properties/StatusBadge.tsx`| 1     |
| PropertyCard     | `components/properties/PropertyCard.tsx`| 1    |
| PropertyGrid     | `components/properties/PropertyGrid.tsx`| 1    |
| SearchFilters    | `components/properties/SearchFilters.tsx`| 1   |
| Pagination       | `components/ui/Pagination.tsx`         | 1     |
| PropertyGallery  | `components/properties/PropertyGallery.tsx`| 1 |
| PropertyFacts    | `components/properties/PropertyFacts.tsx`| 1   |
| PropertyForm     | `components/properties/PropertyForm.tsx`| 1    |
| DashboardTable   | `components/dashboard/DashboardTable.tsx`| 1   |
| EmptyState       | `components/ui/EmptyState.tsx`         | 1     |
| AuthPageLayout   | `components/auth/AuthPageLayout.tsx`   | 1     |
| NavbarAuth       | `components/layout/NavbarAuth.tsx`     | 1     |
| MediaUploader    | `components/properties/MediaUploader.tsx`| 5   |
| ConfirmDialog    | `components/ui/ConfirmDialog.tsx`      | 2     |

---

## Components

_Empty. Components will be added here as they are built._
