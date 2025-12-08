import { getBrandNameSuggestions } from "./brandSuggestions.ts";

(async () => {
  const result = await getBrandNameSuggestions("nik");
  console.log("Brand suggestions for 'nik':", result);
})();
