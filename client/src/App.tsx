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
          </Routes>
        </RoomProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
