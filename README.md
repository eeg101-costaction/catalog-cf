# EEG101 Resource Catalog

A Next.js-based resource catalog for the EEG101 Community Framework, featuring direct integration with Zotero API for managing and displaying educational resources.

🌐 **Live Site**: <https://catalog-cf.eeg101.eu>

## Overview

This project provides a searchable, filterable catalog of EEG-related resources organized according to the Community Framework's three main sections:
- Part 1: Validity & Integrity
- Part 2: Democratization
- Part 3: Responsibility

Resources are fetched directly from a Zotero group library and categorized into four families:
- **Bibliographic** (books, articles, reports)
- **Multimedia** (videos, podcasts, presentations)
- **Technical** (software, datasets, code)
- **Web Page** (blog posts, websites)

## Features

✅ Direct Zotero API integration (no database needed)  
✅ ISR (Incremental Static Regeneration) for fast page loads  
✅ Advanced filtering by Framework Section, Type, and Language  
✅ Full-text search across titles, creators, and abstracts  
✅ Responsive design with Tailwind CSS 4  
✅ Color-coded resource families  
✅ Automatic deduplication of resources across sections  

## Getting Started

### Prerequisites

- Node.js 18.17 or higher
- npm or yarn
- Zotero API credentials (see Configuration)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd eeg101-CF-catalog
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the project root:
```env
ZOTERO_KEY=your_api_key_here
ZOTERO_LIBRARY_TYPE=group
ZOTERO_LIBRARY_ID=5794905
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Configuration

### Zotero API Setup

1. Get your Zotero API key from [zotero.org/settings/keys](https://www.zotero.org/settings/keys)
2. Find your library ID (group ID) in the Zotero group settings
3. Add credentials to `.env.local` (see Installation step 3)

### Framework Sections

The catalog fetches resources from three Zotero collections. To modify which collections are used, edit `COLLECTION_KEYS` in `src/app/resources/page.js`:

```javascript
const COLLECTION_KEYS = ["F9DNTXQA", "ZD2RV8H9", "L72L5WAP"];
```

## Project Structure

```
eeg101-CF-catalog/
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── resources/        # Resources catalog with ISR
│   │   ├── about/            # About page
│   │   └── api/              # API routes (optional)
│   ├── components/           # React components
│   │   ├── Layout/           # Header, Footer
│   │   ├── Resources/        # Resource cards, filters, details
│   │   └── ui/               # Reusable UI components
│   └── lib/                  # Backend logic
│       ├── zotero/           # Zotero API integration
│       └── filterUtils.js    # Filter logic
├── public/                   # Static assets
└── .env.local                # Environment variables (not committed)
```

## Documentation

- **[PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md)** - Complete technical documentation
- **[BACKEND_DOCUMENTATION.md](BACKEND_DOCUMENTATION.md)** - Zotero API integration details

## Deployment

### Vercel

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel Dashboard
4. Deploy

The site will automatically redeploy on every push to the main branch.

**Important**: Make sure to set the Zotero environment variables in Vercel settings.

## Development Commands

```bash
npm run dev        # Start development server (localhost:3000)
npm run build      # Build for production
npm run start      # Run production build locally
npm run lint       # Check code quality
```

## Key Technologies

- **Framework**: Next.js 16 (App Router)
- **React**: Version 19
- **Styling**: Tailwind CSS 4 + CSS Variables
- **Data Source**: Zotero API (via zotero-api-client)
- **Rendering**: ISR (Incremental Static Regeneration)
- **Deployment**: Vercel

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

## License

This project is part of the EEG101 Community Framework initiative.

## Support

For questions or issues:
- Check the [documentation](PROJECT_DOCUMENTATION.md)
- Review [Zotero API docs](https://www.zotero.org/support/dev/web_api/v3/start)
- Review [Next.js docs](https://nextjs.org/docs)
- Create an issue in the GitHub repository
