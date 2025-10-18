export interface ExampleCommand {
  text: string;
  description?: string;
}

export const EXAMPLE_COMMANDS: Record<string, ExampleCommand[]> = {
  'Create Shapes': [
    { text: 'Create a red rectangle at 100,200' },
    { text: 'Add a blue circle with radius 50' },
    { text: 'Draw a line from top-left to bottom-right' },
    { text: "Add text that says 'Welcome'" },
    { text: 'Create 10 random colored circles' },
  ],
  'Move & Edit': [
    { text: 'Move the red rectangle to the center' },
    { text: 'Make the blue circle twice as large' },
    { text: 'Rotate the rectangle 45 degrees' },
    { text: 'Change all circles to green' },
    { text: 'Delete all red shapes' },
  ],
  'Arrange & Align': [
    { text: 'Arrange shapes in a 3x3 grid' },
    { text: 'Align all rectangles to the left' },
    { text: 'Distribute circles evenly horizontally' },
    { text: 'Space out the selected shapes' },
  ],
  'Build Layouts': [
    { text: 'Create a login form' },
    { text: 'Build a navigation bar with 4 menu items' },
    { text: 'Make a contact form' },
    { text: 'Create a dashboard with 6 cards' },
  ],
};

// Flattened list of all examples (for carousel, random selection, etc.)
export const ALL_EXAMPLES: string[] = Object.values(EXAMPLE_COMMANDS)
  .flat()
  .map(cmd => cmd.text);

