# DoMyJob: AI-Powered Work Assistant

DoMyJob is an intelligent web application designed to streamline professional workflows by learning about your work tasks and responsibilities. It uses AI to help automate repetitive tasks, generate responses, and provide guidance based on your own documentation and context.

## Features

### Core Functionality
- **Context-Aware AI Assistant**: The AI learns from your documents and previous interactions to provide relevant assistance
- **Long-term Context Storage**: Documents and knowledge persist in the system to improve the AI's effectiveness over time
- **Conversation Interface**: Chat with the AI about work-related questions and tasks
- **Task Management**: Track work tasks and their completion status

### Document Processing
- **Document Upload**: Easily add new documents to the system for AI reference
- **PDF Processing**: Automatic extraction of text content from PDF documents
- **Screen Capture**: Take screenshots or share your screen to provide visual context to the AI
- **Context Management**: Toggle which documents and contexts are active for AI reference

### Email Integration
- **Email Drafting**: Generate professional email drafts based on purpose, topic, and desired tone
- **Email Inbox**: Connect your email account to view and manage emails (Gmail, Outlook, etc.)
- **Smart Response Generation**: Automatically analyze emails and generate appropriate responses
- **Email Send Capability**: Send email responses directly from the application

### Authentication & Security
- **Secure User Authentication**: Login with username/password or social authentication
- **Firebase Integration**: Google and Apple sign-in options
- **Session Management**: Persistent sessions with secure token handling
- **Data Encryption**: Email credentials are stored with encryption for security

### User Experience
- **Responsive Design**: Works on desktop and mobile devices
- **Learning Progress**: Visual indicators of how well the AI is learning your job patterns
- **Quick Actions**: One-click access to common functions

## Project Structure

### Frontend (`/client`)
- React + TypeScript frontend using Vite
- Component-based architecture with shadcn UI components
- State management using React Query and context providers

### Backend (`/server`)
- Express.js server with TypeScript
- REST API for all functionality
- Authentication using Passport.js
- File processing middleware (Multer)

### Database
- PostgreSQL database using Drizzle ORM
- Database schema in `/shared/schema.ts`
- Session storage for persistent login
- Database operations via repository pattern

### AI Integration
- OpenAI integration using latest GPT models
- Context-based prompting for relevant responses
- Multi-modal capabilities (text, image, PDF analysis)

## Directory Structure

```
├── client/
│   ├── src/
│   │   ├── components/ - React components
│   │   ├── hooks/ - Custom React hooks
│   │   ├── lib/ - Utility functions
│   │   ├── pages/ - Page components
│   │   └── types/ - TypeScript definitions
├── server/
│   ├── auth.ts - Authentication logic
│   ├── db.ts - Database connection
│   ├── email.ts - Email processing
│   ├── openai.ts - AI integration
│   ├── pdf.ts - PDF processing
│   ├── routes.ts - API endpoints
│   ├── screenshot.ts - Screen capture processing
│   ├── storage.ts - Data storage/retrieval
│   └── types.ts - Type definitions
├── shared/
│   └── schema.ts - Database schema definition
└── components.json - shadcn UI configuration
```

## Setup & Configuration

### Prerequisites
- Node.js 20.x or later
- PostgreSQL database
- OpenAI API key
- Firebase project (for social authentication)

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: Your OpenAI API key
- `VITE_FIREBASE_API_KEY`: Firebase API key
- `VITE_FIREBASE_PROJECT_ID`: Firebase project ID
- `VITE_FIREBASE_APP_ID`: Firebase app ID

### Getting Started
1. Clone the repository
2. Install dependencies with `npm install`
3. Set up environment variables
4. Run the database migrations with `npm run db:push`
5. Start the development server with `npm run dev`

## TODO Items

### Immediate Priorities
- [ ] Fix TypeScript errors in API routes related to user ID handling
- [ ] Update screen capture functionality for larger screenshots (current file size limit issues)
- [ ] Add user feedback mechanism for AI-generated content
- [ ] Implement proper error handling for social login edge cases

### Future Enhancements
- [ ] Add more OAuth providers (Microsoft, LinkedIn)
- [ ] Implement tagging system for contexts and documents
- [ ] Add keyboard shortcuts for common actions
- [ ] Create a mobile app version
- [ ] Improve AI context window management for longer conversations
- [ ] Add collaborative features for team usage
- [ ] Implement browser extension for easier content capture

### Technical Debt
- [ ] Refactor authentication to use JWT tokens
- [ ] Improve test coverage
- [ ] Optimize database queries
- [ ] Enhance security with rate limiting
- [ ] Add comprehensive logging and monitoring

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## License
This project is licensed under the MIT License - see the LICENSE file for details.