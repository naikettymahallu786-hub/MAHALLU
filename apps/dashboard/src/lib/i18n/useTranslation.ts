import { useUIStore } from '@/store/ui.store';
import en from './en.json';
import ml from './ml.json';

const dictionaries: Record<string, any> = { en, ml };

export function useTranslation() {
  const { language } = useUIStore();

  const t = (key: string, variables?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value = dictionaries[language];

    for (const k of keys) {
      if (value === undefined || value === null) break;
      value = value[k];
    }

    // Fallback to English if key is missing in Malayalam
    if (value === undefined || value === null) {
      let fallbackValue = dictionaries['en'];
      for (const k of keys) {
        if (fallbackValue === undefined || fallbackValue === null) break;
        fallbackValue = fallbackValue[k];
      }
      value = fallbackValue;
    }

    if (typeof value !== 'string') {
      return key; // Return the key itself if translation is completely missing
    }

    if (variables) {
      return Object.entries(variables).reduce
        ((str, [k, v]) => str.replace(new RegExp(`{{${k}}}`, 'g'), String(v)), value);
    }

    return value;
  };

  return { t, language };
}
