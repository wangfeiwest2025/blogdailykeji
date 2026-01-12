
export const generatePostMetadata = async (content: string) => {
  // 模拟元数据生成，不再调用 AI
  const summary = content.slice(0, 100).replace(/[#*`]/g, '') + "...";
  return {
    summary: summary,
    tags: ["markdown", "blog", "local"]
  };
};
