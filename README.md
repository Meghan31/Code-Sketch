# CodeSketch Frontend

Real-time collaborative code editor built with React and Vite.

## Features

- 🚀 Real-time code synchronization
- 👥 Multi-user collaboration
- 💻 Support for C, C++, Java, JavaScript, and Python
- ▶️ Code execution with stdin support
- 🎨 Monaco Editor integration
- 📱 Responsive design

## Prerequisites

- Node.js 16+ and npm

## Installation

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file:

```bash
cp .env.example .env
```

3. Update `.env` with your backend URL:

```env
VITE_SOCKET_URL=http://localhost:3000
```

## Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Building for Production

```bash
npm run build
```

Build output will be in the `dist` directory.

## Environment Variables

- `VITE_SOCKET_URL` - Socket.IO server URL (default: `http://localhost:3000`)

## Project Structure

```
src/
├── api/               # API client and constants
├── components/        # React components
│   ├── client-circle/ # User avatar component
│   ├── editor/        # Code editor component
│   └── output/        # Output panel component
├── pages/            # Page components
│   ├── home/         # Landing page
│   └── code-editor/  # Editor page
├── socket/           # Socket.IO configuration
├── App.jsx           # Root component
└── main.jsx          # Entry point
```

## Technologies

- React 18.3
- Vite 6.0
- Monaco Editor
- Socket.IO Client
- React Router DOM
- Axios
- React Hot Toast
- SASS

## Known Issues

- Large code files (>100KB) may cause performance issues
- Network latency can affect real-time synchronization

## License

MIT
