import { Smile, Meh, Frown, Brain, Heart, CloudRain, Zap, Sun } from "lucide-react";

export const emotionsList = [
  { 
    id: "happy", label: "Happy", icon: Sun, 
    color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100",
    hoverBg: "hover:bg-emerald-100", activeBg: "bg-emerald-100"
  },
  { 
    id: "calm", label: "Calm", icon: Heart, 
    color: "text-sky-600", bg: "bg-sky-50", border: "border-sky-100",
    hoverBg: "hover:bg-sky-100", activeBg: "bg-sky-100"
  },
  { 
    id: "anxious", label: "Anxious", icon: Brain, 
    color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100",
    hoverBg: "hover:bg-amber-100", activeBg: "bg-amber-100"
  },
  { 
    id: "frustrated", label: "Frustrated", icon: Zap, 
    color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100",
    hoverBg: "hover:bg-orange-100", activeBg: "bg-orange-100"
  },
  { 
    id: "depressed", label: "Depressed", icon: CloudRain, 
    color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100",
    hoverBg: "hover:bg-rose-100", activeBg: "bg-rose-100"
  },
];

export const PILL_COLORS = {
  happy:      { bg: "bg-emerald-50", text: "text-emerald-600", activeBg: "bg-emerald-100", border: "border-emerald-100" },
  calm:       { bg: "bg-sky-50",     text: "text-sky-600",     activeBg: "bg-sky-100",     border: "border-sky-100"     },
  anxious:    { bg: "bg-amber-50",   text: "text-amber-600",   activeBg: "bg-amber-100",   border: "border-amber-100"   },
  frustrated: { bg: "bg-orange-50",  text: "text-orange-600",  activeBg: "bg-orange-100",  border: "border-orange-100"  },
  depressed:  { bg: "bg-rose-50",    text: "text-rose-600",    activeBg: "bg-rose-100",    border: "border-rose-100"    },
};
