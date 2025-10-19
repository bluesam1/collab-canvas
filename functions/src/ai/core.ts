/**
 * Core AI functionality - separated from Firebase for testability
 * This module can be tested directly without Firebase emulators
 */

import type { ProcessAICommandRequest, ProcessAICommandResponse, ToolCall } from '../types/ai';
import { getOpenAI, getModel } from './openai';
import { tools } from './tools';
import { formatColorForAI, hexToColorName } from '../utils/colorNames';
import * as logger from 'firebase-functions/logger';

/**
 * Build the system prompt for the AI
 * Extracted as a pure function for testability
 */
export function buildSystemPrompt(
  canvasState: ProcessAICommandRequest['canvasState'],
  viewportCenter: { x: number; y: number },
  selectedShapeIds?: string[],
  currentColor?: string,
  currentStrokeWidth?: number,
  viewportBounds?: { x: number; y: number; width: number; height: number },
  inViewportIds?: string[]
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
        return `${basicInfo} at (${(shape as any).centerX || shape.x}, ${(shape as any).centerY || shape.y}), radius: ${shape.radius}, color: ${colorDesc}`;
      } else if (shape.type === 'line') {
        const colorDesc = shape.stroke ? formatColorForAI(shape.stroke) : 'no color';
        return `${basicInfo} from (${shape.x1}, ${shape.y1}) to (${shape.x2}, ${shape.y2}), color: ${colorDesc}`;
      } else if (shape.type === 'text') {
        const colorDesc = shape.fill ? formatColorForAI(shape.fill) : 'no color';
        return `${basicInfo} at (${shape.x}, ${shape.y}), text: "${shape.text}", fontSize: ${shape.fontSize}, color: ${colorDesc}`;
      }
      return basicInfo;
    }).join('\n');
  }

  // Build selected shapes details for pronoun reference
  let selectedShapesDetails = '';
  if (selectedCount > 0) {
    const selectedShapes = canvasState.filter(shape => selectedShapeIds?.includes(shape.id));
    selectedShapesDetails = `\n\n**SELECTED SHAPES (${selectedCount})**:\n` + selectedShapes.map(shape => {
      const basicInfo = `- ${shape.id}: ${shape.type}`;
      if (shape.type === 'rectangle') {
        const colorDesc = shape.fill ? formatColorForAI(shape.fill) : 'no color';
        return `${basicInfo} at (${shape.x}, ${shape.y}), ${shape.width}x${shape.height}, color: ${colorDesc}`;
      } else if (shape.type === 'circle') {
        const colorDesc = shape.fill ? formatColorForAI(shape.fill) : 'no color';
        return `${basicInfo} at (${(shape as any).centerX || shape.x}, ${(shape as any).centerY || shape.y}), radius: ${shape.radius}, color: ${colorDesc}`;
      } else if (shape.type === 'line') {
        const colorDesc = shape.stroke ? formatColorForAI(shape.stroke) : 'no color';
        return `${basicInfo} from (${shape.x1}, ${shape.y1}) to (${shape.x2}, ${shape.y2}), color: ${colorDesc}`;
      } else if (shape.type === 'text') {
        const colorDesc = shape.fill ? formatColorForAI(shape.fill) : 'no color';
        return `${basicInfo} at (${shape.x}, ${shape.y}), text: "${shape.text}", fontSize: ${shape.fontSize}, color: ${colorDesc}`;
      }
      return basicInfo;
    }).join('\n');
  }

  return `You are an AI assistant for a collaborative canvas application. Users can create and manipulate shapes (rectangles, circles, lines, text) on a 5000x5000px canvas.

Current canvas state:
- Canvas dimensions: 5000x5000px
- Focal point (viewport center): ${viewportCenter.x}, ${viewportCenter.y}
- Visible area (viewport bounds): x=${Math.round(viewportBounds?.x || 0)}, y=${Math.round(viewportBounds?.y || 0)}, width=${Math.round(viewportBounds?.width || 5000)}, height=${Math.round(viewportBounds?.height || 5000)}
- Existing shapes: ${shapeCount}
- Selected shapes: ${selectedCount}
- Shapes in viewport: ${inViewportIds?.length || 0} (IDs: ${inViewportIds?.join(', ') || 'none'})
- Current color: ${currentColor || '#3b82f6'} (use this for fills/strokes when user doesn't specify)
- Current stroke width: ${currentStrokeWidth || 2} (use this for lines when user doesn't specify)${canvasStateDetails}${selectedShapesDetails}

You have access to 15 tools to manipulate the canvas:

CREATION TOOLS:
- createRectangle: Create rectangles with position, size, and color
- createCircle: Create circles with center position, radius, and color
- createLine: Create lines from start to end point
- createText: Create text labels with content, size, and color

MANIPULATION TOOLS:
- moveShapes: Move shapes to absolute or relative positions
- resizeShapes: Scale shapes by a factor (DO NOT use for text objects)
- rotateShapes: Rotate shapes by degrees
- changeColor: Change shape colors
- modifyText: Modify text properties (fontSize, content, color) - ALWAYS use this for text size changes
- deleteShapes: Remove shapes from canvas

LAYOUT TOOLS:
- arrangeInGrid: Arrange shapes in rows and columns
- alignShapes: Align shapes (left, right, center, top, bottom)
- distributeShapes: Distribute shapes evenly (horizontal or vertical)

CONTEXT TOOLS:
- getCanvasState: Get all shapes (use this if you need to see what's on canvas)
- selectShapes: Select specific shapes

PRONOUN REFERENCES (for operating on selected shapes):
When the user uses pronouns referring to selected shapes, interpret them as:
- "this" or "that" → singular selected shape (use it to modify/delete/move)
- "these" or "those" → plural selected shapes (use them for batch operations)
- "them" → plural selected shapes (use for batch operations)
- "it" → singular selected shape
- Example: "Delete this" → deleteShapes([currently_selected_shape_id])
- Example: "Make those bigger" → modifyText(selected_ids, fontSize=currentFontSize*1.5) for text, resizeShapes(selected_ids, scale_factor=1.5) for shapes
- Example: "Move them left" → moveShapes(selected_ids, x=-50, relative=true)
- Example: "Color them red" → changeColor(selected_ids, color='red')
- Example: "Rotate that 45 degrees" → rotateShapes([selected_id], degrees=45)

**IMPORTANT**: When user uses pronouns (this, that, these, them, etc.) and there are selected shapes:
1. Automatically use the selected shape IDs from the SELECTED SHAPES list above
2. Do NOT ask for clarification - just perform the operation on what's selected
3. Apply modification/deletion tools directly to the selected IDs

**CRITICAL FOR TEXT OBJECTS**: 
- When user says "make this bigger/smaller/twice as big" and "this" is a text object, ALWAYS use modifyText with fontSize
- NEVER use resizeShapes for text objects - it will scale the entire text incorrectly
- For text size changes: modifyText(shapeIds, fontSize=newSize)

Guidelines:
1. **CREATION DEFAULT: Always create near viewport center (${Math.round(viewportCenter.x)}, ${Math.round(viewportCenter.y)}) unless user specifies exact coordinates**
   - When user says "add a circle" or "create a rectangle" without coordinates, place it at viewport center
   - This ensures shapes appear where the user is looking
   - If user specifies coordinates like "at 100,200", use those specific coordinates
2. When user says "center" or "middle":
   - **For MOVING/POSITIONING shapes**: Calculate the CENTER of each shape:
     * Rectangle: center = (x + width/2, y + height/2)
     * Circle: center = (centerX, centerY) - already the center
     * Then move the shape's center to viewport center (${Math.round(viewportCenter.x)}, ${Math.round(viewportCenter.y)})
     * Use moveShapes with new x/y that places the shape's center at viewport center
   - **For CREATING new shapes**: Place center at viewport center (${Math.round(viewportCenter.x)}, ${Math.round(viewportCenter.y)})
3. **Directional positioning (left, right, top, bottom):**
   - ALWAYS use viewport center (${Math.round(viewportCenter.x)}, ${Math.round(viewportCenter.y)}) as the reference
   - "Move to center" or "move to middle" = viewport center (${Math.round(viewportCenter.x)}, ${Math.round(viewportCenter.y)})
   - "Move left" = subtract from x, keeping y near viewport.y
   - "Move right" = add to x, keeping y near viewport.y
   - "Move top" or "move up" = subtract from y, keeping x near viewport.x
   - "Move bottom" or "move down" = add to y, keeping x near viewport.x
   - Distance: move ~200-300px from viewport center for "left/right/top/bottom" positioning
4. **Color matching (CRITICAL for filtering and changing colors):**
   - Shapes have a 'colorName' field with CSS color names (e.g., "dodgerblue", "firebrick", "tomato", "lightseagreen")
   - Use your knowledge of which CSS colors belong to which color families:
     * Red family: "firebrick", "crimson", "tomato", "red", "darkred", "indianred"
     * Blue family: "blue", "dodgerblue", "royalblue", "steelblue", "skyblue"
     * Green family: "green", "limegreen", "mediumseagreen", "lightseagreen", "darkgreen"
     * Orange family: "orange", "darkorange", "chocolate" (NOT red)
     * Gray family: "gray", "silver", "lightslategray", "darkslategray" (NEVER matches other colors)
   - **DELETING BY COLOR EXAMPLES**:
     * "delete all red circles" → find ALL circles with colorName like "firebrick", "tomato", "crimson", then deleteShapes([all_matching_ids])
     * "delete the blue circle" → find ONE circle with colorName like "dodgerblue", "royalblue", "steelblue", then deleteShapes([id])
     * "delete all green shapes" → find ALL shapes with colorName like "limegreen", "mediumseagreen", then deleteShapes([all_matching_ids])
   - **CHANGING COLOR EXAMPLES**:
     * "change all circles to brown" → find ALL circles (regardless of current color), then changeColor([all_circle_ids], color='brown')
     * "change all red shapes to blue" → find ALL shapes with colorName like "firebrick", "tomato", "crimson", then changeColor([all_red_ids], color='blue')
     * "make the blue rectangles orange" → find ALL rectangles with colorName like "dodgerblue", "royalblue", then changeColor([all_blue_rect_ids], color='orange')
     * "color all text green" → find ALL text shapes, then changeColor([all_text_ids], color='green')
   - **NOTE**: These examples are a guide - users may use different wording (e.g., "turn all circles brown", "make every circle brown", "paint all circles brown"). Focus on the INTENT (change color of all matching shapes) rather than exact wording.
   - **CRITICAL**: When user says "change all [type]" or "make all [type] [color]", find ALL matching shapes of that type across the entire canvas
   - Always filter by color FIRST, then by type if specified
   - When creating shapes, colors should be hex codes (colorName is auto-generated)
5. Default sizes when user doesn't specify:
   - Rectangles: width and height between 150-300px (vary each dimension for visual interest)
   - Circles: radius 50-100px
   - Lines: length between 150-300px
   - Text: fontSize 16-24pt
6. **Size interpretation for different shape types:**
   - **Text objects**: When user talks about "size" of text, this refers to fontSize
     * "Make the text bigger" → modifyText(shapeIds, fontSize=currentFontSize*1.5)
     * "Make the text twice as big" → modifyText(shapeIds, fontSize=currentFontSize*2.0)
   - **Line objects**: When user talks about "size" of lines, this refers to line length
     * "Make the line longer" → increase width property
7. **Complex UI Components & Real-World Objects:**
   - When users request complex items (UI components, real objects, etc.), build them using available shapes (rectangles, circles, lines, text)
   - **Use typical/standard composition and colors that match the real-world item:**
     * Traffic light: gray/black vertical rectangle + red circle (top) + yellow circle (middle) + green circle (bottom)
     * Sun: large yellow/orange circle + yellow lines radiating outward
     * House: brown/tan rectangle (base) + red/brown triangle (roof) + blue rectangles (windows) + darker rectangle (door)
     * Tree: brown rectangle (trunk) + green circle or triangle (foliage)
     * Car: main body rectangle + smaller rectangles/circles for windows, wheels (black/gray circles)
     * Login form: light gray background + white input rectangles + blue button + black text labels
     * Dashboard: light background + white card rectangles + colorful accent shapes + text labels
     * Button: colored rectangle + centered text label (use complementary colors: blue button with white text, etc.)
     * Card/Panel: white or light gray rectangle + text elements + optional colored accent bar
   - **Composition guidelines:**
     * Create container/base shapes FIRST, then add details/content inside
     * Use appropriate padding (15-20px from edges)
     * Layer elements logically (background → structure → details → text)
     * Size elements proportionally (e.g., door should be smaller than house)
     * Ensure that elements that belong inside another element are positioned correctly and are not overlapping other elements
     * Make the generated result detailed but not overly complex
     * Make sure to use the different shapes available to create the complex items using the appropriate tools whenever it makes sense
   - **Color guidelines:**
     * Use colors that match real-world expectations (sky = blue, grass = green, fire = red/orange/yellow)
     * For UI: light gray (#D1D5DB) backgrounds, white (#FFFFFF) inputs, blue (#3B82F6) primary buttons, green (#10B981) success, red (#EF4444) danger
     * For objects: use natural/typical colors (tree = brown trunk + green leaves, not purple or neon)

8. **Creating multiple shapes efficiently:**
   - Use count parameter for multiple shapes: createRectangle(count=100) instead of 100 separate calls
   - **RANDOM COLORS**: When user explicitly requests random/varied/different colors, ALWAYS use the colors array parameter
     * **IMPORTANT**: Do NOT use the current color when user asks for "random", "different", "varied", "rainbow", or "colorful" shapes
     * Generate an array of truly random, distinct hex colors matching the count parameter - be creative and vary the colors each time
   - System automatically arranges in grid with 20px spacing

IMPORTANT - Operating on existing shapes:
- Use shape IDs from the canvas state above (${shapeCount} shapes listed)
- If ${selectedCount} shapes are already selected, use those selected IDs directly
- **PRIORITY**: Prefer shapes within the visible viewport when multiple shapes match
- Example: "distribute all circles horizontally" → selectShapes([circle_ids]) + distributeShapes([circle_ids], 'horizontal')

SPACING RULES:
- Use count parameter for multiple shapes - handles spacing automatically
- System arranges in grid with 20px spacing

**SHAPE TARGETING:**
Determine if targeting ONE shape or MULTIPLE shapes:

**SINGLE SHAPE TARGETING:**
- "rotate the rectangle" → target ONE rectangle
- "delete the blue shape" → target ONE blue shape

**MULTIPLE SHAPE TARGETING:**
- "delete all red shapes" → target ALL red shapes
- "rotate all rectangles" → target ALL rectangles

**FILTERING PRIORITY:**
1. Prefer shapes in the visible viewport
2. Only use off-screen shapes if no viewport shapes match

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
  currentStrokeWidth?: number,
  viewportBounds?: { x: number; y: number; width: number; height: number },
  inViewportIds?: string[]
): Promise<ProcessAICommandResponse> {
  // Add colorName field to shapes for better AI understanding
  const enrichedCanvasState = canvasState.map(shape => {
    const fill = (shape as any).fill;
    if (fill && typeof fill === 'string') {
      return {
        ...shape,
        colorName: hexToColorName(fill)
      };
    }
    return shape;
  });

  // Log what we receive
  logger.info('[getAIToolCalls] Input:', {
    commandLength: command.length,
    canvasStateLength: enrichedCanvasState?.length,
    shapeIds: enrichedCanvasState?.map(s => s.id),
    selectedShapeIds
  });

  const systemPrompt = buildSystemPrompt(
    enrichedCanvasState,
    viewportCenter,
    selectedShapeIds,
    currentColor,
    currentStrokeWidth,
    viewportBounds,
    inViewportIds
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

  // Log the system prompt for debugging
  logger.info("System prompt being sent to AI", {
    promptLength: systemPrompt.length,
    command,
    shapeCount: enrichedCanvasState.length,
    selectedCount: selectedShapeIds?.length || 0,
    model: getModel(),
    // Log a sample of the formatted colors to see what AI is receiving
    sampleColors: enrichedCanvasState.slice(0, 3).map(shape => ({
      id: shape.id,
      type: shape.type,
      colorName: (shape as any).colorName,
      fill: (shape as any).fill
    }))
  });

    // Call OpenAI API with 30-second timeout (reasonable for complex requests)
    const completionPromise = openai.chat.completions.create({
      model: getModel(),
      messages,
      tools,
      tool_choice: 'auto',
      temperature: 0.7,
      max_tokens: 4095,
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Request timed out (30 seconds). Please try again or update your prompt.'));
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

    // Log the AI response for debugging
    logger.info("AI response received", {
      hasToolCalls: !!response.tool_calls,
      toolCallCount: response.tool_calls?.length || 0,
      hasContent: !!response.content,
      content: response.content?.substring(0, 200) || 'No content'
    });

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
    logger.error('OpenAI API error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

