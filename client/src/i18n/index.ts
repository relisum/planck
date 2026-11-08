import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import en from "./locales/en.json"
import ru from "./locales/ru.json"
import { getStoredLanguage } from "@/shared/lib/language"

function getInitialLanguage() {
  return getStoredLanguage() ?? (navigator.language.startsWith('ru') ? 'ru' : 'en')
}

i18n.on('languageChanged', lng => {
  document.documentElement.lang = lng
})

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ru: { translation: ru },
    },
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  })

export default i18n