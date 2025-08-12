# 🔍 preworkd

A web-based tool for validating and analyzing data quality issues from web scraping jobs. Built for fun on a random night out of boredom.

## 🚀 Quick Start

1. **Install dependencies:**
```bash
pnpm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your API endpoints
```

3. **Start development server:**
```bash
pnpm dev
```

4. **Open [http://localhost:3000](http://localhost:3000)**

## ⚙️ Environment Variables

Required variables in `.env`:
- `NEXT_PUBLIC_DEFAULT_API_ENDPOINT`: Validation API endpoint
- `NEXT_PUBLIC_DEFAULT_REWORKD_BASE_URL`: Reworkd base URL  
- `NEXT_PUBLIC_ALLOWED_GROUPS`: Comma-separated list of allowed groups for settings access

## ✨ Features

- **Data Quality Validation**: Comprehensive checks for web scraping data
- **Multiple Validation Categories**: Missing data, duplicates, file issues, metadata problems
- **Interactive Dashboard**: Click-through interface for detailed issue analysis
- **Copy & Export**: One-click copying of product IDs, URLs, and validation data
- **Job Management**: Search, cache, and track validation history
- **Direct Platform Access**: Link directly to job details on the platform

## 📖 Usage

- **Validate a Job**: Enter job ID or paste job URL in the input field
- **Search by Domain**: Type `@domain` to find jobs from specific websites
- **View Issues**: Click on any validation category to see detailed examples
- **Copy Data**: Click on product IDs, URLs, or other data to copy to clipboard
- **Access Platform**: Use the job link button to open the job on the platform

## 📄 License

MIT © [Rishi Giri](https://rishi.rest)
