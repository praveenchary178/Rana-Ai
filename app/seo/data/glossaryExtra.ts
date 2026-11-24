// Extra depth for /glossary/* pages: a worked example, a practical checklist and more FAQs per term.
// Merged into the glossary pages in app/seo/index.ts. Keep it practical and true; regulatory entries stay general.

export type GlossaryExtra = { example: string; checklist: { h2: string; bullets: string[] }; faq: { q: string; a: string }[]; desc?: string; title?: string };

export const GLOSSARY_EXTRA: Record<string, GlossaryExtra> = {
  "ai-voice-agent": {
    example: "A clinic's phone rings at 9:40 pm. Instead of voicemail, the AI voice agent answers in Telugu, tells the caller the doctor's OPD timings and fee, books a slot for tomorrow at 10:20 and sends the front desk a summary on WhatsApp. The whole call takes about a minute, and nobody at the clinic had to pick up.",
    checklist: { h2: "What to check before you buy one", bullets: ["Test it on a real phone call, not a website demo, in your customers' language", "Check how quickly it replies; long pauses make callers hang up", "Interrupt it mid-sentence and see whether it stops and listens", "Ask what you get after each call: recording, transcript, summary, lead score", "Confirm who writes and maintains the script, and how fast changes go live"] },
    faq: [{ q: "Is an AI voice agent the same as a chatbot?", a: "They use similar language technology, but an AI voice agent works on an ordinary phone call. It has to understand speech, cope with noise and interruptions, and reply out loud fast enough to feel like a conversation." }, { q: "Can an AI voice agent transfer a call to a person?", a: "Yes. Good agents hand over when the caller asks for a person or when the request needs human judgment, and pass a summary so the caller doesn't repeat themselves." }],
  },
  "voice-bot": {
    example: "An older voice bot asks 'Say billing or support' and fails when the caller says 'my last bill was charged twice'. A modern voice bot understands that sentence, finds the duplicate charge question in its knowledge, and either answers it or routes the caller to billing with the details already captured.",
    checklist: { h2: "Old-style voice bot or modern AI voice agent?", bullets: ["Can callers speak in full sentences, or only say keywords?", "Does it handle Hindi–English or Telugu–English mixed in one sentence?", "Can it answer questions it wasn't explicitly scripted for, from your FAQs?", "Does it keep track of what the caller said earlier in the call?"] },
    faq: [{ q: "What is a voice bot used for?", a: "Answering common questions, booking appointments, confirming orders, sending reminders and routing calls — the repetitive calls that take up most of a front desk's or telecaller's day." }, { q: "What is the difference between a voice bot and IVR?", a: "IVR makes callers press keys through a fixed menu. A voice bot lets them speak, and a modern one understands free speech and can solve the request instead of only routing it." }],
    desc: "Voice bot meaning: an automated system that talks to callers by voice. How modern voice bots differ from IVR, what they're used for and what to check.",
  },
  "conversational-ai": {
    example: "A caller says, 'I booked for Saturday, can I make it Sunday same time?' Conversational AI understands that 'it' is the existing booking, that 'same time' means the slot already held, and checks Sunday's availability — without asking the caller to repeat their name, date and time.",
    checklist: { h2: "The building blocks", bullets: ["Speech-to-text: turns the caller's voice into words", "Language understanding: works out what the caller wants and remembers context", "Decision and actions: looks up answers, books, updates records", "Text-to-speech: replies in a natural voice", "Turn-taking: knows when to speak, when to wait and when to stop if interrupted"] },
    faq: [{ q: "Where is conversational AI used?", a: "In customer support, sales calls, appointment booking, order confirmation, website chat and WhatsApp assistants — anywhere a back-and-forth conversation would otherwise need a person." }, { q: "Does conversational AI work in Indian languages?", a: "Yes, with the right speech and language models. Test it with real callers, because everyday Indian speech mixes languages, accents and English words." }],
    desc: "Conversational AI meaning: AI that holds natural back-and-forth conversations by voice or text. Its building blocks, uses and how it works in Indian languages.",
  },
  "ivr": {
    example: "A typical IVR: 'Press 1 for appointments, 2 for reports, 3 for billing.' A caller who wants to move an appointment and ask about a report has to go through two menus, often hangs up, and calls again. With an AI voice agent the same caller just says both things and gets both handled in one call.",
    checklist: { h2: "Signs your IVR is costing you customers", bullets: ["Many calls end while the caller is still in the menu", "Most callers press 0 or keep repeating 'agent'", "Callers ask questions your menu doesn't cover", "You need separate recordings for every language", "Changing the menu needs a vendor ticket"] },
    faq: [{ q: "What is the full form of IVR?", a: "Interactive Voice Response. It's the automated phone menu that plays recorded prompts and routes callers by the keys they press." }, { q: "Can I keep my IVR and add AI?", a: "Yes. Many businesses point one IVR option, or after-hours calls, to an AI voice agent first, then replace the menu once they're happy with the results." }],
  },
  "dlt-registration": {
    example: "A coaching institute wants to send admission SMS and run promotional calls. It registers as a principal entity on an operator's DLT platform, registers its sender headers and SMS templates, and keeps a record of the consents it has collected. Messages that don't match a registered template are blocked by the operator.",
    checklist: { h2: "A simple DLT checklist", bullets: ["Register your business (principal entity) on a telecom operator's DLT portal", "Register the headers or numbers you send messages or make calls from", "Register SMS content templates, marked promotional, transactional or service", "Record customer consents where your messages need them", "Check your setup with your telecom provider before starting a campaign"] },
    faq: [{ q: "Which operators run DLT platforms?", a: "The major Indian telecom operators each run a DLT platform. Registering on one is generally recognised across operators — confirm the details with the operator you register with." }, { q: "How long does DLT registration take?", a: "It varies by operator and by how complete your documents are. Plan for some days for entity approval, plus time for header and template approvals." }],
    desc: "DLT registration explained: what businesses register on India's telecom DLT platforms for commercial SMS and calls, with a simple checklist and FAQs.",
  },
  "trai-tcccpr-rules": {
    example: "A real estate firm buys a list of numbers and starts promotional calls from an ordinary mobile number at 9 pm. Under TCCCPR that's risky on several counts: the calls may reach DND-registered people without consent, come from an unregistered number, and fall outside permitted hours. Complaints can lead to the number being disconnected.",
    checklist: { h2: "Before you run a calling campaign", bullets: ["Know whether each call is promotional, transactional or service", "Have consent, or scrub the list against DND for promotional calls", "Use registered numbers or headers through your telecom provider", "Call only within permitted hours", "Keep recordings and a do-not-call list, and honour opt-outs quickly"] },
    faq: [{ q: "Do TCCCPR rules apply to AI calls?", a: "Yes. The rules are about the communication, not who makes it. An AI calling agent must follow the same consent, DND, number and timing rules as a human telecaller." }, { q: "What happens if a business breaks TCCCPR rules?", a: "Customers can complain, and repeated complaints can lead to warnings, usage limits or disconnection of the sender's numbers, as set out in TRAI's regulations." }],
    title: "TCCCPR Full Form & TRAI Calling Rules Explained",
  },
  "speech-to-text": {
    example: "A caller says, 'Kal subah 10 baje ka appointment chahiye, Dr. Rao ke saath.' Good speech-to-text writes that down accurately, Hindi and English words included, so the agent understands 'tomorrow, 10 am, Dr. Rao'. If it mishears '10' as '2', the booking goes wrong.",
    checklist: { h2: "How to test speech-to-text for your calls", bullets: ["Use real phone audio, not studio recordings", "Test names, addresses, numbers and dates — they matter most", "Include mixed-language sentences your customers actually use", "Try noisy settings: traffic, shops, speakerphone", "Read the transcripts, not just the summary"] },
    faq: [{ q: "What does ASR mean?", a: "Automatic Speech Recognition — another name for speech-to-text, the technology that converts spoken audio into text." }, { q: "Does speech-to-text work for Telugu and Hindi?", a: "Yes. Accuracy depends on the model and the audio quality, so test with your own callers, especially for names and numbers." }],
    desc: "Speech-to-text (ASR) meaning: how spoken words become text on a phone call, why accuracy matters for AI calling in Indian languages, and how to test it.",
  },
  "text-to-speech": {
    example: "Two voices read the same line: 'Your appointment is confirmed for 10:20 tomorrow.' One sounds flat and stops oddly at '10:20'; the other reads the time naturally, with a slight pause before 'tomorrow'. On a phone call, the second keeps people listening.",
    checklist: { h2: "Choosing a voice for your calls", bullets: ["Match the language and accent your customers speak", "Check how it reads numbers, prices, dates and names", "Prefer a warm, clear voice over a dramatic one", "Make sure it sounds right on a phone line, not just headphones", "Keep the same voice across your calls so callers recognise it"] },
    faq: [{ q: "What is TTS?", a: "Text-to-speech — technology that converts written text into spoken audio. In an AI voice agent it's the 'voice' callers hear." }, { q: "Can TTS speak Indian languages?", a: "Yes. Modern TTS voices are available in Hindi, Telugu, Tamil and other Indian languages; quality varies, so listen to samples on a real phone call." }],
    desc: "Text-to-speech (TTS) meaning: how AI voices speak on calls, choosing a natural voice for Indian languages, and what to check on a real phone line.",
  },
  "voice-cloning": {
    example: "A school's founder records a few minutes of reading in a quiet room and signs a consent form. The AI calling agent then makes admission follow-up calls in a voice parents already recognise from the school's events and videos.",
    checklist: { h2: "Doing voice cloning responsibly", bullets: ["Get written consent from the person whose voice is cloned", "Use it only for the purposes they agreed to", "Record clean audio in a quiet room for the best result", "Keep the cloned voice private to your account", "Be ready to remove it if consent is withdrawn"] },
    faq: [{ q: "How much audio is needed to clone a voice?", a: "Usually a few minutes of clean, clearly spoken audio. More, better-quality audio generally gives a more natural result." }, { q: "Is voice cloning legal?", a: "Using someone's voice without permission can raise legal and ethical problems. Only clone a voice with the person's clear consent, for agreed uses." }],
    desc: "Voice cloning meaning: creating a synthetic voice from a short recording. How businesses use it for AI calls, how much audio is needed, and why consent matters.",
  },
  "call-transcription": {
    example: "A sales manager searches last week's transcripts for 'too expensive' and finds 37 calls where leads objected to price. Reading five of them shows the same misunderstanding about setup fees, so the team changes one line of the script.",
    checklist: { h2: "What to do with call transcripts", bullets: ["Search for common objections and fix the script", "Spot questions your FAQ doesn't answer yet", "Check that compliance lines are actually said", "Train new team members on real conversations", "Settle disputes about what was promised"] },
    faq: [{ q: "How accurate is automatic call transcription?", a: "Good systems are accurate enough to search and review calls, but phone audio, accents and mixed languages cause some errors. Always check the recording when the exact words matter." }, { q: "Are transcripts kept private?", a: "They should be stored securely in your account and only accessible to your team. Check your provider's data-handling and retention policy." }],
    desc: "Call transcription meaning: a searchable written record of every call. How businesses use transcripts to fix scripts, train teams and check compliance.",
  },
  "call-recording-consent": {
    example: "The agent's greeting begins: 'Namaste, this is Priya from Green Valley Clinic. This call may be recorded for quality. How can I help?' One sentence, at the start, in the caller's language — and the caller knows where they stand.",
    checklist: { h2: "Good practice for recorded calls", bullets: ["Say the call may be recorded at the very start", "Explain why: quality, training, records", "Store recordings securely, with limited access", "Decide how long you keep them, and delete after that", "Mention call recording in your privacy policy"] },
    faq: [{ q: "Do I have to tell callers a call is recorded?", a: "It is widely treated as good practice and expected by customers and regulators. Rules differ by sector, so confirm what applies to you with your legal adviser." }, { q: "Can callers ask not to be recorded?", a: "Some will. Decide in advance how you'll handle that — for example, offering a call-back from a team member." }],
    desc: "Call recording consent: why and how to tell callers a call may be recorded, a sample greeting line, and good practice for storing call recordings.",
  },
  "lead-qualification": {
    example: "Two leads fill the same form. On the qualification call, one says they need a 3BHK in the next two months with a home loan approved; the other is 'just looking' for next year. The first goes straight to a sales manager today; the second gets a follow-up in a few months.",
    checklist: { h2: "Questions that qualify most leads", bullets: ["What made you enquire now?", "What are you looking for exactly?", "What budget range are you working with?", "Who else is involved in the decision?", "When do you want this in place?"] },
    faq: [{ q: "What is a qualified lead?", a: "A lead with a real need you can meet, a budget that fits, someone who can decide, and a timeline that's soon enough to act on now." }, { q: "Should every lead be qualified by phone?", a: "For high-value or time-sensitive sales, a short call works best because you can ask follow-up questions. AI calling makes it possible to do this for every lead within minutes." }],
    desc: "Lead qualification meaning: finding out which leads are ready to buy. Questions to ask, what makes a qualified lead, and how qualification calls work.",
  },
  "bant": {
    example: "A solar installer's AI agent calls a new lead: the monthly bill is about ₹4,000 (budget fits), the homeowner decides (authority), they want to cut power costs (need) and plan to install before summer (timeline). The lead is tagged hot and a site survey is booked.",
    checklist: { h2: "Using BANT without sounding like a form", bullets: ["Start with need — it's the easiest question to answer", "Ask budget as a range, not an exact figure", "Ask about the decision 'together', not 'are you the boss?'", "Agree a next step before the call ends", "Record answers on the lead card so sales doesn't ask again"] },
    faq: [],
    title: "BANT Meaning: Budget, Authority, Need, Timeline",
  },
  "speed-to-lead": {
    example: "A lead fills a home-loan form at 8:15 pm. Business A calls back the next morning; by then the lead has spoken to two other lenders. Business B's AI agent calls at 8:16 pm, answers questions and books a call with an advisor for 10 am.",
    checklist: { h2: "How to improve speed to lead", bullets: ["Measure the time from enquiry to first real conversation", "Call new leads automatically, including nights and weekends", "Route hot leads to a person instantly", "Retry unanswered calls a few times over the day", "Follow up on WhatsApp if the lead doesn't pick up"] },
    faq: [{ q: "What is a good speed to lead?", a: "As fast as possible — ideally within a few minutes of the enquiry, while the person is still thinking about it." }, { q: "How do I measure speed to lead?", a: "Record when each enquiry arrives and when the first real conversation happens, then track the median time across all leads each week." }],
    desc: "Speed to lead meaning: how fast you contact a new lead after they enquire. Why minutes matter, how to measure it and practical ways to call leads faster.",
  },
  "missed-call-service": {
    example: "A dairy brand prints 'Give a missed call to 9xxxxx' on its packets. Hundreds of numbers arrive a day. Without follow-up they're just a list; with an AI calling agent each one gets a call within a minute asking which product they want and where to deliver.",
    checklist: { h2: "Getting value from a missed-call number", bullets: ["Call back every number fast, ideally within minutes", "Have a clear reason for the call-back: offer, information, order", "Ask for consent and preferences on the first call", "Remove people who say they aren't interested", "Track how many missed calls become customers"] },
    faq: [{ q: "Is a missed-call service free for customers?", a: "Yes — the call is cut before it connects, so the caller isn't charged. That's why it works well in India." }, { q: "What happens after a missed call?", a: "The business receives the caller's number and time. What happens next depends on the follow-up — an SMS, a WhatsApp message or, most effectively, a call-back." }],
    desc: "Missed-call service meaning: a free number customers give a missed call to. How missed-call marketing works in India and how to turn missed calls into sales.",
  },
  "auto-dialer": {
    example: "A telecalling team has 1,000 numbers. With manual dialling each person types numbers and waits through rings. An auto dialer dials the next number automatically, but the telecaller still has every conversation, including the hundreds that never connect or say 'call later'.",
    checklist: { h2: "Auto dialer, predictive dialer or AI calling?", bullets: ["Auto dialer: removes manual dialling, people still talk", "Predictive dialer: dials several numbers per agent, risks dropped calls", "AI calling agent: dials and has the first conversation itself", "Pick based on how much of the conversation is repetitive"] },
    faq: [{ q: "Is an auto dialer legal in India?", a: "The dialler itself is a tool. What matters is following TRAI's rules for the calls it makes: consent or DND checks for promotions, registered numbers and permitted hours." }, { q: "Does an auto dialer replace telecallers?", a: "No. It saves dialling time, but a person still has to have each conversation." }],
    desc: "Auto dialer meaning: software that dials numbers from a list automatically. How it compares with predictive dialers and AI calling agents, and when to use it.",
  },
  "predictive-dialer": {
    example: "Five agents, a predictive dialer and a list of 2,000 numbers. The dialer calls 12 numbers at once, expecting most not to answer. When eight people answer, five get an agent and three hear silence and hang up — often annoyed enough to complain.",
    checklist: { h2: "Before you use a predictive dialer", bullets: ["Keep the abandoned-call rate low", "Play a short message if no agent is free, rather than silence", "Respect DND and calling-hour rules", "Watch complaint rates as closely as talk time"] },
    faq: [{ q: "What is the difference between predictive and progressive dialers?", a: "A progressive dialer calls one number per free agent; a predictive dialer calls several per agent and predicts when agents will be free, which is faster but risks dropped calls." }, { q: "Why do people get silent calls?", a: "Often because a predictive dialer connected the call but no agent was free to take it." }],
    desc: "Predictive dialer meaning: a dialer that calls several numbers per agent and predicts availability. How it works, the dropped-call risk and the alternatives.",
  },
  "concurrent-calls": {
    example: "A clinic gets 30 calls between 9 and 10 am, many at the same moment. With two receptionists, only two calls can be answered at once and the rest hear a busy tone. With 10 concurrent lines on an AI receptionist, all of them are answered.",
    checklist: { h2: "Working out how many you need", bullets: ["Find your busiest hour from call logs", "Count how many calls overlap at the peak", "For campaigns: number of leads × minutes per call ÷ hours you want it done in ÷ 60", "Add some headroom for spikes"] },
    faq: [{ q: "What happens when all concurrent lines are busy?", a: "Extra callers hear a busy tone or wait, depending on your setup. For outbound campaigns, extra calls simply wait their turn." }],
  },
  "virtual-number": {
    example: "A real estate firm puts one 10-digit number on all its hoardings. Calls to it ring the AI agent first, which qualifies the caller and transfers hot buyers to the right sales manager — and the number never changes even when staff do.",
    checklist: { h2: "Choosing a virtual number", bullets: ["Local mobile-style number, landline-style number or toll-free?", "Can it forward to your team, your IVR or an AI agent?", "Can you see call logs and recordings?", "Is it registered correctly for the calls you plan to make?"] },
    faq: [{ q: "Can I use a virtual number for outbound calls?", a: "Often yes, depending on the provider and the number type. For commercial calls, check the registration requirements with your telecom provider." }, { q: "Can I keep my existing number?", a: "Usually you forward your existing number to the virtual number or AI agent, so customers keep calling the number they know." }],
    desc: "Virtual number meaning: a phone number not tied to a SIM, routed over the internet. How businesses in India use virtual numbers and what to check.",
  },
  "sip-trunking": {
    example: "A hospital's call centre has 20 phone lines. Instead of 20 physical lines, a SIP trunk carries all 20 calls over one internet connection, and adding capacity for flu season is a settings change rather than new cabling.",
    checklist: { h2: "When SIP trunking matters to you", bullets: ["You run your own phone system (PBX) or contact-centre software", "You need many calls at once on one connection", "You want to connect a voice AI to existing numbers", "If you just want calls answered, a managed service handles this for you"] },
    faq: [{ q: "What does SIP stand for?", a: "Session Initiation Protocol — the standard used to set up and manage voice calls over the internet." }, { q: "Do I need SIP trunking to use an AI voice agent?", a: "Not with a managed service. Some businesses with their own phone systems use a SIP trunk to connect the AI agent to existing numbers." }],
    desc: "SIP trunking meaning: connecting phone calls over the internet instead of physical lines. When businesses need it and how it connects AI voice agents.",
  },
  "cpaas": {
    example: "A fintech's developers use a CPaaS to send OTP SMS, place verification calls and send WhatsApp updates from their app. A small shop wanting its phone answered would rather buy a finished product than build on these APIs.",
    checklist: { h2: "CPaaS or a finished product?", bullets: ["Choose CPaaS if you have developers and are building communication into your own product", "Choose a finished product if you want a working solution without writing code", "Compare total cost, including development and maintenance time"] },
    faq: [{ q: "What is an example of CPaaS?", a: "APIs that let an app send SMS, make and receive calls, or send WhatsApp messages — used for OTPs, alerts, support and marketing." }, { q: "Is CPaaS the same as a call centre software?", a: "No. CPaaS provides building blocks for developers; call-centre software is a ready-made application for agents." }],
    desc: "CPaaS meaning: Communications Platform as a Service, APIs for calls, SMS and WhatsApp. Examples, who uses it and when a finished product is better.",
  },
  "call-deflection": {
    example: "An e-commerce brand gets 400 'where is my order?' calls a day. An AI agent answers them by checking order status and reading out the delivery date. Agents now spend their time on returns and complaints that need judgment.",
    checklist: { h2: "Good call deflection, not frustrating deflection", bullets: ["Deflect routine requests: status, timings, bookings, FAQs", "Always offer a way to reach a person", "Measure whether callers call back about the same thing", "Review transcripts of deflected calls every week"] },
    faq: [{ q: "What is a good call deflection rate?", a: "It depends on your call mix. Track it alongside repeat calls and satisfaction — a high deflection rate means nothing if callers have to call again." }, { q: "Is deflecting calls bad for customers?", a: "Not if their need is met quickly. It's bad when callers are blocked from reaching a person they actually need." }],
    desc: "Call deflection meaning: resolving a caller's request without a human agent. How to deflect routine calls well, measure it and avoid frustrating callers.",
  },
  "first-call-resolution": {
    example: "A customer calls about a wrong delivery address. If the first call fixes it, that's one call. If they're told 'we'll call you back' and nobody does, it becomes three calls, a complaint and probably a lost customer.",
    checklist: { h2: "How to improve first-call resolution", bullets: ["Give whoever answers — person or AI — the information to solve common requests", "Let them take action, not just take messages", "Track why calls weren't resolved and fix the top reasons", "Hand over with full notes when a person is needed"] },
    faq: [{ q: "How is first-call resolution measured?", a: "Usually as the share of issues resolved without the customer calling back about the same thing within a set period, such as 7 days." }, { q: "What is a good FCR rate?", a: "It varies by industry and call type. Track your own trend over time and focus on the reasons calls aren't resolved." }],
    desc: "First-call resolution (FCR) meaning: solving the customer's issue on the first call. How to measure it, why it matters and practical ways to improve it.",
  },
  "sentiment-analysis": {
    example: "A caller's words turn sharp — 'This is the third time I'm calling' — and the call is flagged as negative. The manager gets an alert, calls the customer back within the hour, and turns a likely bad review into a resolved complaint.",
    checklist: { h2: "Using sentiment in practice", bullets: ["Alert a person when a call turns negative", "Review negative calls weekly for root causes", "Ask happy callers for a review", "Don't judge individual staff on sentiment scores alone"] },
    faq: [{ q: "How accurate is sentiment analysis?", a: "It's a useful signal, not a verdict. Sarcasm, mixed languages and polite complaints can be misread, so check the transcript before acting on a single call." }, { q: "Does sentiment analysis work in Indian languages?", a: "It can, depending on the model. Test it on your own calls in the languages your customers use." }],
    desc: "Sentiment analysis meaning: detecting whether a caller sounds positive, neutral or upset. How businesses use it on calls, its limits and Indian languages.",
  },
};
