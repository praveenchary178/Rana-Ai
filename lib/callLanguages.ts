// Languages a website lead can choose for RANA's instant call ("Call me in …"). Priya opens the call in that language,
// in its own script, and keeps to it unless the person switches. Safe to import in client components.

export type CallLanguage = { code: string; label: string; native: string; sarvam: string };

export const CALL_LANGUAGES: CallLanguage[] = [
  { code: "en", label: "English", native: "English", sarvam: "en-IN" },
  { code: "hi", label: "Hindi", native: "हिन्दी", sarvam: "hi-IN" },
  { code: "te", label: "Telugu", native: "తెలుగు", sarvam: "te-IN" },
  { code: "ta", label: "Tamil", native: "தமிழ்", sarvam: "ta-IN" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ", sarvam: "kn-IN" },
  { code: "ml", label: "Malayalam", native: "മലയാളം", sarvam: "ml-IN" },
];

/** A known language for the call, by code ("te") or English name ("Telugu"); English otherwise. */
export function callLanguage(v: unknown): CallLanguage {
  const k = String(v ?? "").trim().toLowerCase();
  return CALL_LANGUAGES.find((l) => l.code === k || l.label.toLowerCase() === k || l.sarvam.toLowerCase() === k) || CALL_LANGUAGES[0];
}

/** "తెలుగు · Telugu" for the form's options. */
export const languageOption = (l: CallLanguage) => (l.code === "en" ? l.label : `${l.native} · ${l.label}`);

/**
 * Priya's opening line in the chosen language. English keeps the exact action ("Thanks for booking a demo just now");
 * the other languages thank them for getting in touch, which fits every form.
 */
export function greetingIn(lang: CallLanguage, firstName: string, englishAction: string): string {
  const n = firstName.trim();
  switch (lang.code) {
    case "hi": return `नमस्ते${n ? ` ${n} जी` : ""}, मैं RANA AI से प्रिया बोल रही हूँ। अभी हमसे संपर्क करने के लिए धन्यवाद। क्या अभी दो मिनट बात कर सकते हैं?`;
    case "te": return `నమస్కారం${n ? ` ${n} గారు` : ""}, నేను RANA AI నుండి ప్రియ మాట్లాడుతున్నాను. ఇప్పుడే మమ్మల్ని సంప్రదించినందుకు ధన్యవాదాలు. ఇప్పుడు రెండు నిమిషాలు మాట్లాడొచ్చా?`;
    case "ta": return `வணக்கம்${n ? ` ${n}` : ""}, நான் RANA AI-யிலிருந்து பிரியா பேசுகிறேன். இப்போது எங்களைத் தொடர்பு கொண்டதற்கு நன்றி. இப்போது இரண்டு நிமிடம் பேசலாமா?`;
    case "kn": return `ನಮಸ್ಕಾರ${n ? ` ${n} ಅವರೇ` : ""}, ನಾನು RANA AI ಇಂದ ಪ್ರಿಯಾ ಮಾತನಾಡುತ್ತಿದ್ದೇನೆ. ಈಗಷ್ಟೇ ನಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಿದ್ದಕ್ಕೆ ಧನ್ಯವಾದಗಳು. ಈಗ ಎರಡು ನಿಮಿಷ ಮಾತನಾಡಬಹುದೇ?`;
    case "ml": return `നമസ്കാരം${n ? ` ${n}` : ""}, ഞാൻ RANA AI-യിൽ നിന്ന് പ്രിയയാണ് സംസാരിക്കുന്നത്. ഇപ്പോൾ ഞങ്ങളെ ബന്ധപ്പെട്ടതിന് നന്ദി. ഇപ്പോൾ രണ്ട് മിനിറ്റ് സംസാരിക്കാമോ?`;
    default: return `Hi${n ? ` ${n}` : ""}, this is Priya from RANA AI. Thanks for ${englishAction} just now. Is this a good time for two minutes?`;
  }
}
