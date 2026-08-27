# Quick Start Guide

Hướng dẫn nhanh để chạy project trong 5 phút.

## Prerequisites

- Node.js 18+ đã cài đặt
- Docker Desktop đang chạy (cho Supabase local)

## Setup trong 5 bước

### 1. Install dependencies
```bash
cd family-expense
npm install
```

### 2. Install Supabase CLI
```bash
# Windows (PowerShell as Admin)
npm install -g supabase

# macOS
brew install supabase/tap/supabase
```

### 3. Start Supabase
```bash
supabase start
```

Đợi vài phút để Docker images download lần đầu.

### 4. Setup database
```bash
supabase db reset
```

### 5. Start Angular
```bash
npm start
```

## Done! 🎉

Mở browser tại: http://localhost:4200

## First Steps

1. **Đăng ký tài khoản**
   - Email: test@example.com
   - Password: password123
   - Full Name: Test User

2. **Tạo gia đình đầu tiên**
   - Tên gia đình: Gia đình Test
   - Tên hiển thị: Test User

3. **Thêm giao dịch**
   - Loại: Chi tiêu
   - Số tiền: 500000
   - Danh mục: Ăn uống
   - Ghi chú: Ăn tối

4. **Xem Dashboard**
   - Charts tự động cập nhật
   - Xem tổng thu/chi
   - Xem giao dịch gần đây

## Useful URLs

- **Angular App**: http://localhost:4200
- **Supabase Studio**: http://localhost:54323
- **Email Testing**: http://localhost:54324

## Common Commands

```bash
# Stop everything
supabase stop

# Restart
supabase start
npm start

# Reset database
supabase db reset

# View logs
supabase logs
```

## Need Help?

- Read `README.md` for detailed info
- Read `SETUP.md` for troubleshooting
- Check Supabase Studio for database issues

## What's Next?

- Explore the codebase in `src/app/`
- Read database schema in `supabase/migrations/`
- Try adding features from TODO list
- Write tests
- Deploy to production

Happy coding! 🚀