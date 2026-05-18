import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, Send, Maximize2, Minimize2, MessageSquare } from 'lucide-react';
import api from '../services/api';
import ChefMascot from '../assets/chef_mascot.png';

const VoiceWidget = ({ onNavigate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      text: "Voice mode active. I'm listening in the background. Say 'open menu' or ask me a question!",
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [liveText, setLiveText] = useState('');

  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');
  const chatEndRef = useRef(null);
  const manualStopRef = useRef(false);
  const accumulatedTranscriptRef = useRef('');

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isExpanded) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isExpanded, liveText, isProcessing]);

  useEffect(() => {
    // Initialize Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        if (!isListening) {
          setIsListening(true);
          transcriptRef.current = '';
          accumulatedTranscriptRef.current = '';
          setLiveText('');
          manualStopRef.current = false;
        }
      };

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        const fullTranscript = accumulatedTranscriptRef.current ? accumulatedTranscriptRef.current + ' ' + currentTranscript : currentTranscript;
        transcriptRef.current = fullTranscript;
        setLiveText(fullTranscript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        if (event.error !== 'no-speech') {
          setIsListening(false);
          manualStopRef.current = true;
        }
      };

      recognition.onend = () => {
        if (!manualStopRef.current) {
          accumulatedTranscriptRef.current = transcriptRef.current;
          try {
            recognitionRef.current.start();
          } catch (e) { }
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;

      // Auto-start listening by default
      if (!manualStopRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) { }
      }
    } else {
      console.warn('Speech Recognition API not supported in this browser.');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []); // Run once on mount

  // Watch for completed speech to trigger commands
  useEffect(() => {
    // If live text hasn't changed for a brief moment and we have text, process it.
    // However, continuous mode normally waits for onend or handles it via silence.
    // A better approach for continuous is to use a debounced timeout on liveText.

    const timeoutId = setTimeout(() => {
      if (liveText && !isListening) {
        // User stopped talking, or paused long enough.
        // Actually, if we use a button to submit, we use sendListening.
        // If we want auto-submit on pause, we can do it here. 
        // For now, let's auto-submit if there's a significant pause while listening, 
        // OR we just wait for recognition.onend (which triggers if they pause).
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [liveText, isListening]);

  // Handle continuous voice input detection for navigation
  useEffect(() => {
    if (!liveText) return;
    const lowerText = liveText.toLowerCase();
    const navMatch = lowerText.match(/(open|go to|show|navigate to)\s+(menu|orders|tables|inventory|payments|reports|settings|dashboard|hotels|managers)/i);

    if (navMatch && onNavigate) {
      let target = navMatch[2];
      if (target === 'hotels') target = 'hotels';
      if (target === 'managers') target = 'managers';

      // Clear transcript so we don't repeatedly trigger
      if (recognitionRef.current) {
        recognitionRef.current.stop(); // This will trigger onend and restart
      }

      setMessages((prev) => [
        ...prev,
        { id: Date.now(), role: 'user', text: liveText },
        { id: Date.now() + 1, role: 'assistant', text: `Opening ${target} page...` },
      ]);
      setLiveText('');
      transcriptRef.current = '';
      accumulatedTranscriptRef.current = '';

      onNavigate(target);
    }
  }, [liveText, onNavigate]);

  const handleUserVoiceInput = async (text) => {
    const trimmedText = text.trim();
    if (!trimmedText) return;

    // Add user message
    const userMsgId = Date.now();
    setMessages((prev) => [...prev, { id: userMsgId, role: 'user', text: trimmedText }]);

    setIsProcessing(true);
    // If the window is collapsed, expand it to show the response
    if (!isExpanded) setIsExpanded(true);

    try {
      // Send to backend MCP
      const response = await api.post('/api/v1/mcp/voice/ask', {
        transcribed_text: trimmedText,
      });

      // Add assistant response
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'assistant', text: response.data.assistant_text },
      ]);
    } catch (error) {
      console.error('Error fetching voice response:', error);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'assistant', text: "I'm sorry, I encountered an error connecting to the server." },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Your browser doesn't support the Web Speech API.");
      return;
    }

    if (isListening) {
      manualStopRef.current = true;
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      manualStopRef.current = false;
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) { }
    }
  };

  const sendListening = () => {
    if (transcriptRef.current.trim()) {
      handleUserVoiceInput(transcriptRef.current);
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop(); // will restart automatically because manualStopRef is false
    }

    setLiveText('');
    transcriptRef.current = '';
    accumulatedTranscriptRef.current = '';
  };

  return (
    <>
      {/* Floating Chat Window (Expanded) */}
      <div
        style={{
          position: 'fixed',
          bottom: isExpanded ? '100px' : '24px',
          right: '24px',
          width: '380px',
          height: '500px',
          background: 'white',
          borderRadius: '20px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000,
          fontFamily: "'Inter', sans-serif",
          transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          transform: isExpanded ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(20px)',
          opacity: isExpanded ? 1 : 0,
          pointerEvents: isExpanded ? 'auto' : 'none',
          overflow: 'hidden',
          border: '1px solid rgba(0,0,0,0.08)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          background: '#ff5722',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          zIndex: 2
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src={ChefMascot} alt="Chef" style={{ width: '32px', height: '32px', background: 'white', borderRadius: '50%', padding: '2px' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: '600', fontSize: '15px' }}>Voice Assistant</span>
              <span style={{ fontSize: '11px', opacity: 0.9 }}>
                {isListening ? 'Listening...' : 'Muted'}
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <Minimize2 size={18} />
          </button>
        </div>

        {/* Chat Area */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', background: '#f8f9fa' }}>
          {messages.map((msg) => (
            <div key={msg.id} style={{ display: 'flex', gap: '10px', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
              {msg.role === 'assistant' && (
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', flexShrink: 0, marginTop: '4px' }}>
                  <img src={ChefMascot} alt="Chef" style={{ width: '20px', height: '20px', borderRadius: '50%' }} />
                </div>
              )}

              <div style={{
                background: msg.role === 'user' ? '#ff5722' : 'white',
                color: msg.role === 'user' ? 'white' : '#333',
                padding: '12px 16px',
                borderRadius: '16px',
                borderTopLeftRadius: msg.role === 'assistant' ? '4px' : '16px',
                borderTopRightRadius: msg.role === 'user' ? '4px' : '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                fontSize: '14px',
                lineHeight: '1.5'
              }}>
                {msg.text}
              </div>
            </div>
          ))}

          {liveText && (
            <div style={{ display: 'flex', gap: '10px', alignSelf: 'flex-end', maxWidth: '85%', opacity: 0.8 }}>
              <div style={{
                background: '#ff5722',
                color: 'white',
                padding: '12px 16px',
                borderRadius: '16px',
                borderTopRightRadius: '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                fontSize: '14px',
                lineHeight: '1.5',
                fontStyle: 'italic'
              }}>
                {liveText}
              </div>
            </div>
          )}

          {isProcessing && (
            <div style={{ display: 'flex', gap: '10px', alignSelf: 'flex-start', maxWidth: '85%' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', flexShrink: 0, marginTop: '4px' }}>
                <img src={ChefMascot} alt="Chef" style={{ width: '20px', height: '20px', borderRadius: '50%' }} />
              </div>
              <div style={{ background: 'white', padding: '12px 16px', borderRadius: '16px', borderTopLeftRadius: '4px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                <span style={{ width: '6px', height: '6px', background: '#ff5722', borderRadius: '50%', animation: 'pulse 1s infinite alternate' }} />
                <span style={{ width: '6px', height: '6px', background: '#ff5722', borderRadius: '50%', animation: 'pulse 1s infinite alternate 0.2s' }} />
                <span style={{ width: '6px', height: '6px', background: '#ff5722', borderRadius: '50%', animation: 'pulse 1s infinite alternate 0.4s' }} />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area / Waveform */}
        <div style={{ padding: '16px', background: 'white', borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={toggleListening}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: isListening ? 'rgba(255, 87, 34, 0.1)' : '#f1f1f1',
              color: isListening ? '#ff5722' : '#666',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.2s'
            }}
          >
            {isListening ? <Mic size={20} /> : <MicOff size={20} />}
          </button>

          <div style={{ flex: 1, height: '40px', background: '#f8f9fa', borderRadius: '20px', display: 'flex', alignItems: 'center', padding: '0 16px', gap: '3px', overflow: 'hidden' }}>
            {!isListening ? (
              <span style={{ color: '#aaa', fontSize: '13px' }}>Microphone muted</span>
            ) : liveText ? (
              <span style={{ color: '#666', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Listening...</span>
            ) : (
              <div style={{ display: 'flex', gap: '3px', height: '16px', alignItems: 'center', width: '100%', justifyContent: 'center' }}>
                {[...Array(15)].map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: '3px',
                      background: '#ff5722',
                      borderRadius: '2px',
                      height: `${Math.random() * 12 + 4}px`,
                      animation: `pulse ${Math.random() * 0.5 + 0.5}s infinite alternate`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <button
            onClick={sendListening}
            disabled={!liveText || !isListening}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: liveText && isListening ? '#0a8035' : '#e0e0e0',
              color: 'white',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: liveText && isListening ? 'pointer' : 'not-allowed',
              flexShrink: 0,
              transition: 'all 0.2s'
            }}
          >
            <Send size={18} style={{ marginLeft: '-2px' }} />
          </button>
        </div>
      </div>

      {/* Floating Action Button (Collapsed) */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '12px'
        }}
      >
        {/* Notification Toast if there's an unread message and collapsed (Optional enhancement) */}
        {!isExpanded && messages.length > 1 && isProcessing && (
          <div style={{ background: 'white', padding: '12px 16px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', fontSize: '13px', fontWeight: '500', color: '#ff5722', display: 'flex', alignItems: 'center', gap: '8px', animation: 'fadeIn 0.3s ease' }}>
            <span style={{ width: '6px', height: '6px', background: '#ff5722', borderRadius: '50%', animation: 'pulse 1s infinite alternate' }} /> Processing query...
          </div>
        )}

        <button
          onClick={() => isExpanded ? setIsExpanded(false) : setIsExpanded(true)}
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: isListening ? '#ff5722' : '#333',
            color: 'white',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: isListening ? '0 6px 20px rgba(255, 87, 34, 0.4)' : '0 6px 20px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            transform: isExpanded ? 'scale(0)' : 'scale(1)',
            opacity: isExpanded ? 0 : 1,
            pointerEvents: isExpanded ? 'none' : 'auto',
          }}
        >
          {isListening ? (
            <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Pulsing rings */}
              <div style={{ position: 'absolute', inset: '-10px', border: '2px solid rgba(255,255,255,0.3)', borderRadius: '50%', animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
              <Mic size={28} />
            </div>
          ) : (
            <MessageSquare size={28} />
          )}
        </button>
      </div>

      <style>
        {`
          @keyframes pulse {
            0% { transform: scaleY(0.5); opacity: 0.5; }
            100% { transform: scaleY(1); opacity: 1; }
          }
          @keyframes ping {
            75%, 100% { transform: scale(1.5); opacity: 0; }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </>
  );
};

export default VoiceWidget;
