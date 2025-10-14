// 5-color palette for user indicators and shapes
export const USER_COLORS = [
  '#3B82F6', // blue
  '#EF4444', // red
  '#10B981', // green
  '#F59E0B', // amber
  '#8B5CF6', // purple
] as const;

/**
 * Get a color for a user based on their position in the online users list
 * Colors cycle through the palette when more than 5 users are online
 * @param userIndex - The index of the user in the online users list (0-based)
 * @returns The color hex string
 */
export const getUserColor = (userIndex: number): string => {
  return USER_COLORS[userIndex % USER_COLORS.length];
};

/**
 * Assign colors to users in order of arrival
 * @param users - Array of user IDs in order of arrival
 * @returns Map of user ID to assigned color
 */
export const assignUserColors = (users: string[]): Map<string, string> => {
  const colorMap = new Map<string, string>();
  
  users.forEach((userId, index) => {
    colorMap.set(userId, getUserColor(index));
  });
  
  return colorMap;
};

/**
 * Get a random color from the palette
 * Useful for temporary assignments before user order is established
 * @returns Random color hex string from the palette
 */
export const getRandomColor = (): string => {
  const randomIndex = Math.floor(Math.random() * USER_COLORS.length);
  return USER_COLORS[randomIndex];
};

/**
 * Check if a color is from the user palette
 * @param color - Color hex string to check
 * @returns True if the color is in the palette
 */
export const isUserColor = (color: string): boolean => {
  return USER_COLORS.includes(color as typeof USER_COLORS[number]);
};

