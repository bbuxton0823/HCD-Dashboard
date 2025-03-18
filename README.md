# San Mateo County Housing Element Dashboard

This is a Next.js-based dashboard for tracking housing development data in San Mateo County, providing real-time analysis and insights into housing progress.

![Dashboard Screenshot](docs/dashboard_screenshot.png)

## Features

- **Interactive Visualizations**: Charts and maps visualizing housing development metrics and geographic distribution
- **AI-Powered Analysis**: Intelligent explanations of housing data using OpenAI integration
- **Multilingual Support**: Toggle between English, Spanish, and Mandarin Chinese
- **Web Scraping System**: Automated data collection from multiple sources
- **Admin Controls**: Upload and refresh data with AI-recommended scraping methods
- **Responsive Design**: Optimized for desktop and mobile devices

## Technologies Used

- **Next.js** & **React**: Framework for building the dashboard UI
- **TypeScript**: Type-safety throughout the codebase
- **Highcharts**: Data visualizations 
- **React-Leaflet**: Interactive mapping
- **Styled Components**: Component styling
- **OpenAI API**: AI-powered dashboard explanations
- **Browser Tools MCP & Puppeteer MCP**: Web scraping microservices

## AI-Powered Assistant

The dashboard features an AI assistant that:

1. Analyzes housing data in real-time
2. Provides context-aware explanations of charts and statistics
3. Highlights key metrics with automated bullet points
4. Operates in multiple languages (English, Spanish, and Mandarin)
5. Uses smart caching to ensure stable performance

## Installation

### Prerequisites

- Node.js 16.x or higher
- npm or yarn
- OpenAI API key

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/bbuxton0823/HCD-Dashboard.git
   cd HCD-Dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

3. Create a `.env.local` file in the project root with the following variables:
   ```
   # Use mock data during development
   NEXT_PUBLIC_USE_MOCK_DATA=true

   # OpenAI API key
   OPENAI_API_KEY=your_openai_api_key_here

   # Browser Tools MCP URL
   BROWSER_TOOLS_URL=http://localhost:3500

   # Puppeteer MCP URL
   PUPPETEER_MCP_URL=http://localhost:3600
   ```

4. Replace `your_openai_api_key_here` with your actual OpenAI API key.

### Running the Dashboard

1. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

2. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running the MCP Microservices

For full functionality with web scraping capabilities, start the MCP microservices:

1. Start Browser Tools MCP:
   ```bash
   npm run browser-tools
   ```

2. Start Puppeteer MCP:
   ```bash
   npm run puppeteer-mcp
   ```

## Usage

### Viewing the Dashboard

The main dashboard displays housing metrics including:
- Summary statistics
- Housing development progress by income category
- Income level distribution
- Geographic map of housing projects

### Admin Panel

Click "Show Admin Panel" to access:
- Data refresh controls
- AI-recommended MCP selection
- Data upload functionality

### AI Assistant

The AI assistant provides context-aware explanations:
1. View any dashboard section
2. The assistant automatically explains the data 
3. Use the language toggle to switch between English, Spanish, and Mandarin
4. Click "Refresh analysis" for updated explanations

## Project Structure

```
/
├── src/
│   ├── components/       # React components
│   │   ├── api/          # API routes
│   │   └── index.tsx     # Main dashboard
│   ├── lib/              # Utility functions and services
│   │   ├── openai.ts     # OpenAI integration
│   │   ├── scrapers/     # Web scrapers
│   │   └── translations.ts # Multilingual support
│   ├── models/           # Data models
│   ├── pages/            # Next.js pages
│   └── styles/           # Global styles
├── public/               # Static assets
└── puppeteer-mcp-server.js # Puppeteer MCP server
```

## Development

### Adding New Features

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Submit a pull request

### Code Style

- Follow TypeScript best practices
- Use styled-components for styling
- Follow the component structure pattern

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- OpenAI for the AI assistant capabilities
- San Mateo County for housing data
- AgentsDeskai for Browser Tools MCP
