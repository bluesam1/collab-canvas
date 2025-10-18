/**
 * AI Tool Definitions for OpenAI Function Calling
 * Defines all 14 tools that the AI can use to manipulate the canvas
 */

import type {ChatCompletionTool} from "openai/resources/chat/completions";

/**
 * All 14 canvas manipulation tools
 * These are presented to OpenAI as available function calls
 */
export const tools: ChatCompletionTool[] = [
  // ===== CREATION TOOLS =====
  {
    type: "function",
    function: {
      name: "createRectangle",
      description:
        "Creates one or more rectangles on the canvas. Use count parameter for multiple shapes.",
      parameters: {
        type: "object",
        properties: {
          x: {
            type: "number",
            description: "X coordinate of top-left corner (or grid center if count > 1)",
          },
          y: {
            type: "number",
            description: "Y coordinate of top-left corner (or grid center if count > 1)",
          },
          width: {
            type: "number",
            description: "Width of rectangle (10-2000 pixels)",
          },
          height: {
            type: "number",
            description: "Height of rectangle (10-2000 pixels)",
          },
          color: {
            type: "string",
            description: "Fill color for all shapes (hex code like #FF0000 or CSS name). Ignored if colors array is provided.",
          },
          colors: {
            type: "array",
            items: { type: "string" },
            description: "Array of colors for multi-color batches (e.g., ['red', 'blue', 'green']). Use for 'random colored' requests. Length should match count.",
          },
          count: {
            type: "number",
            description: "Number of rectangles to create (default: 1). Will arrange in a grid.",
          },
          spacing: {
            type: "number",
            description: "Gap between shapes in pixels (default: 20)",
          },
        },
        required: ["x", "y", "width", "height", "color"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "createCircle",
      description: "Creates one or more circles on the canvas. Use count parameter for multiple shapes.",
      parameters: {
        type: "object",
        properties: {
          x: {
            type: "number",
            description: "X coordinate of center (or grid center if count > 1)",
          },
          y: {
            type: "number",
            description: "Y coordinate of center (or grid center if count > 1)",
          },
          radius: {
            type: "number",
            description: "Radius in pixels (5-1000)",
          },
          color: {
            type: "string",
            description: "Fill color for all shapes (hex code or CSS name). Ignored if colors array is provided.",
          },
          colors: {
            type: "array",
            items: { type: "string" },
            description: "Array of colors for multi-color batches (e.g., ['red', 'blue', 'green']). Use for 'random colored' requests. Length should match count.",
          },
          count: {
            type: "number",
            description: "Number of circles to create (default: 1). Will arrange in a grid.",
          },
          spacing: {
            type: "number",
            description: "Gap between shapes in pixels (default: 20)",
          },
        },
        required: ["x", "y", "radius", "color"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "createLine",
      description: "Creates a line from start point to end point",
      parameters: {
        type: "object",
        properties: {
          x1: {
            type: "number",
            description: "X coordinate of start point",
          },
          y1: {
            type: "number",
            description: "Y coordinate of start point",
          },
          x2: {
            type: "number",
            description: "X coordinate of end point",
          },
          y2: {
            type: "number",
            description: "Y coordinate of end point",
          },
          color: {
            type: "string",
            description: "Stroke color (hex code or CSS name)",
          },
          strokeWidth: {
            type: "number",
            description: "Line thickness in pixels (1-50)",
          },
        },
        required: ["x1", "y1", "x2", "y2", "color", "strokeWidth"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "createText",
      description: "Creates a text label on the canvas",
      parameters: {
        type: "object",
        properties: {
          x: {
            type: "number",
            description: "X coordinate of text position",
          },
          y: {
            type: "number",
            description: "Y coordinate of text position",
          },
          text: {
            type: "string",
            description: "The text content to display",
          },
          fontSize: {
            type: "number",
            description: "Font size in pixels (8-200)",
          },
          color: {
            type: "string",
            description: "Text color (hex code or CSS name)",
          },
        },
        required: ["x", "y", "text", "fontSize", "color"],
      },
    },
  },

  // ===== MANIPULATION TOOLS =====
  {
    type: "function",
    function: {
      name: "moveShapes",
      description: "Moves shapes to a new position (absolute or relative)",
      parameters: {
        type: "object",
        properties: {
          shapeIds: {
            type: "array",
            items: {type: "string"},
            description: "Array of shape IDs to move",
          },
          x: {
            type: "number",
            description: "X position or offset",
          },
          y: {
            type: "number",
            description: "Y position or offset",
          },
          relative: {
            type: "boolean",
            description:
              "If true, x/y are offsets. If false, x/y are absolute positions",
          },
        },
        required: ["shapeIds", "x", "y", "relative"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "resizeShapes",
      description: "Resizes shapes by a scale factor",
      parameters: {
        type: "object",
        properties: {
          shapeIds: {
            type: "array",
            items: {type: "string"},
            description: "Array of shape IDs to resize",
          },
          scaleFactor: {
            type: "number",
            description: "Scale factor (e.g., 2.0 = double size, 0.5 = half)",
          },
        },
        required: ["shapeIds", "scaleFactor"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "rotateShapes",
      description: "Rotates shapes by specified degrees",
      parameters: {
        type: "object",
        properties: {
          shapeIds: {
            type: "array",
            items: {type: "string"},
            description: "Array of shape IDs to rotate",
          },
          degrees: {
            type: "number",
            description: "Rotation angle in degrees (0-360)",
          },
        },
        required: ["shapeIds", "degrees"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "changeColor",
      description: "Changes the color of shapes",
      parameters: {
        type: "object",
        properties: {
          shapeIds: {
            type: "array",
            items: {type: "string"},
            description: "Array of shape IDs to recolor",
          },
          color: {
            type: "string",
            description: "New color (hex code or CSS name)",
          },
        },
        required: ["shapeIds", "color"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "deleteShapes",
      description: "Deletes shapes from the canvas",
      parameters: {
        type: "object",
        properties: {
          shapeIds: {
            type: "array",
            items: {type: "string"},
            description: "Array of shape IDs to delete",
          },
        },
        required: ["shapeIds"],
      },
    },
  },

  // ===== LAYOUT TOOLS =====
  {
    type: "function",
    function: {
      name: "arrangeInGrid",
      description: "Arranges shapes in a grid pattern",
      parameters: {
        type: "object",
        properties: {
          shapeIds: {
            type: "array",
            items: {type: "string"},
            description: "Array of shape IDs to arrange. Empty = all shapes",
          },
          rows: {
            type: "number",
            description: "Number of rows in grid",
          },
          cols: {
            type: "number",
            description: "Number of columns in grid",
          },
          spacingX: {
            type: "number",
            description: "Horizontal spacing between shapes in pixels",
          },
          spacingY: {
            type: "number",
            description: "Vertical spacing between shapes in pixels",
          },
        },
        required: ["shapeIds", "rows", "cols", "spacingX", "spacingY"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "alignShapes",
      description: "Aligns multiple shapes",
      parameters: {
        type: "object",
        properties: {
          shapeIds: {
            type: "array",
            items: {type: "string"},
            description: "Array of shape IDs to align",
          },
          alignment: {
            type: "string",
            enum: ["left", "right", "center", "top", "bottom"],
            description: "Alignment direction",
          },
        },
        required: ["shapeIds", "alignment"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "distributeShapes",
      description: "Distributes shapes evenly",
      parameters: {
        type: "object",
        properties: {
          shapeIds: {
            type: "array",
            items: {type: "string"},
            description: "Array of shape IDs to distribute",
          },
          direction: {
            type: "string",
            enum: ["horizontal", "vertical"],
            description: "Distribution direction",
          },
        },
        required: ["shapeIds", "direction"],
      },
    },
  },

  // ===== CONTEXT & QUERY TOOLS =====
  {
    type: "function",
    function: {
      name: "getCanvasState",
      description:
        "Returns current state of all shapes on canvas. " +
        "Use this to understand what's on the canvas before making changes.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "selectShapes",
      description: "Programmatically selects shapes",
      parameters: {
        type: "object",
        properties: {
          shapeIds: {
            type: "array",
            items: {type: "string"},
            description: "Array of shape IDs to select",
          },
        },
        required: ["shapeIds"],
      },
    },
  },
];

