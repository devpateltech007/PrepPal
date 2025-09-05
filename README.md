# PrepPal
PrepPal is your personal classroom companion. It transcribes lectures, organizes notes, and generates practice tests with NotebookLM. By capturing exam hints and building a tailored study timeline with reminders, PrepPal keeps you on track—like a study buddy that helps you prepare smarter, not harder.

## Setup

### Prerequisites
- Node.js 18+ 
- Firebase project

### Firebase Setup
1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication and choose your sign-in methods (Email/Password recommended)
3. Go to Project Settings > General > Your apps > Web app
4. Copy the Firebase configuration values

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the environment template:
   ```bash
   cp .env.example .env.local
   ```
4. Update `.env.local` with your Firebase configuration values
5. Run the development server:
   ```bash
   npm run dev
   ```

### Authentication
The app uses Firebase Authentication with the following features:
- Email/password sign up and sign in
- Protected routes with authentication wrapper
- User session management
- Password reset functionality

## Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
