import Airtable from "airtable";
import { getSecret } from "astro:env/server";

Airtable.configure({
  apiKey: getSecret("AIRTABLE_API_KEY"),
});

const base = Airtable.base(getSecret("AIRTABLE_BASE_ID")!);

export default base;
