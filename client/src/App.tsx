import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { RoomProvider } from './contexts/RoomContext';
import { Landing } from './routes/Landing';
import { Edit } from './routes/Edit';
import { Host } from './routes/Host';
import { Display } from './routes/Display';
import { Play } from './routes/Play';
import { Preview } from './routes/Preview';

function App() {
  return (
    <BrowserRouter>
      <RoomProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/edit/:editCode" element={<Edit />} />
          <Route path="/host/:code" element={<Host />} />
          <Route path="/display/:code" element={<Display />} />
          <Route path="/play/:code" element={<Play />} />
          <Route path="/preview/:code" element={<Preview />} />
        </Routes>
      </RoomProvider>
    </BrowserRouter>
  );
}

export default App;
