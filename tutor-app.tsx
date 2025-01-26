import React, { useState, useEffect } from "react"
import {
  Mic,
  MicOff,
  Send,
  BookOpen,
  Brain,
  Sparkles,
  GraduationCap,
  PencilLine,
  Save,
  Trash2,
  Plus,
  X,
  Languages,
} from "lucide-react"
import { type Language, translations } from "./types/language"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "./components/tooltip"

const systemPrompt = `### Foundation Information

1. **Company Info**: General educational entity providing an AI tutor, focusing on versatile learning support.
2. **Target Audience**: Learners of any age group with either French or English backgrounds.
3. **Value Proposition**: Offers personalized learning support, instant clarification of doubts, and tailored recommendations for study resources.
4. **Tutor Information**:
   - **Name or Identity**: Tutor
   - **Role and Objectives**: Assist learners in understanding a variety of subjects, suggest learning materials, and offer a bilingual educational experience.

### Objection Handling

1. **Accuracy Concerns**: Provide verified information and allow learners to validate with reliable sources when requested.
2. **Complex Topic Understanding**: Break down complicated concepts into simpler parts and provide examples or additional explanations.
3. **Language Fluency**: Confirm that Tutor can assist fluently in both English and French.
4. **Tech-related Issues**: Offer troubleshooting steps and advice on maximizing the Tutor experience.

### Script Structure Instructions

1. **Introduction and Language Preference**:
   - Introduce yourself as "Tutor," and ask for the learner's preferred language (French or English).

2. **Inquiry About Subject Matter**:
   - Ask the learner about the topic or subject they need assistance with.

3. **Understanding Learner's Background**:
   - Inquire about the learner's current understanding of the topic to tailor responses effectively.

4. **Providing Assistance**:
   - Offer explanations, simplify complex topics, and suggest additional study materials or resources.

5. **Checking for Understanding**:
   - Ensure the learner has understood by asking questions and offering further clarification if necessary.

6. **Encourage Engagement**:
   - Motivate the learner to explore related topics or continue practice based on current interests or courses.

7. **Addressing Objections or Concerns**:
   - Handle objections related to information accuracy, topic understanding, language issues, or technical support, as outlined in the earlier section.

8. **Concluding the Call**:
   - Summarize the session's key points, reinforce assignments or next steps, and express readiness for future assistance.`

const TutorApp = () => {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem("tutorMessages")
    return savedMessages ? JSON.parse(savedMessages) : []
  })
  const [input, setInput] = useState("")
  const [currentSubject, setCurrentSubject] = useState("")
  const [newSubject, setNewSubject] = useState("")
  const [subjects, setSubjects] = useState(() => {
    const savedSubjects = localStorage.getItem("tutorSubjects")
    return savedSubjects
      ? JSON.parse(savedSubjects)
      : [
          { name: "Math", icon: "Brain" },
          { name: "Science", icon: "Sparkles" },
          { name: "Literature", icon: "BookOpen" },
        ]
  })
  const [notes, setNotes] = useState(() => {
    const savedNotes = localStorage.getItem("tutorNotes")
    return savedNotes ? JSON.parse(savedNotes) : {}
  })
  const [currentNote, setCurrentNote] = useState("")
  const [isNotePanelOpen, setIsNotePanelOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [activeSection, setActiveSection] = useState<"chat" | "subjects" | "notes">("chat")
  const [language, setLanguage] = useState<Language>("en")

  useEffect(() => {
    localStorage.setItem("tutorNotes", JSON.stringify(notes))
  }, [notes])

  useEffect(() => {
    localStorage.setItem("tutorSubjects", JSON.stringify(subjects))
  }, [subjects])

  useEffect(() => {
    localStorage.setItem("tutorMessages", JSON.stringify(messages))
  }, [messages])

  const getIconComponent = (iconName) => {
    const icons = {
      Brain: Brain,
      Sparkles: Sparkles,
      BookOpen: BookOpen,
    }
    const IconComponent = icons[iconName] || BookOpen
    return <IconComponent className="h-6 w-6" />
  }

  const addSubject = () => {
    if (newSubject.trim() && !subjects.some((s) => s.name.toLowerCase() === newSubject.toLowerCase())) {
      const icon = ["Brain", "Sparkles", "BookOpen"][Math.floor(Math.random() * 3)]
      setSubjects([...subjects, { name: newSubject, icon }])
      setNewSubject("")
      // Optional: Add a success toast or notification here
    }
  }

  const deleteSubject = (subjectName) => {
    setSubjects(subjects.filter((s) => s.name !== subjectName))
    if (currentSubject === subjectName) {
      setCurrentSubject("")
    }
    const updatedNotes = { ...notes }
    delete updatedNotes[subjectName]
    setNotes(updatedNotes)
  }

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true

      recognition.onresult = (event) => {
        const latest = event.results[event.results.length - 1]
        setTranscript(latest[0].transcript)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      window.recognition = recognition
    }
  }, [])

  const toggleListening = () => {
    if (isListening) {
      window.recognition?.stop()
    } else {
      window.recognition?.start()
    }
    setIsListening(!isListening)
  }

  const handleSend = async () => {
    if (input.trim() || transcript.trim()) {
      const userMessage = input || transcript
      const newUserMessage = {
        text: userMessage,
        isUser: true,
        timestamp: new Date().toLocaleTimeString(),
      }
      setMessages((prevMessages) => [...prevMessages, newUserMessage])
      setInput("")
      setTranscript("")
      setIsLoading(true)

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [
              {
                role: "system",
                content: systemPrompt,
              },
              ...messages.map((msg) => ({
                role: msg.isUser ? "user" : "assistant",
                content: msg.text,
              })),
              {
                role: "user",
                content: userMessage,
              },
            ],
          }),
        })

        if (!response.ok) {
          throw new Error("API request failed")
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let assistantResponse = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6)
              if (data === "[DONE]") continue

              try {
                const parsed = JSON.parse(data)
                const content = parsed.choices[0]?.delta?.content || ""
                if (content) {
                  assistantResponse += content
                  setMessages((prevMessages) => {
                    const updatedMessages = [...prevMessages]
                    if (updatedMessages[updatedMessages.length - 1].isUser) {
                      updatedMessages.push({
                        text: assistantResponse,
                        isUser: false,
                        timestamp: new Date().toLocaleTimeString(),
                      })
                    } else {
                      updatedMessages[updatedMessages.length - 1].text = assistantResponse
                    }
                    return updatedMessages
                  })
                }
              } catch (e) {
                console.error("Error parsing chunk:", e)
              }
            }
          }
        }
      } catch (error) {
        console.error("Error in chat completion:", error)
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            text: "I'm sorry, I encountered an error. Please try again.",
            isUser: false,
            timestamp: new Date().toLocaleTimeString(),
          },
        ])
      } finally {
        setIsLoading(false)
      }
    }
  }

  const saveNote = () => {
    if (currentNote.trim() && currentSubject) {
      const timestamp = new Date().toISOString()
      setNotes((prev) => ({
        ...prev,
        [currentSubject]: [...(prev[currentSubject] || []), { id: timestamp, content: currentNote, timestamp }],
      }))
      setCurrentNote("")
    }
  }

  const t = (key: keyof typeof translations) => {
    if (translations[key] && translations[key][language]) {
      return translations[key][language]
    }
    console.warn(`Translation missing for key: ${key} in language: ${language}`)
    return key // Return the key itself as a fallback
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen bg-gradient-to-br from-indigo-100 to-purple-100">
        <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 md:p-6 rounded-b-xl md:rounded-b-2xl shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
            <div className="flex items-center space-x-3">
              <GraduationCap className="h-6 w-6 md:h-8 md:w-8" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">{t("title")}</h1>
                <p className="text-sm md:text-base text-purple-200">{t("subtitle")}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setLanguage(language === "en" ? "fr" : "en")}
                    className="flex items-center justify-center space-x-2 bg-white/20 px-3 py-1.5 md:px-4 md:py-2 rounded-lg hover:bg-white/30 transition-all"
                  >
                    <Languages className="h-4 w-4 md:h-5 md:w-5" />
                    <span>{language === "en" ? "FR" : "EN"}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{language === "en" ? "Switch to French" : "Passer à l'anglais"}</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setIsNotePanelOpen(!isNotePanelOpen)}
                    className="flex items-center justify-center space-x-2 bg-white/20 px-3 py-1.5 md:px-4 md:py-2 rounded-lg hover:bg-white/30 transition-all"
                  >
                    <PencilLine className="h-4 w-4 md:h-5 md:w-5" />
                    <span>{t("notes")}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{language === "en" ? "Take and manage your study notes" : "Prenez et gérez vos notes d'étude"}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </header>

        <div className="md:hidden flex items-center justify-around p-2 bg-white border-b">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setActiveSection("subjects")}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg ${
                  activeSection === "subjects" ? "bg-purple-100 text-purple-700" : "text-gray-600"
                }`}
              >
                <BookOpen className="h-4 w-4" />
                <span>{t("subjects")}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{language === "en" ? "Manage your study subjects" : "Gérez vos matières d'étude"}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setActiveSection("chat")}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg ${
                  activeSection === "chat" ? "bg-purple-100 text-purple-700" : "text-gray-600"
                }`}
              >
                <Brain className="h-4 w-4" />
                <span>{t("chat")}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{language === "en" ? "Chat with your AI tutor" : "Discutez avec votre tuteur IA"}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setActiveSection("notes")}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg ${
                  activeSection === "notes" ? "bg-purple-100 text-purple-700" : "text-gray-600"
                }`}
              >
                <PencilLine className="h-4 w-4" />
                <span>{t("notes")}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{language === "en" ? "View and edit your notes" : "Consultez et modifiez vos notes"}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex-1 flex flex-col md:flex-row p-2 md:p-4 gap-2 md:gap-4 overflow-hidden">
          <aside
            className={`${activeSection === "subjects" || !activeSection ? "block" : "hidden"} md:block w-full md:w-64 bg-white rounded-xl p-3 md:p-4 shadow-lg max-h-[300px] md:max-h-none overflow-y-auto`}
          >
            <h2 className="text-lg font-semibold mb-4">{t("studySubjects")}</h2>
            <div className="space-y-4">
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <input
                        type="text"
                        value={newSubject}
                        onChange={(e) => setNewSubject(e.target.value)}
                        placeholder={t("addNewSubject")}
                        className="w-full p-3 pl-4 pr-10 text-sm border rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all placeholder-gray-400"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newSubject.trim()) {
                            addSubject()
                          }
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {language === "en"
                          ? "Press Enter to add a new subject"
                          : "Appuyez sur Entrée pour ajouter une nouvelle matière"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                  {newSubject && (
                    <button
                      onClick={() => setNewSubject("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={addSubject}
                      disabled={!newSubject.trim()}
                      className="px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-95 transition-all duration-200 font-medium flex items-center gap-2 shadow-md hover:shadow-lg"
                    >
                      <Plus className="h-4 w-4" />
                      {t("add")}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {language === "en"
                        ? "Add a new subject to your list"
                        : "Ajoutez une nouvelle matière à votre liste"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="space-y-2">
                {subjects.map((subject, index) => (
                  <div
                    key={subject.name}
                    onClick={() => setCurrentSubject(subject.name)}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all group cursor-pointer hover:shadow-md animate-fadeIn ${
                      currentSubject === subject.name
                        ? "bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 shadow-sm"
                        : "hover:bg-gray-50"
                    }`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {getIconComponent(subject.icon)}
                    <span className="flex-1 font-medium">{subject.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteSubject(subject.name)
                      }}
                      className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-100 hover:text-red-500 rounded-full transition-all duration-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <main
            className={`${activeSection === "chat" || !activeSection ? "block" : "hidden"} md:block flex-1 flex flex-col bg-white rounded-xl shadow-lg min-h-0`}
          >
            <div className="flex-1 p-3 md:p-4 overflow-y-auto space-y-3 md:space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
                  <Brain className="h-16 w-16" />
                  <p className="text-xl">{t("askAnything")}</p>
                  <p className="text-sm">{t("tryAsking")}</p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div key={index} className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] md:max-w-md p-3 md:p-4 rounded-2xl shadow-sm ${
                        message.isUser ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white" : "bg-gray-100"
                      }`}
                    >
                      <p className="text-sm md:text-base">{message.text}</p>
                      <span className="text-[10px] md:text-xs opacity-75 mt-2 block">{message.timestamp}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 md:p-4 border-t">
              <div className="flex items-center gap-2 md:gap-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={toggleListening}
                      className={`p-2 md:p-3 rounded-full transition-all ${
                        isListening ? "bg-red-500 text-white animate-pulse" : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      {isListening ? (
                        <MicOff className="h-5 w-5 md:h-6 md:w-6" />
                      ) : (
                        <Mic className="h-5 w-5 md:h-6 md:w-6" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{language === "en" ? "Use voice input" : "Utiliser l'entrée vocale"}</p>
                  </TooltipContent>
                </Tooltip>

                <input
                  type="text"
                  value={input || transcript}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t("whatToLearn")}
                  className="flex-1 p-3 md:p-4 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all text-sm md:text-base"
                />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleSend}
                      disabled={isLoading}
                      className={`p-3 md:p-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl hover:opacity-90 transition-all ${
                        isLoading ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 md:w-6 md:h-6 border-t-2 border-white border-solid rounded-full animate-spin"></div>
                      ) : (
                        <Send className="h-5 w-5 md:h-6 md:w-6" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{language === "en" ? "Send message" : "Envoyer le message"}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </main>

          {(isNotePanelOpen || activeSection === "notes") && (
            <aside
              className={`${activeSection === "notes" ? "block" : "hidden"} md:block w-full md:w-80 bg-white rounded-xl p-3 md:p-4 shadow-lg space-y-4 max-h-[400px] md:max-h-none overflow-y-auto`}
            >
              <h2 className="text-lg font-semibold">{t("studyNotes")}</h2>

              <div className="mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("searchNotes")}
                  className="w-full p-3 border rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                />
              </div>

              <div className="space-y-3">
                <textarea
                  value={currentNote}
                  onChange={(e) => setCurrentNote(e.target.value)}
                  placeholder={t("takeNotes")}
                  className="w-full p-3 border rounded-lg h-32 resize-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                />
                <button
                  onClick={saveNote}
                  disabled={!currentSubject || !currentNote.trim()}
                  className="w-full flex items-center justify-center space-x-2 p-2 bg-purple-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-5 w-5" />
                  <span>{t("saveNote")}</span>
                </button>
              </div>

              <div className="space-y-4">
                {subjects.map((subject) => (
                  <div key={subject.name}>
                    {notes[subject.name]?.length > 0 &&
                      notes[subject.name].some((note) =>
                        note.content.toLowerCase().includes(searchQuery.toLowerCase()),
                      ) && (
                        <div>
                          <h3 className="font-medium text-gray-700 mb-2">{subject.name}</h3>
                          <div className="space-y-2">
                            {notes[subject.name]
                              .filter((note) => note.content.toLowerCase().includes(searchQuery.toLowerCase()))
                              .map((note) => (
                                <div key={note.id} className="bg-gray-50 p-3 rounded-lg relative group">
                                  <p className="text-sm">{note.content}</p>
                                  <span className="text-xs text-gray-500">
                                    {new Date(note.timestamp).toLocaleString()}
                                  </span>
                                  <button
                                    onClick={() => {
                                      const updatedNotes = {
                                        ...notes,
                                        [subject.name]: notes[subject.name].filter((n) => n.id !== note.id),
                                      }
                                      setNotes(updatedNotes)
                                    }}
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </button>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                  </div>
                ))}
              </div>
            </aside>
          )}
        </div>

        <footer className="text-center p-4 text-purple-600 font-medium">{t("madeWith")}</footer>
      </div>
    </TooltipProvider>
  )
}

export default TutorApp

