import { WebSocTermsResponseSchema } from '@/types/websoc';

const ANTEATER_API_URL = 'https://anteaterapi.com/v2/rest';
const ANTEATER_WEBSOC_URL = ANTEATER_API_URL + '/websoc';

async function getWebSocTerms() {
  const response = await fetch(ANTEATER_WEBSOC_URL + '/terms');
  const result = await response.json();
  const parsed = WebSocTermsResponseSchema.parse(result);

  if (parsed.ok) return parsed.data;
  else throw new Error(parsed.message);
}

export { getWebSocTerms };
