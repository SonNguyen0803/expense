# Quick Fix for Build Errors

Các lỗi chính và cách sửa:

## 1. AppComponent template error
File `src/app/app.html` có lỗi cú pháp. Thay bằng template đơn giản:

```html
<router-outlet />
```

## 2. Property initialization errors
Trong tất cả components, move property initialization vào constructor:

### Before:
```typescript
currentFamily = this.familyRepo.selectedFamily;

constructor(private familyRepo: FamilyRepository) {}
```

### After:
```typescript
currentFamily;

constructor(private familyRepo: FamilyRepository) {
  this.currentFamily = this.familyRepo.selectedFamily;
}
```

## 3. parseFloat errors
Replace `parseFloat` with `Number`:

```typescript
// Before
formatCurrency(parseFloat(transaction.amount))

// After
formatCurrency(Number(transaction.amount))
```

## Files to fix:
- src/app/app.html (simplify)
- src/app/features/dashboard/dashboard.component.ts
- src/app/features/transactions/transaction-list/transaction-list.component.ts
- Already fixed in previous edits
```