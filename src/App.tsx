import { BrowserRouter as Router, Routes, Route } from 'wouter';
import { Home } from './pages/Home';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" component={Home} />
      </Routes>
    </Router>
  );
}

export default App;
