export interface ExampleCommand {
  text: string;
  description?: string;
}

export const EXAMPLE_COMMANDS: Record<string, ExampleCommand[]> = {
  'Create Shapes': [
    { text: 'Create a red rectangle at 100,200' },
    { text: 'Add a blue circle with radius 50' },
    { text: "Add text that says 'Welcome'" },
    { text: 'Create 10 random colored circles' },
  ],
  'Move & Edit': [
    { text: 'Make the blue circle twice as large' },
    { text: 'Rotate the rectangle 45 degrees' },
    { text: 'Change all circles to green' },
    { text: 'Delete all red shapes' },
    { text: 'Make this bigger' },
    { text: 'Delete them' },
    { text: 'Change these to red' },
  ],
  'Arrange & Align': [
    { text: 'Align all rectangles to the left' },
    { text: 'Distribute circles evenly horizontally' },
    { text: 'Align all shapes to the center' },
  ],
  'Build Layouts': [
    { text: 'Create a login form' },
    { text: 'Build a navigation bar with 4 menu items' },
    { text: 'Make a contact form' },
    { text: 'Create a snowman' },
    { text: 'Create a sun with sun beams' },
  ],
};

// Flattened list of all examples (for carousel, random selection, etc.)
export const ALL_EXAMPLES: string[] = Object.values(EXAMPLE_COMMANDS)
  .flat()
  .map(cmd => cmd.text);

