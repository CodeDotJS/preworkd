# preworkd

A modern, user-friendly dashboard for validating job data and identifying issues.

## ✨ Features

### 🔍 Validation
- **Job ID & URL Input**: Accepts both raw Job IDs and full reworkd.ai URLs
- **Real-time Validation**: Instantly validates job data against configurable API endpoints
- **Issue Categorization**: Organizes validation issues into clear categories
- **Domain Detection**: Automatically extracts and displays the source domain

### 📊 Results Display
- **Compact Left Panel**: Overview with domain, status, and issue counts
- **Detailed Right Panel**: Comprehensive issue breakdown with product IDs and URLs
- **Copy Functionality**: One-click copying of product IDs and URLs
- **External Navigation**: Direct links to jobs in reworkd.ai

### 📁 Browse History
- **Local Storage**: Automatically saves last 20 validated Job IDs
- **Quick Access**: View, copy, or re-validate previous jobs
- **Domain Tracking**: See which domains were validated

### ⚙️ Settings
- **Custom API Endpoints**: Configure your own validation API
- **Reworkd Base URL**: Customize the base URL for job navigation
- **Local Storage**: All settings stored in browser

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

1. Clone the repository:
```bash
git clone git@github.com:CodeDotJS/preworkd.git
cd preworkd
```

2. Install dependencies:
```bash
pnpm install
```

3. Start the development server:
```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🛠️ Usage

### Basic Validation
1. Enter a Job ID or paste a full reworkd.ai URL
2. Click "Validate" to analyze the job data
3. Review issues by category in the left panel
4. Click categories to see detailed breakdowns

### Navigation
- **/** - Main validation page
- **/browse** - View validation history
- **/settings** - Configure API endpoints and URLs

### Configuration
Visit `/settings` to customize:
- **API Endpoint**: URL for your validation service
- **Reworkd Base URL**: Base URL for job navigation

## 🏗️ Architecture

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Components**: Radix UI primitives with shadcn/ui
- **API**: Server-side proxy to avoid CORS issues
- **Storage**: Browser localStorage for settings and history

## 📁 Project Structure

```
├── app/                  # Next.js app router
│   ├── api/              # API routes
│   ├── browse/           # History page
│   ├── settings/         # Settings page
│   └── page.tsx          # Main validation page
├── components/           # Reusable UI components
├── public/               # Static assets (including goat.svg)
└── styles/               # Global styles
```

## 🎨 Design System

- **Colors**: Violet/purple gradients with gray neutrals
- **Typography**: Inter for UI, Inconsolata for code/IDs
- **Icons**: Lucide React icon library
- **Layout**: Responsive grid with compact left, detailed right panels

## 🔧 API Integration

The application proxies requests through `/api/validate/[jobId]` to avoid CORS issues. Configure your validation endpoint in settings.

## 📱 Responsive Design

Optimized for desktop and mobile with:
- Collapsible navigation on small screens
- Responsive grid layouts
- Touch-friendly interactive elements

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

*"Fixing your data mistakes—gently mocking them along the way." - preworkd*
