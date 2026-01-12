
// File removed to simplify architecture
export const generatePostMetadata = async (content: string) => {
  return { summary: content.slice(0, 100), tags: ["General"] };
};
