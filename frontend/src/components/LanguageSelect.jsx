import { useI18n } from '../i18n/I18nContext'

export default function LanguageSelect({ className = '' }) {
  const { lang, setLang, t } = useI18n()

  return (
    <label className={`lang-select ${className}`.trim()}>
      <span className="lang-select-label">{t('language')}</span>
      <select
        value={lang}
        aria-label={t('language')}
        onChange={(e) => setLang(e.target.value)}
      >
        <option value="en">{t('english')}</option>
        <option value="fr">{t('french')}</option>
      </select>
    </label>
  )
}
