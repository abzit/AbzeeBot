import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown'
import './App.css'; // Import the CSS file
import { GoogleGenerativeAI } from '@google/generative-ai';

// NOTE: Storing API keys in frontend code is insecure for production. Use a backend proxy for real projects.
const apiKey = process.env.REACT_APP_GEMINI_API_KEY || '';
if (!apiKey) {
  // Log a notice so you can see it in the dev console; UI will also show a helpful error.
  console.warn('REACT_APP_GEMINI_API_KEY is not set. Set it in your .env (local testing only).');
}

// Create client only if apiKey exists (some SDKs may error if created in browser; if you see errors, move to backend)
let ai = null;
try {
  if (apiKey) ai = new GoogleGenerativeAI(apiKey);
} catch (err) {
  console.error('Could not initialize GoogleGenerativeAI in the frontend. Consider running requests from a backend. Error:', err);
}

// Choose a model (change to a model your account supports)
const model = 'gemini-2.5-flash';

function App() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('Your generated response will appear here...');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || !apiKey) {
      setError(!apiKey ? 'Missing Gemini API key. Set REACT_APP_GEMINI_API_KEY in your .env file.' : 'Please enter a prompt.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResponse('');

    try {
      if (!ai) throw new Error('Gemini client not initialized. See console for details.');

      const chat = ai.getGenerativeModel({ model }).startChat();

      // Send message. Some SDKs accept a plain string, others require an object; inspect the logged result.
      const result = await chat.sendMessage(prompt);

      // Always log the full object so you can inspect its actual shape in the browser console.
      console.log('Full API Result Object:', result);
      console.log(result.response.candidates[0].content.parts[0].text)

      // Try several common locations for generated text. If none present, show the full object in the UI so you can debug.
      const possibleText = result.response.candidates[0].content.parts[0].text || null;

      if (possibleText) {
        setResponse(typeof possibleText === 'string' ? possibleText : JSON.stringify(possibleText));
      } else {
        setResponse('Received a response but could not find a text field. Full object:\n' + JSON.stringify(result, null, 2));
      }
    } catch (err) {
      console.error('Gemini API error:', err);
      // show friendly message in UI and full error in console
      setError(err?.message || 'An unknown error occurred while calling the Gemini API.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="gemini-app-container">
      <header className="app-header">
        <h1>✨ ABZEE AI BOT</h1>
      </header>

      <main className="chat-interface">
        <form onSubmit={handleSubmit} className="input-form">
          <textarea
            className="prompt-textarea"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type your query here (e.g., What is the capital of France?)"
            rows="4"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="submit-button"
            disabled={isLoading || !prompt.trim() || !apiKey}
          >
            {isLoading ? 'Sending...' : 'Generate Response'}
          </button>
        </form>

        <div className="response-area">
          <h3>Generated Response:</h3>
          {error && <p className="error-message">🚨 {error}</p>}
          {isLoading ? (
            <div className="loading-spinner" aria-label="Loading"></div>
          ) : (
            <div className="api-response-text">
              <ReactMarkdown>{response}</ReactMarkdown>
            </div>
          )}
        </div>
      </main>

      <footer className="app-footer">
        <p>Powered by Google Gemini API</p>
      </footer>
    </div>
  );
}

export default App;
