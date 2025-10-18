/**
 * Core AI functionality - separated from Firebase for testability
 * This module can be tested directly without Firebase emulators
 */

import type { ProcessAICommandRequest, ProcessAICommandResponse, ToolCall } from '../types/ai';
import { getOpenAI, getModel } from './openai';
import { tools } from './tools';
import { formatColorForAI } from '../utils/colorNames';

/**
 * Build the system prompt for the AI
 * Extracted as a pure function for testability
 */
export function buildSystemPrompt(
  canvasState: ProcessAICommandRequest['canvasState'],
  viewportCenter: { x: number; y: number },
  selectedShapeIds?: string[],
  currentColor?: string,
  currentStrokeWidth?: number
): string {
  const shapeCount = canvasState.length;
  const selectedCount = selectedShapeIds?.length || 0;

  // Build canvas state details for AI to see
  let canvasStateDetails = '';
  if (shapeCount > 0) {
    canvasStateDetails = '\n\nShapes on canvas:\n' + canvasState.map(shape => {
      const basicInfo = `- ${shape.id}: ${shape.type}`;
      if (shape.type === 'rectangle') {
        const colorDesc = shape.fill ? formatColorForAI(shape.fill) : 'no color';
        return `${basicInfo} at (${shape.x}, ${shape.y}), ${shape.width}x${shape.height}, color: ${colorDesc}`;
      } else if (shape.type === 'circle') {
        const colorDesc = shape.fill ? formatColorForAI(shape.fill) : 'no color';
        return `${basicInfo} at (${shape.x}, ${shape.y}), radius: ${shape.radius}, color: ${colorDesc}`;
      } else if (shape.type === 'line') {
        const colorDesc = shape.stroke ? formatColorForAI(shape.stroke) : 'no color';
        return `${basicInfo} from (${shape.x1}, ${shape.y1}) to (${shape.x2}, ${shape.y2}), color: ${colorDesc}`;
      } else if (shape.type === 'text') {
        const colorDesc = shape.fill ? formatColorForAI(shape.fill) : 'no color';
        return `${basicInfo} at (${shape.x}, ${shape.y}), text: "${shape.text}", color: ${colorDesc}`;
      }
      return basicInfo;
    }).join('\n');
  }

  return `You are an AI assistant for a collaborative canvas application. Users can create and manipulate shapes (rectangles, circles, lines, text) on a 5000x5000px canvas.

Current canvas state:
- Canvas dimensions: 5000x5000px
- Focal point (viewport center): ${viewportCenter.x}, ${viewportCenter.y}
- Existing shapes: ${shapeCount}
- Selected shapes: ${selectedCount}
- Current color: ${currentColor || '#3b82f6'} (use this for fills/strokes when user doesn't specify)
- Current stroke width: ${currentStrokeWidth || 2} (use this for lines when user doesn't specify)${canvasStateDetails}

You have access to 14 tools to manipulate the canvas:

CREATION TOOLS:
- createRectangle: Create rectangles with position, size, and color
- createCircle: Create circles with center position, radius, and color
- createLine: Create lines from start to end point
- createText: Create text labels with content, size, and color

MANIPULATION TOOLS:
- moveShapes: Move shapes to absolute or relative positions
- resizeShapes: Scale shapes by a factor
- rotateShapes: Rotate shapes by degrees
- changeColor: Change shape colors
- deleteShapes: Remove shapes from canvas

LAYOUT TOOLS:
- arrangeInGrid: Arrange shapes in rows and columns
- alignShapes: Align shapes (left, right, center, top, bottom)
- distributeShapes: Distribute shapes evenly (horizontal or vertical)

CONTEXT TOOLS:
- getCanvasState: Get all shapes (use this if you need to see what's on canvas)
- selectShapes: Select specific shapes

Guidelines:
1. When user doesn't specify coordinates, position near viewport center (${Math.round(viewportCenter.x)}, ${Math.round(viewportCenter.y)}) - this is the visible area they're looking at
2. When user says "center" or "middle", use viewport center (${Math.round(viewportCenter.x)}, ${Math.round(viewportCenter.y)})
3. **Color matching:**
   - Shapes are listed with color names AND hex codes (e.g., "color: blue (#3b82f6)")
   - When user says "delete the blue rectangle", look for shapes with "blue" in their color description
   - The color name is the most important part for matching user requests
   - When creating shapes, colors can be hex codes (#FF0000) or CSS names (red, blue, etc.)
4. Default sizes when user doesn't specify:
   - Rectangles: width and height between 150-300px (vary each dimension for visual interest)
   - Circles: radius 50-100px
   - Lines: length between 150-300px
   - Text: fontSize 16-24pt
   - Line strokeWidth: use current stroke width (${currentStrokeWidth || 2}px)
5. **Complex UI Components (dashboard, menu, forms):**
   - Create container boxes FIRST, then place content inside with padding
   - Standard padding: 15-20px from container edges
   - Group related elements together (text inside its container)
   - **IMPORTANT**: For components with individual labels/titles (dashboard cards, menu items), create each element+text pair SEPARATELY (don't use count parameter)
   
   Examples:
   * **Dashboard**: Create each card rectangle individually (200x150), then place its title text 20px from card's top edge, centered within that card
     - Card 1 at (x1, y1) → Title 1 at (x1 + 100, y1 + 20) centered
     - Card 2 at (x1 + 220, y1) → Title 2 at (x1 + 320, y1 + 20) centered
     - Each card+title is a pair with relative positioning
   * **Navigation Bar**: Create horizontal bar (800x60), place each menu text item inside with 20px left padding and even spacing
   * **Contact Form**: Create form box (300x400), place each label text and its input rectangle inside with 15px vertical gaps
   * **Login Form**: Create container (300x250), title at top with 20px padding, username/password fields stacked with 15px gaps
   
   Structure pattern:
   1. Calculate container size based on content
   2. For grouped components (dashboard, menu): Create each container+text pair separately with relative positioning
   3. Place text elements inside at (container.x + padding, container.y + padding)
   4. Stack elements vertically with consistent gaps (15-20px)
   5. Keep text readable (16-20pt for body, 24-28pt for titles)

6. **Creating multiple shapes efficiently:**
   - For "create 100 rectangles": Call createRectangle ONCE with count=100, x=viewport.x, y=viewport.y
   - For "create 50 circles": Call createCircle ONCE with count=50, x=viewport.x, y=viewport.y
   - For "create 10 random colored circles": Use colors array like colors=["red","blue","green","yellow","purple","orange","pink","cyan","magenta","lime"]
   - For "rainbow rectangles": Provide colors array with rainbow colors
   - The system will automatically arrange them in a grid centered at (x, y)
   - Default spacing is 20px between shapes
   - This is MUCH more efficient than making 100 separate function calls!
7. When creating multiple similar items, vary sizes and colors slightly for visual interest

IMPORTANT - Operating on existing shapes:
- The canvas state is ALREADY PROVIDED ABOVE (${shapeCount} shapes listed)
- You can see all shape IDs, types, and positions in the canvas state
- If user asks to manipulate shapes (distribute, align, arrange, move, etc.):
  * Look at the canvas state provided above
  * Filter for the shape types mentioned (e.g., "all circles" → find shapes with type='circle')
  * Extract their IDs
  * Call selectShapes(ids) to select them
  * Then call the manipulation tool (distributeShapes, alignShapes, etc.)
  * ALL IN ONE RESPONSE - don't call getCanvasState first!
- If ${selectedCount} shapes are already selected, use those selected IDs directly
- Example: "distribute all circles horizontally" → selectShapes(['circle1', 'circle2']) + distributeShapes(['circle1', 'circle2'], 'horizontal')
- Example: "align rectangles to the left" → selectShapes(['rect1', 'rect2']) + alignShapes(['rect1', 'rect2'], 'left')
- Only use getCanvasState() if you need to refresh the canvas (rarely needed)

SPACING RULES:
- **Use the count parameter** for creating multiple shapes - it handles spacing automatically!
  * "create 3 circles" → createCircle with count=3, color="blue" (all same color)
  * "create 10 random colored circles" → createCircle with count=10, colors=["red","blue","green",...] (different colors)
  * "create 100 rectangles" → createRectangle with count=100 (one call!)
  * The system arranges them in a grid with proper 20px spacing
  * If colors array is provided, each shape gets a different color (cycles through array if count > colors.length)
- For small batches (2-4 shapes) without count parameter:
  * Arrange horizontally or vertically with 20px gaps
  * Calculate positions to prevent overlap
  * Example: 3 circles with radius 50 → centers 120px apart (diameter + 20px gap)

Remember: Be creative but practical. Users want functional, well-arranged layouts!`;
}

/**
 * Call OpenAI API to get tool calls for a command
 * This is the core AI logic separated from Firebase
 */
export async function getAIToolCalls(
  command: string,
  canvasState: ProcessAICommandRequest['canvasState'],
  viewportCenter: { x: number; y: number },
  selectedShapeIds?: string[],
  currentColor?: string,
  currentStrokeWidth?: number
): Promise<ProcessAICommandResponse> {
  const systemPrompt = buildSystemPrompt(
    canvasState,
    viewportCenter,
    selectedShapeIds,
    currentColor,
    currentStrokeWidth
  );

  const messages = [
    {
      role: 'system' as const,
      content: systemPrompt,
    },
    {
      role: 'user' as const,
      content: command,
    },
  ];

  try {
    // Get OpenAI client
    const openai = getOpenAI();

    // Call OpenAI API with 30-second timeout (reasonable for complex requests)
    const completionPromise = openai.chat.completions.create({
      model: getModel(),
      messages,
      tools,
      tool_choice: 'auto',
      temperature: 0.7,
      max_tokens: 16000,
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('OpenAI request timed out (30 seconds)'));
      }, 30000);
    });

    const completion = await Promise.race([
      completionPromise,
      timeoutPromise,
    ]);

    const response = completion.choices[0]?.message;

    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Extract tool calls
    const toolCalls: ToolCall[] = response.tool_calls?.map((tc) => {
      if (tc.type === 'function') {
        return {
          id: tc.id,
          type: 'function' as const,
          function: {
            name: tc.function.name,
            arguments: tc.function.arguments,
          },
        };
      }
      return {
        id: tc.id,
        type: 'function' as const,
        function: {
          name: 'unknown',
          arguments: '{}',
        },
      };
    }) || [];

    return {
      success: true,
      toolCalls,
      summary: `Generated ${toolCalls.length} tool call(s)`,
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

