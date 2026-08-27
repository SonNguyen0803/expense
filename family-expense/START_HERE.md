# 🚀 START HERE - Family Expense Management

Chào mừng bạn đến với Family Expense Management! Đây là hướng dẫn để bắt đầu.

## ⚡ Quick Start (< 5 phút)

### Bước 1: Cài đặt dependencies
```bash
cd family-expense
npm install
```

### Bước 2: Start Supabase
```bash
supabase start
```
⏳ Lần đầu sẽ tải Docker images (~2-3 phút)

### Bước 3: Setup database
```bash
supabase db reset
```
✅ Tạo tables, RLS policies, seed data

### Bước 4: Start Angular
```bash
npm start
```

### Bước 5: Mở browser
🌐 http://localhost:4200

## 🎯 First Steps

1. **Đăng ký tài khoản** (email/password)
2. **Tạo gia đình đầu tiên**
3. **Thêm giao dịch** (thu/chi)
4. **Xem dashboard** với charts

## 📚 Documentation

Đọc tài liệu theo thứ tự:

1. **QUICKSTART.md** ← Bắt đầu từ đây
2. **GETTING_STARTED.md** ← Hướng dẫn sử dụng
3. **README.md** ← Tổng quan project
4. **SETUP.md** ← Cài đặt chi tiết
5. **PROJECT_SUMMARY.md** ← Kiến trúc
6. **PROJECT_STATUS.md** ← Tính năng & TODO

## 🔑 Key URLs

- **App**: http://localhost:4200
- **Supabase Studio**: http://localhost:54323
- **Email Testing**: http://localhost:54324

## 🆘 Troubleshooting

### Lỗi: Port already in use
```bash
supabase stop
supabase start
```

### Lỗi: Database error
```bash
supabase db reset
```

### Lỗi: Angular compilation
```bash
rm -rf .angular node_modules
npm install
```

## 📝 TODO Features

Các tính năng cần implement:

- [ ] Budget management
- [ ] Transaction edit/delete
- [ ] Advanced reports
- [ ] Dark mode
- [ ] Member invitation
- [ ] Recurring transactions

Xem chi tiết trong `PROJECT_STATUS.md`

## 🛠️ Tech Stack

- Angular 21
- Supabase (PostgreSQL + Auth + Realtime)
- Tailwind CSS
- Apache ECharts
- TypeScript

## 📞 Need Help?

1. Đọc `SETUP.md` cho troubleshooting
2. Check Supabase Studio cho database
3. Check browser console cho lỗi frontend
4. Run `supabase logs` cho Supabase logs

## 🚀 Ready to Start?

```bash
cd family-expense
npm install
supabase start
supabase db reset
npm start
```

Mở http://localhost:4200 và bắt đầu! 🎉

---

**Happy coding! 💰**