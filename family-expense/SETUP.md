# Setup Guide - Family Expense Management

Hướng dẫn chi tiết để setup và chạy project từ đầu.

## Bước 1: Cài đặt Dependencies

```bash
cd family-expense
npm install
```

Dependencies sẽ được cài đặt:
- Angular 21
- Supabase JS Client
- ECharts và ngx-echarts
- Tailwind CSS
- TypeScript

## Bước 2: Cài đặt Supabase CLI

### Windows (PowerShell - chạy as Administrator)

```powershell
# Sử dụng Scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

Hoặc sử dụng npm:

```bash
npm install -g supabase
```

### macOS

```bash
brew install supabase/tap/supabase
```

### Linux

```bash
brew install supabase/tap/supabase
```

## Bước 3: Khởi tạo Supabase Local

```bash
# Start Supabase (PostgreSQL, Auth, Realtime, Studio)
supabase start
```

**Lưu ý**: Lần đầu chạy sẽ mất vài phút để download Docker images.

Sau khi start thành công, bạn sẽ thấy thông tin:

```
API URL: http://localhost:54321
GraphQL URL: http://localhost:54321/graphql/v1
DB URL: postgresql://postgres:postgres@localhost:54322/postgres
Studio URL: http://localhost:54323
Inbucket URL: http://localhost:54324
JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Bước 4: Apply Database Migrations

```bash
# Reset database và apply tất cả migrations
supabase db reset
```

Lệnh này sẽ:
1. Drop tất cả tables hiện tại (nếu có)
2. Apply migration từ `supabase/migrations/20260826000001_initial_schema.sql`
3. Tạo tables với RLS policies
4. Seed dữ liệu mẫu (default categories)

## Bước 5: Verify Database

Mở Supabase Studio tại `http://localhost:54323`

Kiểm tra:
- Tables đã được tạo: profiles, families, family_members, categories, transactions, budgets
- Default categories đã có trong bảng `categories`
- RLS đã được enable cho tất cả tables

## Bước 6: Start Angular Development Server

```bash
npm start
```

Angular dev server sẽ chạy tại `http://localhost:4200`

## Bước 7: Test Application

1. Mở browser tại `http://localhost:4200`
2. Đăng ký tài khoản mới
3. Đăng nhập
4. Tạo gia đình đầu tiên
5. Thêm giao dịch
6. Xem dashboard với charts

## Kiểm tra Database trong Supabase Studio

1. Mở `http://localhost:54323`
2. Vào Table Editor
3. Xem dữ liệu trong các tables:
   - `auth.users` - User accounts
   - `profiles` - User profiles
   - `families` - Families created
   - `family_members` - Family memberships
   - `transactions` - Transactions created
   - `categories` - Income/Expense categories

## Troubleshooting

### 1. Supabase không start được

**Lỗi**: Docker not running

**Giải pháp**:
- Cài đặt Docker Desktop
- Start Docker Desktop
- Chạy lại `supabase start`

### 2. Port đã được sử dụng

**Lỗi**: Port 54321, 54322, 54323 already in use

**Giải pháp**:
```bash
# Stop Supabase
supabase stop

# Kiểm tra processes đang dùng port
# Windows
netstat -ano | findstr :54321

# macOS/Linux
lsof -i :54321

# Start lại
supabase start
```

### 3. Migration fails

**Lỗi**: Migration failed to apply

**Giải pháp**:
```bash
# Reset toàn bộ database
supabase db reset

# Nếu vẫn lỗi, stop và start lại
supabase stop
supabase start
supabase db reset
```

### 4. Cannot connect to Supabase from Angular

**Lỗi**: Network error when calling Supabase

**Giải pháp**:
- Kiểm tra Supabase đang chạy: `supabase status`
- Kiểm tra file `src/environments/environment.ts`:
  - URL: `http://localhost:54321`
  - Key: Copy `anon key` từ `supabase status`

### 5. RLS Policy blocks query

**Lỗi**: Row level security policy violation

**Giải pháp**:
- Verify user đã đăng nhập
- Kiểm tra user có phải member của family
- Xem RLS policies trong Supabase Studio (Table Editor > RLS)

### 6. TypeScript errors

**Lỗi**: Various TypeScript compilation errors

**Giải pháp**:
```bash
# Clear Angular cache
rm -rf .angular

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Restart dev server
npm start
```

## Development Workflow

### Workflow hàng ngày:

```bash
# 1. Start Supabase (nếu chưa chạy)
supabase start

# 2. Start Angular
npm start

# 3. Develop...

# 4. Stop khi xong
supabase stop
```

### Khi tạo migration mới:

```bash
# Create new migration
supabase migration new <migration-name>

# Edit file trong supabase/migrations/

# Apply migration
supabase db reset
```

### Khi cần reset database:

```bash
# Reset về trạng thái ban đầu với seed data
supabase db reset
```

## Production Deployment

### Option 1: Supabase Cloud

1. Tạo project tại https://supabase.com
2. Get project credentials
3. Update `src/environments/environment.prod.ts`
4. Link local với cloud:
   ```bash
   supabase link --project-ref <your-project-ref>
   ```
5. Push migrations:
   ```bash
   supabase db push
   ```
6. Deploy Angular app lên Vercel/Netlify

### Option 2: Self-hosted Supabase

1. Follow Supabase self-hosting guide
2. Configure environment variables
3. Deploy Angular app

## Useful Commands

```bash
# Supabase
supabase start          # Start local Supabase
supabase stop           # Stop local Supabase
supabase status         # Check status and get credentials
supabase db reset       # Reset database with migrations
supabase db push        # Push migrations to remote
supabase migration new  # Create new migration
supabase functions      # Manage Edge Functions

# Angular
npm start               # Start dev server
npm run build           # Build for production
npm test                # Run tests
npm run lint            # Lint code

# Database inspection
psql postgresql://postgres:postgres@localhost:54322/postgres
```

## Next Steps

Sau khi setup thành công:

1. ✅ Đọc code trong `src/app/core/` để hiểu architecture
2. ✅ Xem RLS policies trong `supabase/migrations/`
3. ✅ Implement các TODO features:
   - Budget management
   - Advanced reports
   - Dark mode toggle
   - Transaction edit
   - Member invitation
4. ✅ Viết tests
5. ✅ Deploy to production

## Support

Nếu gặp vấn đề không nằm trong troubleshooting guide:

1. Check Supabase logs: `supabase logs`
2. Check Angular console for errors
3. Check Supabase Studio for database issues
4. Create issue trên GitHub repository

Happy coding! 🚀