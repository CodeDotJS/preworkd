# preworkd

A data validation tool for fixing data mistakes with a gentle mocking approach.

## Quick Start

1. **Install dependencies:**
```bash
pnpm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your API endpoints and allowed groups
```

3. **Start development server:**
```bash
pnpm dev
```

4. **Open [http://localhost:3000](http://localhost:3000)**

## Environment Variables

Required variables in `.env`:
- `NEXT_PUBLIC_DEFAULT_API_ENDPOINT`: Validation API endpoint
- `NEXT_PUBLIC_DEFAULT_REWORKD_BASE_URL`: Reworkd base URL  
- `NEXT_PUBLIC_ALLOWED_GROUPS`: Comma-separated list of allowed groups for settings access

## Usage

- **Validate Jobs**: Enter job ID, paste URL, or search domains with `@`
- **Browse History**: View validation history and manage cached jobs
- **Settings**: Configure API endpoints (requires group authentication)

## Features

- Job validation with caching (last 5 jobs)
- Domain search functionality
- Settings access control
- Relative time display
- Error handling with fun messages

## License

MIT © [Rishi Giri](https://rishi.rest)
