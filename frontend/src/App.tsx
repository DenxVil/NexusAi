import { ChatProvider } from './context/ChatContext';
import Chat from './components/Chat';
import './index.css';

function App() {
  return (
    <ChatProvider>
      <Chat />
    </ChatProvider>
  );
}

export default App;
