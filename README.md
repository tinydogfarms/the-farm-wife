# The Farm Wife 🚜

A modern farm accounting app built with React Native and Expo. Designed specifically for agricultural businesses to track income, expenses, and maintain Schedule F tax records.

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
│   ├── AppHeader.tsx      # Main app header with user info
│   ├── CategorySummary.tsx # YTD income/expense breakdown by category
│   ├── DateRangePicker.tsx # Date range selector for filtering/export
│   ├── Dropdown.tsx       # Custom dropdown component
│   ├── FinanceApp.tsx     # Finance screen (transactions, receipts, reports)
│   ├── NaturalLanguageInput.tsx # AI text parsing
│   ├── ReceiptCapture.tsx # Camera/photo capture + AI receipt scanning
│   ├── SummaryCards.tsx   # Financial summary display
│   ├── TransactionForm.tsx # Transaction entry form
│   └── TransactionList.tsx # Transaction history
├── lib/
│   ├── constants/         # App constants and categories
│   ├── hooks/            # Custom React hooks
│   ├── services/         # External service integrations
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions
├── supabase/
│   └── functions/
│       └── parse-receipt/ # Edge Function: Claude vision receipt parsing
└── assets/              # Images and static assets
```

## 🔧 Configuration

### Supabase Setup
1. Create a new Supabase project
2. Run the SQL migration in `supabase-setup.sql`
3. Set up Row Level Security policies for the `receipts` storage bucket
4. Add your Supabase URL and anon key to `.env`

### Storage Policies
The app requires these storage policies for receipt images:
- **Upload Policy**: Users can upload receipts to their own folder
- **View Policy**: Users can view their own receipts
- **Delete Policy**: Users can delete their own receipts

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

- [ ] Export to PDF for tax filing
- [ ] Offline support and sync
- [ ] Multi-farm/entity support
- [ ] Recurring transaction templates
- [ ] Bank account integration
- [ ] Mileage tracking
- [ ] Equipment depreciation calculator

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