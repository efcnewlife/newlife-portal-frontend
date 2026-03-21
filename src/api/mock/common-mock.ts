export const withMockDelay = async (ms: number = 80): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, ms));
};
