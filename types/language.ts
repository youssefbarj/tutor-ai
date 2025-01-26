export type Language = "en" | "fr"

export interface Translations {
  [key: string]: {
    en: string
    fr: string
  }
}

export const translations: Translations = {
  title: {
    en: "Youssef's Tutor",
    fr: "Tuteur de Youssef",
  },
  subtitle: {
    en: "Your 24/7 Learning Companion",
    fr: "Votre compagnon d'apprentissage 24/7",
  },
  notes: {
    en: "Notes",
    fr: "Notes",
  },
  subjects: {
    en: "Subjects",
    fr: "Matières",
  },
  chat: {
    en: "Chat",
    fr: "Discussion",
  },
  studySubjects: {
    en: "Study Subjects",
    fr: "Matières d'étude",
  },
  addNewSubject: {
    en: "Add new subject...",
    fr: "Ajouter une nouvelle matière...",
  },
  add: {
    en: "Add",
    fr: "Ajouter",
  },
  searchNotes: {
    en: "Search notes...",
    fr: "Rechercher des notes...",
  },
  takeNotes: {
    en: "Take notes during your session...",
    fr: "Prenez des notes pendant votre session...",
  },
  saveNote: {
    en: "Save Note",
    fr: "Enregistrer la note",
  },
  askAnything: {
    en: "Ask me anything! I'm here to help you learn.",
    fr: "Posez-moi n'importe quelle question ! Je suis là pour vous aider à apprendre.",
  },
  tryAsking: {
    en: "Try asking about homework, concepts, or practice problems",
    fr: "Essayez de poser des questions sur les devoirs, les concepts ou les exercices",
  },
  whatToLearn: {
    en: "What would you like to learn today?",
    fr: "Que voulez-vous apprendre aujourd'hui ?",
  },
  madeWith: {
    en: "Made with ❤️ by Youssef Barj",
    fr: "Fait avec ❤️ par Youssef Barj",
  },
  studyNotes: {
    en: "Study Notes",
    fr: "Notes d'étude",
  },
}

