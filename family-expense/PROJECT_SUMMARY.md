# Family Expense Management - Project Summary

## Tổng quan dự án

Ứng dụng web quản lý chi tiêu gia đình được xây dựng với Angular 21 và Supabase. Ứng dụng cho phép nhiều thành viên trong một gia đình cùng quản lý thu chi, theo dõi ngân sách và xem báo cáo chi tiết.

## Kiến trúc

```
Angular 21 Frontend
        │
        ├─── Supabase Client
        │
        └─── Supabase Backend
                │
                ├─── PostgreSQL Database
                ├─── Authentication
                ├─── Row Level Security
                └─── Realtime
```

## Công nghệ sử dụng

- **Frontend Framework**: Angular 21 (Standalone Components)
- **State Management**: Angular Signals
- **UI Framework**: Tailwind CSS
- **Charts**: Apache ECharts với ngx-echarts
- **Backend**: Supabase
  - PostgreSQL database
  - Authentication
  - Row Level Security (RLS)
  - Realtime subscriptions
- **Language**: TypeScript

## Cấu trúc Database

### Tables

1. **profiles** - Thông tin người dùng
   - Liên kết với `auth.users`
   - Theme preference
   - Avatar URL

2. **families** - Thông tin gia đình
   - Tên gia đình
   - Owner
   - Currency (VND, USD, etc.)

3. **family_members** - Thành viên gia đình
   - User reference
   - Display name
   - Role (OWNER, ADMIN, MEMBER, VIEWER)

4. **categories** - Danh mục thu/chi
   - Tên, icon, màu
   - Type (INCOME/EXPENSE)
   - Default hoặc custom

5. **transactions** - Giao dịch
   - Amount (NUMERIC 15,2)
   - Category, Member
   - Transaction date
   - Note

6. **budgets** - Ngân sách
   - Amount per category per month
   - Tracking spending vs budget

### Row Level Security

Tất cả bảng có RLS policies đảm bảo:
- User chỉ truy cập dữ liệu của family mình là member
- Role-based access control
- Transaction ownership validation

## Tính năng đã implement

### ✅ Core Features

1. **Authentication**
   - Đăng ký/Đăng nhập với email/password
   - Supabase Auth integration
   - Session management
   - Auto-create profile on signup

2. **Family Management**
   - Tạo family mới
   - Xem danh sách families
   - Switch giữa các families
   - View members

3. **Transaction Management**
   - Thêm transaction (INCOME/EXPENSE)
   - List transactions với details
   - Filter by type, category, member, date
   - Realtime updates

4. **Category Management**
   - Default categories (không thể xóa)
   - Custom categories per family
   - Grouped by type (Income/Expense)

5. **Dashboard**
   - Tổng thu/chi/số dư
   - Pie chart: Expense by category
   - Bar chart: Income vs Expense trend
   - Recent transactions list
   - Responsive charts với ECharts

6. **Responsive Design**
   - Desktop: Sidebar navigation
   - Mobile: Bottom navigation + FAB button
   - Adaptive layouts
   - Touch-friendly UI

### 🚧 TODO Features

1. **Budget Management**
   - Set budget per category
   - Track spending vs budget
   - Alerts when exceeding budget

2. **Advanced Reports**
   - Monthly/yearly reports
   - Category trends
   - Member spending analysis
   - Export to CSV/Excel

3. **Transaction Edit**
   - Edit existing transactions
   - Delete transactions
   - Validation based on role

4. **Member Management**
   - Invite members via email
   - Change member roles
   - Remove members

5. **Dark Mode**
   - Toggle theme
   - Persist preference
   - System theme detection

6. **Additional Features**
   - Recurring transactions
   - Multi-currency support
   - Transaction attachments
   - Notifications

## Cấu trúc Code

```
src/app/
│
├── core/                           # Core services và infrastructure
│   ├── auth/
│   │   └── auth.service.ts        # Authentication logic
│   ├── guards/
│   │   └── auth.guard.ts          # Route protection
│   ├── models/
│   │   ├── database.types.ts      # Supabase types
│   │   └── index.ts               # Domain models
│   ├── services/
│   │   ├── family.repository.ts   # Family & members data
│   │   ├── category.repository.ts # Categories data
│   │   └── transaction.repository.ts  # Transactions data
│   └── supabase/
│       └── supabase.service.ts    # Supabase client wrapper
│
├── features/                       # Feature modules
│   ├── auth/
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── dashboard/                 # Dashboard với charts
│   ├── transactions/
│   │   ├── transaction-list/
│   │   └── transaction-form/
│   ├── categories/
│   ├── budgets/                   # TODO
│   ├── reports/                   # TODO
│   ├── family/
│   │   ├── family-settings/
│   │   └── members/
│   └── settings/
│
├── shared/                         # Shared components (future)
│   ├── components/
│   ├── pipes/
│   └── directives/
│
├── app.config.ts                   # App configuration
├── app.routes.ts                   # Route definitions
└── app.ts                          # Root component
```

## Security

### Authentication
- Supabase Auth quản lý hoàn toàn
- JWT tokens
- Session persistence
- Secure password hashing

### Row Level Security
- Policies cho tất cả tables
- User chỉ truy cập dữ liệu của families mình
- Role-based permissions
- Helper functions: `is_family_member()`, `is_family_admin()`, `is_family_owner()`

### Frontend Security
- **KHÔNG** sử dụng `service_role_key`
- Chỉ sử dụng `anon_key` (publishable)
- Tất cả security enforcement ở database level
- No trust trong client-side validation

## State Management

Sử dụng Angular Signals:

```typescript
// Repository pattern với Signals
private transactions = signal<Transaction[]>([]);
allTransactions = this.transactions.asReadonly();

// Computed values
totalExpense = computed(() => 
  this.transactions()
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + Number(t.amount), 0)
);

// Effects
effect(() => {
  if (this.isAuthenticated()) {
    this.loadFamilies();
  }
});
```

## Patterns & Best Practices

### Repository Pattern
- Tách logic data access khỏi components
- Centralized data management
- Easy to test và mock

### Reactive Forms
- Strong validation
- Type-safe
- Easy error handling

### Standalone Components
- No NgModules
- Lazy loading
- Tree-shakeable

### Responsive Design
- Mobile-first approach
- Breakpoints: sm, md, lg
- Bottom nav trên mobile
- Sidebar trên desktop

## Performance Considerations

1. **Lazy Loading**
   - All routes lazy loaded
   - Components loaded on demand

2. **Signals**
   - Fine-grained reactivity
   - Automatic change detection optimization

3. **Database**
   - Indexes on foreign keys
   - Efficient queries với proper JOINs
   - Pagination ready (not yet implemented)

4. **Realtime**
   - Subscribe chỉ khi cần
   - Unsubscribe on destroy
   - Channel per family

## Testing Strategy

### Unit Tests
- Services và repositories
- Business logic
- Calculations (amounts, percentages)
- Permission checks

### Integration Tests
- Component interactions
- Form validation
- Navigation flows

### E2E Tests (Future)
- Complete user flows
- Cross-browser testing

## Deployment

### Development
```bash
supabase start
npm start
```

### Production
1. **Supabase**: Cloud hoặc self-hosted
2. **Angular**: Vercel, Netlify, hoặc static hosting
3. **Environment**: Configure production URLs và keys

## Known Limitations

1. **Single Currency per Family**
   - Chưa hỗ trợ multi-currency trong cùng family
   - Exchange rates chưa có

2. **No Transaction History**
   - Không track transaction edits
   - Không có audit log

3. **Basic Member Management**
   - Chưa có email invitation
   - Chưa có member profile details

4. **No Offline Support**
   - Yêu cầu internet connection
   - Không có local caching strategies

## Future Enhancements

### Phase 2
- Complete budget management
- Advanced reports với filters
- Transaction edit/delete
- Dark mode implementation

### Phase 3
- Member invitation workflow
- Recurring transactions
- Budget alerts và notifications
- Transaction attachments

### Phase 4
- Multi-currency support
- Export/import data
- Mobile apps (React Native/Flutter)
- Advanced analytics với AI insights

## Documentation

- `README.md` - Tổng quan và quick start
- `SETUP.md` - Chi tiết setup instructions
- `PROJECT_SUMMARY.md` - Tài liệu này
- Code comments - Inline documentation

## Contribution Guidelines

1. Follow Angular style guide
2. Use Signals over RxJS where possible
3. Write tests for new features
4. Update migrations for schema changes
5. Document RLS policies
6. Keep components small và focused

## Support & Maintenance

- Regular Angular updates
- Supabase SDK updates
- Security patches
- Bug fixes
- Feature requests via GitHub issues

---

**Project Status**: MVP Complete ✅

**Next Priority**: Budget Management, Transaction Edit, Member Invitation

**Maintained by**: Development Team

**Last Updated**: 2026-08-26