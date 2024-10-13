import { useState, useRef, useEffect } from "react";

interface SpeechRecognitionProps {
  setInputText: React.Dispatch<React.SetStateAction<string>>;
}

const useSpeechRecognition = ({ setInputText }: SpeechRecognitionProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingComplete, setRecordingComplete] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startRecording = () => {
    console.log("start Recording called");
    recognitionRef.current = new window.webkitSpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;

    recognitionRef.current.onresult = (event: any) => {
      console.log("Listening right now");
      if (event.results[event.results.length - 1].isFinal) {
        const { transcript } = event.results[event.results.length - 1][0];
        setInputText((prevInputText) => {
          const newValue: string = prevInputText + transcript;
          console.log("newVal: ", newValue);
          return newValue;
        });
      }
    };

    recognitionRef.current.start();
  };

  const stopRecording = () => {
    console.log("stopped recording");
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setRecordingComplete(true);
    }
  };

  const handleToggleRecording = () => {
    if (!isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
    setIsRecording(!isRecording);
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return {
    isRecording,
    recordingComplete,
    handleToggleRecording,
  };
};

export default useSpeechRecognition;
