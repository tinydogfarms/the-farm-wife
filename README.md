# The Farm Wife 🚜

A companion app for a farmer's entire day-to-day, built with React Native and Expo — equipment service history, livestock care, and (still) farm accounting with Schedule F tax records, all in one place.

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

## ✨ Features

### 📱 Core Functionality
- **User Authentication** - Secure login/signup with Supabase Auth, with show/hide password toggle
- **Transaction Management** - Add, view, and delete farm transactions
- **Schedule F Categories** - Pre-configured IRS Schedule F income/expense categories
- **Natural Language Input** - AI-powered transaction parsing ("sold 50 cattle for $45,000")
- **Receipt Capture** - Take photos of receipts and attach to transactions
- **Financial Summaries** - Real-time income, expense, and profit calculations
- **YTD Category Breakdown** - Tap-to-reveal summary tiles showing income/expenses by category

### 🧠 Smart Features  
- **AI Receipt Scanning** - Snap a photo of a receipt and Claude vision extracts the date, category, description, and amount to pre-fill the transaction form
- **Intelligent Category Detection** - Automatically categorizes based on description
- **Enhanced Amount Parsing** - Handles multiple numbers, prioritizes dollar amounts
- **Date Recognition** - Supports various date formats including "today", "yesterday"
- **Safe Area Support** - Respects device notches and home indicators

### 📊 Tax & Compliance
- **Schedule F Ready** - Categories aligned with IRS Schedule F requirements
- **Cash vs Accrual** - Support for both accounting methods
- **Receipt Storage** - Secure cloud storage for receipt images
- **Transaction History** - Complete audit trail with timestamps
- **CSV Export** - Export transactions (with receipt image URLs) filtered by date range, type, or category
- **Date Range Filtering** - Filter by current year, last year, any prior year, or a custom range

### 🚜 Equipment
- **Equipment Records** - Year/Make/Model/Serial Number per piece of equipment
- **Tag Scanning** - Photo (camera or gallery) of an equipment ID plate; Claude vision reads make/model/year/serial and pre-fills the form
- **Service Records** - Recurring service schedules (e.g. oil changes) — one-time, every-N-days, or monthly
- **Service History** - Completed service records, grouped by equipment
- **Due-Date Notifications** - Local reminder when a service comes due

### 🐄 Livestock
- **Group or Individual Tracking** - Track a herd by headcount, or an individual animal with tag number and birthdate
- **Photo Attachment** - Take or choose a photo to attach to a livestock record
- **Care Records** - Recurring vaccination/deworming/hoof-trimming schedules — one-time, every-N-days, or monthly
- **Care History** - Completed care records, grouped by animal or group
- **Due-Date Notifications** - Local reminder when care comes due

Equipment and Livestock are enabled per account (no in-app settings screen
yet — see [Configuration](#-configuration)); once enabled for an account, a
bottom tab bar appears alongside Finance.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator or Android Emulator (or physical device)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd the-farm-wife
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the project root with your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Set up Supabase database**
   - Run the SQL commands in `supabase-setup.sql` in your Supabase SQL Editor
   - This creates the transactions table and receipt storage bucket
   - Deploy the `parse-receipt` Edge Function (`supabase/functions/parse-receipt`) and set an `ANTHROPIC_API_KEY` secret on your Supabase project for AI receipt scanning to work
   - Optional (Equipment/Livestock modules): also run `supabase-setup-equipment.sql` and `supabase-setup-livestock.sql`, and deploy the `parse-equipment-tag` Edge Function (reuses the same `ANTHROPIC_API_KEY` secret) for equipment tag scanning

5. **Start the development server**
   ```bash
   npm start
   ```

6. **Run on device**
   - iOS: Press `i` or scan QR code with Camera app
   - Android: Press `a` or scan QR code with Expo Go app

## 🏗️ Project Structure

```
├── app/                    # App-level components
│   └── auth/              # Authentication screens
├── components/            # Reusable UI components
│   ├── MainTabs.tsx       # Bottom tab bar (Finance/Equipment/Livestock), gated per account
│   ├── FinanceApp.tsx     # Finance screen (transactions, receipts, reports)
│   ├── EquipmentApp.tsx   # Equipment screen (records, service schedule, history)
│   ├── LivestockApp.tsx   # Livestock screen (records, care schedule, history)
│   ├── AppHeader.tsx      # Main app header with user info
│   ├── CategorySummary.tsx # YTD income/expense breakdown by category
│   ├── DateRangePicker.tsx # Date range selector for filtering/export
│   ├── DatePicker.tsx     # Shared native date picker
│   ├── Dropdown.tsx       # Custom dropdown component
│   ├── PhotoCapture.tsx   # Shared camera/gallery capture UI
│   ├── NaturalLanguageInput.tsx # AI text parsing
│   ├── ReceiptCapture.tsx # Receipt photo capture + AI receipt scanning
│   ├── SummaryCards.tsx   # Financial summary display
│   ├── TransactionForm.tsx # Transaction entry form
│   ├── TransactionList.tsx # Transaction history
│   ├── equipment/         # Equipment/service-record forms, lists, history, tag scanner
│   └── livestock/         # Livestock/care-record forms, lists, history
├── lib/
│   ├── constants/         # App constants and categories
│   ├── hooks/            # Custom React hooks
│   ├── services/         # External service integrations
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions
├── supabase/
│   └── functions/
│       ├── parse-receipt/       # Edge Function: Claude vision receipt parsing
│       └── parse-equipment-tag/ # Edge Function: Claude vision equipment tag parsing
├── supabase-setup.sql             # Core schema: transactions, receipts bucket
├── supabase-setup-equipment.sql   # Equipment module schema
├── supabase-setup-livestock.sql   # Livestock module schema
└── assets/              # Images and static assets
```

## 🔧 Configuration

### Supabase Setup
1. Create a new Supabase project
2. Run the SQL migration in `supabase-setup.sql`
3. Set up Row Level Security policies for the `receipts` storage bucket
4. Add your Supabase URL and anon key to `.env`
5. Optional — Equipment/Livestock modules: also run `supabase-setup-equipment.sql` and `supabase-setup-livestock.sql`

### Storage Policies
The app requires these storage policies for receipt images:
- **Upload Policy**: Users can upload receipts to their own folder
- **View Policy**: Users can view their own receipts
- **Delete Policy**: Users can delete their own receipts

(Equipment tag photos aren't stored — they're only sent to Claude vision
for parsing. Livestock photos get the same three policies, scoped to the
`livestock-photos` bucket instead of `receipts`.)

### Enabling Equipment/Livestock for an account
These modules are off by default and there's no in-app settings screen yet.
Enable one per account by inserting into `user_settings.enabled_modules`
in the Supabase SQL Editor — see the comment at the bottom of
`supabase-setup-equipment.sql` / `supabase-setup-livestock.sql` for the
exact statement. Once enabled, a bottom tab bar appears in the app.

## 📱 Usage

### Adding Transactions

**Method 1: Natural Language**
1. Tap "Quick Entry" 
2. Type naturally: "bought 50 bags of feed for $1,200"
3. Tap "Parse & Fill Form" - fields auto-populate
4. Review and submit

**Method 2: Manual Entry**
1. Select transaction type (Income/Expense)
2. Choose category from dropdown
3. Enter description, amount, and date
4. Optionally attach receipt photo
5. Submit transaction

### Receipt Management
- **Take Photo**: Use in-app camera with receipt positioning guide  
- **Gallery**: Select existing photos from device
- **AI Scan**: Claude vision reads the receipt and pre-fills date, category, description, and amount
- **View**: Thumbnails shown in transaction history
- **Remove**: Delete receipt photos anytime

### Financial Reports
- View real-time summaries on main screen
- Track income vs expenses
- Monitor profit/loss
- Tap summary tiles to reveal YTD breakdown by category
- Filter by date range (current year, last year, any prior year, or custom range)
- Export filtered transactions to CSV, including receipt image URLs

## 🛠️ Development

### Available Scripts
- `npm start` - Start Expo development server
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS  
- `npm run web` - Run in web browser

### Key Technologies
- **React Native 0.79** - Cross-platform mobile framework
- **Expo 53** - Development platform and build service
- **TypeScript** - Type-safe JavaScript
- **Supabase** - Backend-as-a-service (auth, database, storage)
- **React Native Safe Area Context** - Handle device safe areas

### Code Architecture
- **Component Composition** - Small, focused, reusable components
- **Custom Hooks** - Business logic separated from UI
- **TypeScript** - Full type safety throughout
- **Error Handling** - Comprehensive error handling with user-friendly messages

## 📋 Roadmap

See [docs/ROADMAP.md](docs/ROADMAP.md) for what's built, what's next, and
why — that file is the maintained source of truth; this README covers
setup and usage, not planning.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Expo](https://expo.dev/) for rapid development
- Database and auth powered by [Supabase](https://supabase.com/)
- Icons and design inspiration from the farming community
- Schedule F categories from IRS Publication 225

---

**Made with ❤️ for farmers by farmers**