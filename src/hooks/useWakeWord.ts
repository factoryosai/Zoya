import { useState, useEffect, useRef } from "react";

export function useWakeWord(onWakeWordDetected: () => void, enabled: boolean = true) {
  const [isListeningForWakeWord, setIsListeningForWakeWord] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!enabled) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsListeningForWakeWord(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("SpeechRecognition API not supported in this browser for hands-free wake word.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US"; // Also catches hinglish phonetics

    recognition.onstart = () => {
      setIsListeningForWakeWord(true);
    };

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.toLowerCase().trim();
        console.log("Speech transcript:", transcript);
        
        const wakeWordPhrases = [
          "hey heer", "hai heer", "hi heer", "hello heer", 
          "ok heer", "listen heer", "heer ji", "hey her", 
          "hey hear", "hey hare", "hey hir", "hey fear", 
          "hey cheer", "hey dear", "hey hero", "aaye heer", 
          "ha heer", "hee heer", "heer"
        ];

        const detected = wakeWordPhrases.some((phrase) => transcript.includes(phrase));

        if (detected) {
          console.log("🔥 Wake word 'Hey Heer' detected! Triggering auto-connection...");
          onWakeWordDetected();
          try {
            recognition.stop();
          } catch (e) {}
          break;
        }
      }
    };

    recognition.onerror = (event: any) => {
      // Ignore non-fatal audio-capture or no-speech errors
      if (event.error !== "no-speech") {
        console.warn("Wake word recognition error:", event.error);
      }
    };

    recognition.onend = () => {
      // Automatically restart if still enabled
      if (enabled) {
        try {
          recognition.start();
        } catch (e) {}
      } else {
        setIsListeningForWakeWord(false);
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.warn("Failed to start speech recognition for wake word", e);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, [enabled, onWakeWordDetected]);

  return { isListeningForWakeWord };
}
