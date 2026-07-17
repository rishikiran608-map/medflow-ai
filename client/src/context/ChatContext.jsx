import { createContext, useContext, useState, useEffect, useRef } from "react";
import api from "../api/api";
import { useLanguage } from "./LanguageContext";
import { toast } from "sonner";

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const { locale, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const role = localStorage.getItem("userRole") || "Patient";
  const userName = localStorage.getItem("userName") || "User";

  // Dynamic greetings and themes per dashboard role
  const roleConfigs = {
    "Patient": {
      agentName: locale === "te" ? "రోగి ఆరోగ్య సహాయకుడు" : "Patient Health Assistant",
      greeting: locale === "te" 
        ? `👋 నమస్తే ${userName}! నేను మీ **రోగి ఆరోగ్య సహాయకుడిని**.\n\nనేను మీ నిరీక్షణ సమయం, ప్రిస్క్రిప్షన్లు, ల్యాబ్ నివేదికలు మరియు లక్షణాలను తనిఖీ చేయడంలో సహాయపడతాను. ఇలా అడగండి:\n\n1. 💊 *\"నా మందుల షెడ్యూల్ ఏమిటి?\"*\n2. 🟢 *\"నా క్యూ స్థితి మరియు వేచి ఉండే సమయం చూపించు\"*\n3. ⚠️ *\"ఆస్పిరిన్ మరియు క్లోపిడోగ్రెల్ పరస్పర ప్రతికూలతలను తనిఖీ చేయి\"*`
        : `👋 Hello ${userName}! I am your **Patient Health Assistant**.\n\nI can help you check your live wait times, review prescriptions, understand lab reports, or check symptoms. Try asking:\n\n1. 💊 *\"What is my tablet schedule?\"*\n2. 🟢 *\"Show my queue status and wait time\"*\n3. ⚠️ *\"Check drug interactions for Aspirin and Clopidogrel\"*`,
      suggestions: locale === "te"
        ? ["నా ప్రిస్క్రిప్షన్లు చూపించు", "నా క్యూ స్థితి తనిఖీ చేయి", "డ్రగ్ ఇంటరాక్షన్ తనిఖీ చేయి"]
        : ["Show my prescriptions", "Check my queue status", "Drug interaction check for Aspirin"],
      themeColor: "from-blue-600 to-cyan-500",
      accent: "bg-blue-600 text-white",
      logo: "🤖"
    },
    "Doctor": {
      agentName: locale === "te" ? "డాక్టర్ క్లినికల్ సహాయకుడు" : "Doctor Clinical Assistant",
      greeting: locale === "te"
        ? `🩺 నమస్తే డాక్టర్! నేను మీ **క్లినికల్ సహాయకుడిని**.\n\nనేను క్లినిక్ చికిత్స మార్గదర్శకాలను శోధించగలను, రోగి ఆరోగ్య చరిత్ర సారాంశాలను సేకరించగలను మరియు SOAP ప్రిస్క్రిప్షన్‌లను డ్రాఫ్ట్ చేయగలను.`
        : `🩺 Hello Doctor! I am your **Clinical Assistant**.\n\nI can search clinic treatment guidelines, compile patient history briefings, and draft SOAP clinical summaries.`,
      suggestions: locale === "te"
        ? ["రోగి వివరాలు patient@medflow.com", "రక్తపోటు నివేదిక సారాంశం", "డయాబెటిస్ గైడ్‌లైన్స్"]
        : ["Summarize history for patient@medflow.com", "Draft Hypertension SOAP notes", "Diabetes guidelines"],
      themeColor: "from-teal-600 to-cyan-600",
      accent: "bg-teal-600 text-white",
      logo: "🩺"
    },
    "Hospital Admin": {
      agentName: locale === "te" ? "రిసెప్షన్ సహాయకుడు" : "Reception Assistant",
      greeting: locale === "te"
        ? `📋 నమస్తే! నేను మీ **రిసెప్షనిస్ట్ AI సహాయకుడిని**.\n\nనేను వాక్-ఇన్ బుకింగ్‌లను షెడ్యూల్ చేయగలను, క్యూ వేచి ఉండే సమయాలను అంచనా వేయగలను మరియు నోటిఫికేషన్ అవుట్‌బాక్స్ లాగ్‌లను చూపించగలను.`
        : `📋 Hello! I am your **Receptionist AI Assistant**.\n\nI can schedule walk-in bookings, estimate active backlog queue wait times, or retrieve Twilio notification outbox logs.`,
      suggestions: locale === "te"
        ? ["క్యూ బ్యాక్‌లాగ్ లెక్కించు", "అడ్మిన్ రిపోర్ట్ చూపించు", "నో-షో ప్రయాణ చెక్"]
        : ["Calculate queue backlog", "Show admin monitor report", "Commute no-show checks"],
      themeColor: "from-indigo-600 to-blue-600",
      accent: "bg-indigo-600 text-white",
      logo: "📋"
    },
    "Pharmacist": {
      agentName: locale === "te" ? "ఫార్మసీ సహాయకుడు" : "Pharmacy Assistant",
      greeting: locale === "te"
        ? `💊 ఫార్మసీ విభాగానికి స్వాగతం. నేను మీ **ఫార్మసీ సహాయకుడిని**.\n\nనేను మందుల కలయికలను ధృవీకరించగలను, ప్రతికూల ప్రతిచర్యల హెచ్చరికలను ఆడిట్ చేయగలను మరియు చేతివ్రాతను స్కాన్ చేయగలను.`
        : `💊 Welcome to the Dispensary Hub. I am your **Pharmacy Assistant**.\n\nI can verify duplicate medications, audit drug combinations for warnings, or translate handwriting scans.`,
      suggestions: locale === "te"
        ? ["ఆస్పిరిన్ + క్లోపిడోగ్రెల్ ఆడిట్", "లిపిటర్ ప్రత్యామ్నాయ మందులు", "మెట్‌ఫార్మిన్ మోతాదు షెడ్యూల్"]
        : ["Audit Aspirin + Clopidogrel warnings", "Suggest generic for Lipitor", "Dosage schedule Metformin"],
      themeColor: "from-amber-500 to-orange-500",
      accent: "bg-amber-600 text-white",
      logo: "💊"
    },
    "Clinic Owner": {
      agentName: locale === "te" ? "క్లినిక్ యజమాని సహాయకుడు" : "Clinic Owner Assistant",
      greeting: locale === "te"
        ? `💼 నమస్తే డైరెక్టర్. నేను మీ **క్లినిక్ యజమాని సహాయకుడిని**.\n\nనేను వ్యాపార పనితీరు (KPIs), ఆదాయ ప్రగతి, వైద్యుల సేవల उपयोग మరియు AI క్యూ ఆప్టిమైజేషన్ ప్రభావాలను చూపించగలను.`
        : `💼 Good day, Director. I am your **Clinic Owner Assistant**.\n\nI can provide high-level summaries of business KPIs, revenue progress, doctor utilization loads, and AI adoption trends.`,
      suggestions: locale === "te"
        ? ["క్లినిక్ బిజినెస్ KPIs", "వైద్యుల వినియోగ స్థాయిలు", "AI ఆప్టిమైజేషన్ ప్రభావం"]
        : ["Summarize clinic business KPIs", "Show doctor utilization levels", "AI optimization impact"],
      themeColor: "from-rose-500 to-pink-500",
      accent: "bg-rose-600 text-white",
      logo: "💼"
    }
  };

  const config = roleConfigs[role] || roleConfigs["Patient"];

  // Initialize conversation messages
  useEffect(() => {
    setMessages([
      { role: "assistant", content: config.greeting }
    ]);
  }, [role, config.greeting, locale]);

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.warning("Voice input is not supported in this browser. Please use Chrome.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = locale === "te" ? "te-IN" : "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setTimeout(() => handleSend(transcript), 200);
    };

    recognition.start();
  };

  const handleSend = async (textToSend) => {
    const messageText = textToSend || input;
    if (!messageText.trim()) return;

    if (!textToSend) setInput("");
    setMessages((prev) => [...prev, { role: "user", content: messageText }]);
    setIsLoading(true);

    try {
      const response = await api.post("/orchestrate/chat", {
        message: messageText,
        conversationId: `chat-${role.toLowerCase().replace(" ", "-")}`,
        language: locale
      });

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.data.response },
      ]);
    } catch (err) {
      console.error("Orchestrator chat context error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: locale === "te" 
            ? "⚠️ క్షమించండి, ఆభ్యర్థనను పూర్తి చేయలేకపోయాను. దయచేసి మళ్ళీ ప్రయత్నించండి."
            : "⚠️ Sorry, I could not complete that query. Verify your connection or try again in a moment.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        isOpen,
        setIsOpen,
        messages,
        setMessages,
        input,
        setInput,
        isLoading,
        isListening,
        handleVoiceInput,
        handleSend,
        config
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  return useContext(ChatContext);
}
