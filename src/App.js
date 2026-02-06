import React, { useState, useEffect, useRef } from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';

const ChatAssistant = () => {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! I can guide you through the app. You can type or speak to me.' }
  ]);
  const [inputMode, setInputMode] = useState('text'); // 'text' or 'voice'
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const chatEndRef = useRef(null);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- VOICE RECORDER HOOK ---
  const { startRecording, stopRecording, status } = useReactMediaRecorder({
    audio: true,
    onStop: (blobUrl, blob) => handleVoiceUpload(blob) // Fires automatically when stopped
  });

  // --- HANDLERS ---

  // 1. Handle Text Submission
  const handleTextSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMessage = inputText;
    addMessage('user', userMessage);
    setInputText(''); // Clear input
    setIsLoading(true);

    try {
      // Mock API Call - Replace with your fetch to LLM
      const botResponse = await sendTextToBackend(userMessage); 
      addMessage('bot', botResponse);
    } catch (error) {
      addMessage('bot', "Sorry, I couldn't reach the server.");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Handle Voice Submission (Triggered by onStop)
  const handleVoiceUpload = async (audioBlob) => {
    setIsLoading(true);
    // Add a temporary placeholder while processing audio
    addMessage('user', '🎤 (Processing Audio...)');

    try {
      // Send Blob to Backend (STT + LLM)
      const data = await sendVoiceToBackend(audioBlob);
      
      // Update the last user message with the actual transcribed text
      setMessages(prev => {
        const newHistory = [...prev];
        newHistory[newHistory.length - 1].text = `🎤 ${data.transcription}`;
        return newHistory;
      });

      // Add Bot Response
      addMessage('bot', data.reply);

    } catch (error) {
      addMessage('bot', "Error processing voice command.");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to update chat history
  const addMessage = (sender, text) => {
    setMessages(prev => [...prev, { sender, text }]);
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h3>App Assistant</h3>
        <div style={styles.modeToggle}>
          <button 
            style={inputMode === 'text' ? styles.activeTab : styles.tab}
            onClick={() => setInputMode('text')}
          >
            ⌨️ Text
          </button>
          <button 
            style={inputMode === 'voice' ? styles.activeTab : styles.tab}
            onClick={() => setInputMode('voice')}
          >
            🎙️ Voice
          </button>
        </div>
      </div>

      {/* Chat History Area */}
      <div style={styles.chatWindow}>
        {messages.map((msg, index) => (
          <div 
            key={index} 
            style={msg.sender === 'user' ? styles.userBubble : styles.botBubble}
          >
            <strong>{msg.sender === 'user' ? 'You' : 'Bot'}:</strong> {msg.text}
          </div>
        ))}
        {isLoading && <div style={styles.loadingBubble}>Thinking...</div>}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div style={styles.inputArea}>
        {inputMode === 'text' ? (
          <form onSubmit={handleTextSubmit} style={styles.textForm}>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask about features..."
              style={styles.textInput}
              disabled={isLoading}
            />
            <button type="submit" style={styles.sendBtn} disabled={isLoading || !inputText}>
              Send
            </button>
          </form>
        ) : (
          <div style={styles.voiceControls}>
            {status === 'recording' ? (
              <button onClick={stopRecording} style={styles.stopBtn}>
                ⏹️ Stop & Send
              </button>
            ) : (
              <button onClick={startRecording} style={styles.recordBtn} disabled={isLoading}>
                🔴 Tap to Record
              </button>
            )}
            <span style={{fontSize: '12px', marginLeft: '10px'}}>
              Status: {status}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};


async function sendTextToBackend(text) {
  const res = await fetch('http://localhost:8000/chat', { 
    method: 'POST', 
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ message: text }) 
  });
  const data = await res.json();
  return data.reply;
}

async function sendVoiceToBackend(blob) {
  const formData = new FormData();
  formData.append('file', blob, 'audio.wav');

  const res = await fetch('http://localhost:8000/talk', { 
    method: 'POST', 
    body: formData 
  });
  
  return await res.json();
}

// --- STYLES ---
const styles = {
  container: {
    width: '350px',
    height: '500px',
    border: '1px solid #ddd',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'sans-serif',
    backgroundColor: '#fff',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    position: 'fixed',
    bottom: '20px',
    right: '20px'
  },
  header: {
    padding: '10px',
    borderBottom: '1px solid #eee',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: '12px',
    borderTopRightRadius: '12px',
  },
  modeToggle: { display: 'flex', gap: '5px' },
  tab: {
    background: 'none', border: 'none', cursor: 'pointer', padding: '5px 10px',
    borderRadius: '4px', fontSize: '0.9rem', color: '#666'
  },
  activeTab: {
    background: '#e2e6ea', border: 'none', cursor: 'pointer', padding: '5px 10px',
    borderRadius: '4px', fontSize: '0.9rem', fontWeight: 'bold', color: '#007bff'
  },
  chatWindow: {
    flex: 1,
    padding: '15px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    backgroundColor: '#fff'
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#007bff',
    color: '#fff',
    padding: '8px 12px',
    borderRadius: '12px 12px 0 12px',
    maxWidth: '80%',
    wordWrap: 'break-word',
    fontSize: '0.9rem'
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f0f0',
    color: '#333',
    padding: '8px 12px',
    borderRadius: '12px 12px 12px 0',
    maxWidth: '80%',
    wordWrap: 'break-word',
    fontSize: '0.9rem'
  },
  loadingBubble: {
    alignSelf: 'flex-start',
    color: '#888',
    fontStyle: 'italic',
    fontSize: '0.8rem'
  },
  inputArea: {
    padding: '10px',
    borderTop: '1px solid #eee',
    backgroundColor: '#f8f9fa',
    borderBottomLeftRadius: '12px',
    borderBottomRightRadius: '12px',
  },
  textForm: { display: 'flex', gap: '8px' },
  textInput: {
    flex: 1,
    padding: '8px',
    borderRadius: '20px',
    border: '1px solid #ccc',
    outline: 'none'
  },
  sendBtn: {
    padding: '8px 16px',
    borderRadius: '20px',
    border: 'none',
    backgroundColor: '#007bff',
    color: 'white',
    cursor: 'pointer'
  },
  voiceControls: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px'
  },
  recordBtn: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  stopBtn: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#333',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold'
  }
};

export default ChatAssistant;
