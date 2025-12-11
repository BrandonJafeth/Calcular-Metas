import { MatrixGrid } from './components/matrix/MatrixGrid';
import { ToastProvider } from './context/ToastContext';
import './index.css'

function App() {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-background">
        <MatrixGrid />
      </div>
    </ToastProvider>
  );
}

export default App;
