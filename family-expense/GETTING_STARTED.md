# Getting Started - Family Expense Management

## Quick Setup (5 minutes)

### Prerequisites
- ✅ Node.js 18+ installed
- ✅ Docker Desktop running (for Supabase local)

### Installation Steps

1. **Install dependencies**
```bash
cd family-expense
npm install
```

2. **Install Supabase CLI**
```bash
npm install -g supabase
```

3. **Start Supabase**
```bash
supabase start
```
Wait for Docker images to download (first time only).

4. **Setup database**
```bash
supabase db reset
```
This creates all tables, RLS policies, and seed data.

5. **Start Angular**
```bash
npm start
```

6. **Open browser**
Go to http://localhost:4200

## First Use

1. **Register account**
   - Click "Đăng ký ngay"
   - Enter email, password, full name
   - Click "Đăng ký"

2. **Create family**
   - You'll be redirected to family page
   - Enter family name (e.g., "Gia đình Nguyễn")
   - Enter your display name
   - Click "Tạo gia đình"

3. **Add first transaction**
   - Click "+" button (mobile) or "Thêm giao dịch" (desktop)
   - Select type: Chi tiêu or Thu nhập
   - Enter amount
   - Select category
   - Select member (yourself)
   - Enter note (optional)
   - Click "Lưu"

4. **View dashboard**
   - See total income, expense, balance
   - View charts (pie chart for categories, bar chart for trends)
   - See recent transactions

## Project Structure

```
family-expense/
├── src/app/
│   ├── core/                    # Services, guards, models
│   ├── features/                # Feature components
│   │   ├── auth/               # Login, register
│   │   ├── dashboard/          # Dashboard with charts
│   │   ├── transactions/       # Transaction management
│   │   ├── categories/         # Category management
│   │   ├── family/             # Family settings
│   │   └── settings/           # User settings
│   └── shared/                  # Shared components (future)
│
├── supabase/
│   ├── migrations/              # Database migrations
│   ├── seed.sql                 # Seed data
│   └── config.toml              # Supabase config
│
└── Documentation/
    ├── README.md                # Main documentation
    ├── SETUP.md                 # Detailed setup guide
    ├── PROJECT_SUMMARY.md       # Architecture overview
    └── QUICKSTART.md            # 5-minute guide
```

## Key Features

### ✅ Implemented
- Authentication (email/password)
- Family management
- Transaction CRUD (Create, Read)
- Category management
- Dashboard with ECharts
- Realtime updates
- Responsive design (desktop/tablet/mobile)

### 🚧 TODO
- Budget management
- Advanced reports with filters
- Transaction edit/delete
- Dark mode toggle
- Member invitation via email
- Recurring transactions
- Multi-currency support

## Common Commands

```bash
# Development
npm start                # Start Angular (port 4200)

# Supabase
supabase start          # Start local Supabase
supabase stop           # Stop Supabase
supabase status         # Check status & credentials
supabase db reset       # Reset database

# View Supabase Studio
# Open http://localhost:54323 in browser
```

## Troubleshooting

### Port already in use
```bash
supabase stop
supabase start
```

### Database errors
```bash
supabase db reset
```

### Angular errors
```bash
rm -rf .angular node_modules package-lock.json
npm install
npm start
```

## Technology Stack

- **Frontend**: Angular 21 (Standalone Components)
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Styling**: Tailwind CSS
- **Charts**: Apache ECharts
- **State**: Angular Signals
- **Language**: TypeScript

## Security

- ✅ Row Level Security on all tables
- ✅ No `service_role_key` in frontend
- ✅ Auth managed by Supabase
- ✅ Role-based access control
- ✅ Database validates all permissions

## Support

- Read `SETUP.md` for detailed instructions
- Read `PROJECT_SUMMARY.md` for architecture
- Check Supabase Studio for database issues
- View browser console for frontend errors

## Next Steps

1. ✅ Explore the codebase
2. ✅ Add more transactions
3. ✅ Invite family members (TODO feature)
4. ✅ Set up budgets (TODO feature)
5. ✅ View reports (TODO feature)
6. ✅ Deploy to production

Happy tracking! 💰