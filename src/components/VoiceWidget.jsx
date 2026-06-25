import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, Send, Maximize2, Minimize2, MessageSquare, Volume2, VolumeX, Keyboard } from 'lucide-react';
import api from '../services/api';
import ChefMascot from '../assets/chef.png';

const VoiceWidget = ({ onNavigate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      text: "I'm your assistant! Click the mic to talk, or just type a message.",
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [liveText, setLiveText] = useState('');
  const [inputText, setInputText] = useState('');
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [mobileQuoteVisible, setMobileQuoteVisible] = useState(true);
  const [isVoiceMode, setIsVoiceModeState] = useState(false);
  const isVoiceModeRef = useRef(false);
  const setIsVoiceMode = (val) => {
    isVoiceModeRef.current = val;
    setIsVoiceModeState(val);
  };
  const shouldSendAudioRef = useRef(true);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const analyserRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const audioContextRef = useRef(null);
  const currentAudioRef = useRef(null);
  const chatEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isExpanded) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isExpanded, liveText, isProcessing]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);

    let touchTimeout;
    const handleTouch = () => {
      if (window.innerWidth <= 768) {
        setMobileQuoteVisible(false);
        clearTimeout(touchTimeout);
        touchTimeout = setTimeout(() => {
          setMobileQuoteVisible(true);
        }, 3000);
      }
    };
    window.addEventListener('touchstart', handleTouch, { passive: true });

    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('touchstart', handleTouch);
      clearTimeout(touchTimeout);
    };
  }, []);

  const handleUserVoiceInput = async (text, base64Audio = null) => {
    const trimmedText = text.trim();
    if (!trimmedText && !base64Audio) return;

    // Add user message
    const userMsgId = Date.now();
    setMessages((prev) => [...prev, { id: userMsgId, role: 'user', text: base64Audio ? "🎤 Audio Message" : trimmedText }]);

    setIsProcessing(true);
    // If the window is collapsed, expand it to show the response
    if (!isExpanded) setIsExpanded(true);

    try {
      // Build history payload
      const historyToSend = messages.slice(-10).map(m => ({
        role: m.role,
        text: m.text
      }));

      const payload = {
        transcribed_text: base64Audio ? "Please transcribe and respond to the audio payload." : trimmedText,
        chat_history: historyToSend,
        is_voice: base64Audio ? true : isListening
      };

      if (base64Audio) {
        payload.audio_base64 = base64Audio;
      }

      // Send to backend MCP
      const response = await api.post('/api/v1/mcp/voice/ask', payload);

      const replyText = response.data.assistant_text;

      // Update user message with transcribed text and add assistant response
      setMessages((prev) => {
        const newMessages = [...prev];
        if (base64Audio && response.data.transcribed_user_text) {
          const userMsgIndex = newMessages.findIndex(m => m.id === userMsgId);
          if (userMsgIndex !== -1) {
            newMessages[userMsgIndex] = { ...newMessages[userMsgIndex], text: response.data.transcribed_user_text };
          }
        }
        newMessages.push({ id: Date.now() + 1, role: 'assistant', text: replyText });
        return newMessages;
      });

      // Play audio payload if not muted
      if (response.data.audio_payload && !isSpeakerMuted) {
        try {
          if (currentAudioRef.current) {
            currentAudioRef.current.pause();
          }
          const audio = new Audio(`data:audio/mp3;base64,${response.data.audio_payload}`);
          audio.playbackRate = 1.15;
          currentAudioRef.current = audio;
          if (base64Audio) {
            audio.onended = () => {
              if (isExpanded && isVoiceModeRef.current) {
                startListening();
              }
            };
          }
          await audio.play();
        } catch (audioErr) {
          console.error("Audio playback failed:", audioErr);
          if (base64Audio && isExpanded && isVoiceModeRef.current) startListening();
        }
      } else if (base64Audio && isExpanded && isVoiceModeRef.current) {
        // If muted or no audio, restart listening immediately
        startListening();
      }

      // Handle navigation tool
      if (response.data.tool_name === 'navigate_to_page' && response.data.tool_result && onNavigate) {
        onNavigate(response.data.tool_result.page, response.data.tool_result.subtab);
      }

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

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          if (shouldSendAudioRef.current) {
            const base64Audio = reader.result.split(',')[1];
            handleUserVoiceInput("Audio Input", base64Audio);
          }
          setLiveText('');
        };
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
        setIsListening(false);
      };

      mediaRecorder.start();
      shouldSendAudioRef.current = true;
      setIsListening(true);
      setLiveText("Recording audio...");

      // Web Audio API VAD (Voice Activity Detection)
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 512;
      source.connect(analyserRef.current);

      const checkSilence = () => {
        if (mediaRecorder.state !== 'recording') return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const volume = sum / dataArray.length;

        if (volume > 15) { // User is speaking
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
        } else { // Silence
          if (!silenceTimerRef.current) {
            silenceTimerRef.current = setTimeout(() => {
              if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
              }
            }, 2500); // Wait 2.5s of silence before sending
          }
        }
        requestAnimationFrame(checkSilence);
      };
      requestAnimationFrame(checkSilence);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access denied or unavailable.");
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      shouldSendAudioRef.current = true;
      mediaRecorderRef.current.stop();
    }
  };

  const toggleVoiceMode = () => {
    if (isVoiceMode) {
      // Turn OFF voice mode, switch to text mode
      setIsVoiceMode(false);
      shouldSendAudioRef.current = false;
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      setIsListening(false);
    } else {
      // Turn ON voice mode
      setIsVoiceMode(true);
      startListening();
    }
  };

  const sendListening = () => {
    if (!isListening) {
      if (inputText.trim()) {
        handleUserVoiceInput(inputText);
        setInputText('');
      }
      return;
    }
    stopListening();
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendListening();
    }
  };

  const toggleSpeaker = () => {
    setIsSpeakerMuted(!isSpeakerMuted);
    if (!isSpeakerMuted && currentAudioRef.current) {
      currentAudioRef.current.pause();
    }
  };

  const showQuote = !isExpanded && (isMobile ? mobileQuoteVisible : isHovered);

  return (
    <>
      {/* Floating Chat Window (Expanded) */}
      <div
        className="voice-widget-chat-window"
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
                padding: msg.text === "🎤 Audio Message" ? '8px 16px' : '12px 16px',
                borderRadius: '16px',
                borderTopLeftRadius: msg.role === 'assistant' ? '4px' : '16px',
                borderTopRightRadius: msg.role === 'user' ? '4px' : '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                fontSize: '14px',
                lineHeight: '1.5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '42px'
              }}>
                {msg.text === "🎤 Audio Message" ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '3px', height: '12px', background: 'white', borderRadius: '2px', animation: 'pulse 0.8s ease-in-out infinite alternate', opacity: 0.8 }} />
                    <span style={{ width: '3px', height: '18px', background: 'white', borderRadius: '2px', animation: 'pulse 0.8s ease-in-out infinite alternate 0.2s', opacity: 0.8 }} />
                    <span style={{ width: '3px', height: '10px', background: 'white', borderRadius: '2px', animation: 'pulse 0.8s ease-in-out infinite alternate 0.4s', opacity: 0.8 }} />
                    <span style={{ width: '3px', height: '16px', background: 'white', borderRadius: '2px', animation: 'pulse 0.8s ease-in-out infinite alternate 0.6s', opacity: 0.8 }} />
                    <span style={{ width: '3px', height: '8px', background: 'white', borderRadius: '2px', animation: 'pulse 0.8s ease-in-out infinite alternate 0.8s', opacity: 0.8 }} />
                  </div>
                ) : (
                  msg.text
                )}
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
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                height: '42px',
                minWidth: '60px',
                justifyContent: 'center'
              }}>
                {liveText === "Recording audio..." ? (
                  <>
                    <span style={{ width: '3px', height: '16px', background: 'white', borderRadius: '2px', animation: 'pulse 0.6s ease-in-out infinite alternate' }} />
                    <span style={{ width: '3px', height: '24px', background: 'white', borderRadius: '2px', animation: 'pulse 0.6s ease-in-out infinite alternate 0.2s' }} />
                    <span style={{ width: '3px', height: '12px', background: 'white', borderRadius: '2px', animation: 'pulse 0.6s ease-in-out infinite alternate 0.4s' }} />
                    <span style={{ width: '3px', height: '20px', background: 'white', borderRadius: '2px', animation: 'pulse 0.6s ease-in-out infinite alternate 0.6s' }} />
                    <span style={{ width: '3px', height: '10px', background: 'white', borderRadius: '2px', animation: 'pulse 0.6s ease-in-out infinite alternate 0.8s' }} />
                  </>
                ) : (
                  <span style={{ fontStyle: 'italic' }}>{liveText}</span>
                )}
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
            onClick={toggleVoiceMode}
            title={isVoiceMode ? "Switch to Text Mode" : "Switch to Voice Mode"}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: isVoiceMode ? 'rgba(255, 87, 34, 0.1)' : '#f1f1f1',
              color: isVoiceMode ? '#ff5722' : '#666',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.2s'
            }}
          >
            {isVoiceMode ? <Keyboard size={20} /> : <Mic size={20} />}
          </button>

          <button
            onClick={toggleSpeaker}
            title={isSpeakerMuted ? "Unmute Assistant Voice" : "Mute Assistant Voice"}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: !isSpeakerMuted ? 'rgba(255, 87, 34, 0.1)' : '#f1f1f1',
              color: !isSpeakerMuted ? '#ff5722' : '#666',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.2s'
            }}
          >
            {!isSpeakerMuted ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>

          <div style={{ flex: 1, height: '40px', background: '#f8f9fa', borderRadius: '20px', display: 'flex', alignItems: 'center', padding: '0 16px', gap: '3px', overflow: 'hidden' }}>
            {!isListening ? (
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Type your message..."
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '14px',
                  color: '#333'
                }}
              />
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
            disabled={(!isListening && !inputText.trim()) || (isListening && !liveText)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: (!isListening && inputText.trim()) || (isListening && liveText) ? '#0a8035' : '#e0e0e0',
              color: 'white',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: (!isListening && inputText.trim()) || (isListening && liveText) ? 'pointer' : 'not-allowed',
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
        className="voice-widget-fab-container"
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
        {/* Hover Quote Tooltip */}
        <div style={{
          position: 'absolute',
          right: '100px',
          bottom: '20px',
          background: 'white',
          padding: '8px 12px',
          borderRadius: '16px 16px 0 16px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
          fontSize: '13px',
          fontWeight: '500',
          color: '#ff5722',
          whiteSpace: 'nowrap',
          opacity: showQuote ? 1 : 0,
          transform: showQuote ? 'translateX(0) translateY(0)' : 'translateX(10px) translateY(10px)',
          visibility: showQuote ? 'visible' : 'hidden',
          transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          pointerEvents: 'none'
        }}>
          Hi!! I'm your Voice Assistant!
          <div style={{
            position: 'absolute',
            right: '-6px',
            bottom: '0',
            width: '0',
            height: '0',
            borderTop: '8px solid transparent',
            borderLeft: '8px solid white'
          }} />
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'white',
            color: 'white',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 6px 24px rgba(0, 0, 0, 0.15)',
            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            transform: isExpanded ? 'scale(0)' : 'scale(1)',
            opacity: isExpanded ? 0 : 1,
            pointerEvents: isExpanded ? 'none' : 'auto',
          }}
        >
          <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isListening ? (
              <div style={{ position: 'absolute', inset: '-4px', border: '3px solid #ff5722', borderRadius: '50%', animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
            ) : (
              <>
                <div style={{ position: 'absolute', inset: '0px', borderRadius: '50%', border: '2px solid rgba(255, 87, 34, 0.4)', animation: 'ripple 2s linear infinite' }} />
                <div style={{ position: 'absolute', inset: '0px', borderRadius: '50%', border: '2px solid rgba(255, 87, 34, 0.2)', animation: 'ripple 2s linear infinite 1s' }} />
              </>
            )}
            <img
              src={ChefMascot}
              alt="Voice Assistant"
              style={{
                width: '60px',
                height: '60px',
                objectFit: 'contain'
              }}
            />
          </div>
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
          @keyframes ripple {
            0% { transform: scale(1); opacity: 1; border-width: 2px; }
            100% { transform: scale(1.6); opacity: 0; border-width: 0px; }
          }
          @media (max-width: 768px) {
            .voice-widget-fab-container {
              bottom: 90px !important;
              right: 16px !important;
            }
            .voice-widget-chat-window {
              width: calc(100vw - 32px) !important;
              height: 70vh !important;
              bottom: 90px !important;
              right: 16px !important;
              z-index: 9999 !important;
            }
          }
        `}
      </style>
    </>
  );
};

export default VoiceWidget;
