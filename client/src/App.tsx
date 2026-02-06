import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { RoomProvider } from './contexts/RoomContext';
import { AuthProvider } from './components/auth/AuthProvider';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Landing } from './routes/Landing';
import { Dashboard } from './routes/Dashboard';
import { SignIn } from './routes/SignIn';
import { SignUp } from './routes/SignUp';
import { Edit } from './routes/Edit';
import { Host } from './routes/Host';
import { Display } from './routes/Display';
import { Play } from './routes/Play';
import { Preview } from './routes/Preview';
import { GameTester } from './routes/test/GameTester';
import { GameTestView } from './routes/test/GameTestView';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RoomProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/sign-in/*" element={<SignIn />} />
            <Route path="/sign-up/*" element={<SignUp />} />
            <Route path="/play/:code" element={<Play />} />
            <Route path="/preview/:code" element={<Preview />} />
            <Route path="/display/:code" element={<Display />} />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Host routes - can be accessed with editCode (legacy) or when authenticated */}
            <Route path="/edit/:editCode" element={<Edit />} />
            <Route path="/host/:code" element={<Host />} />

            {/* Dev-only: Game testing routes */}
            {import.meta.env.DEV && (
              <>
                <Route path="/test/games" element={<GameTester />} />
                <Route path="/test/games/:gameId" element={<GameTestView />} />
              </>
            )}
          </Routes>
        </RoomProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
