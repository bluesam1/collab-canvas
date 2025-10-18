/**
 * AI Core Integration Tests
 * Tests AI tool selection directly without Firebase emulators
 * Uses OpenAI API key from .env.local
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { getAIToolCalls } from './core';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local (in functions directory)
// Using process.cwd() since __dirname may not work in ESM/vitest
const envPath = path.join(process.cwd(), '.env.local');
console.log('Loading .env.local from:', envPath);
const envResult = dotenv.config({ path: envPath });
if (envResult.error) {
  console.error('Error loading .env.local:', envResult.error);
} else {
  console.log('Successfully loaded .env.local');
}

// Helper to extract tool names from response
function getToolNames(toolCalls: any[]): string[] {
  return toolCalls.map(tc => tc.function.name);
}

// Helper to parse tool arguments
function parseToolArgs(toolCalls: any[], toolName: string): any {
  const toolCall = toolCalls.find(tc => tc.function.name === toolName);
  return toolCall ? JSON.parse(toolCall.function.arguments) : null;
}

// Mock canvas state with shapes for manipulation tests
const mockCanvasState = [
  { id: 'rect1', type: 'rectangle' as const, x: 100, y: 100, width: 100, height: 50, fill: '#ff0000' },
  { id: 'rect2', type: 'rectangle' as const, x: 300, y: 100, width: 100, height: 50, fill: '#00ff00' },
  { id: 'circle1', type: 'circle' as const, x: 500, y: 150, radius: 50, fill: '#0000ff' },
  { id: 'circle2', type: 'circle' as const, x: 700, y: 150, radius: 50, fill: '#ffff00' },
  { id: 'line1', type: 'line' as const, x: 100, y: 300, x1: 100, y1: 300, x2: 200, y2: 400, stroke: '#000000', strokeWidth: 2 },
];

describe('AI Tool Selection Tests (Direct OpenAI)', () => {
  beforeAll(() => {
    console.log('\n🔍 Checking OpenAI API key...');
    console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
    if (process.env.OPENAI_API_KEY) {
      console.log('OPENAI_API_KEY length:', process.env.OPENAI_API_KEY.length);
      console.log('OPENAI_API_KEY starts with:', process.env.OPENAI_API_KEY.substring(0, 7));
    }
    
    if (!process.env.OPENAI_API_KEY) {
      console.error('\n❌ OPENAI_API_KEY not found!');
      console.error('Current working directory:', process.cwd());
      console.error('Looking for .env.local at:', path.join(process.cwd(), '.env.local'));
      throw new Error('OPENAI_API_KEY not found in .env.local');
    }
    console.log('✅ OpenAI API key loaded successfully\n');
  });

  describe('Creation Commands', () => {
    it('should use createRectangle for "create a rectangle"', async () => {
      const response = await getAIToolCalls(
        'create a rectangle',
        [],
        { x: 2500, y: 2500 },
        [],
        '#3b82f6',
        2
      );

      expect(response.success).toBe(true);
      expect(response.toolCalls).toBeDefined();
      const tools = getToolNames(response.toolCalls!);
      expect(tools).toContain('createRectangle');
    }, 15000); // 15s timeout for OpenAI API

    it('should use createCircle for "create a circle"', async () => {
      const response = await getAIToolCalls(
        'create a circle',
        [],
        { x: 2500, y: 2500 }
      );

      expect(response.success).toBe(true);
      const tools = getToolNames(response.toolCalls!);
      expect(tools).toContain('createCircle');
    }, 15000);

    it('should use createLine for "create a line"', async () => {
      const response = await getAIToolCalls(
        'create a line',
        [],
        { x: 2500, y: 2500 }
      );

      expect(response.success).toBe(true);
      const tools = getToolNames(response.toolCalls!);
      expect(tools).toContain('createLine');
    }, 15000);

    it('should use createText for "create text that says Hello"', async () => {
      const response = await getAIToolCalls(
        'create text that says Hello',
        [],
        { x: 2500, y: 2500 }
      );

      expect(response.success).toBe(true);
      const tools = getToolNames(response.toolCalls!);
      expect(tools).toContain('createText');
    }, 15000);
  });

  describe('Batched Creation Commands', () => {
    it('should use createRectangle with count=10 for "create 10 rectangles"', async () => {
      const response = await getAIToolCalls(
        'create 10 rectangles',
        [],
        { x: 2500, y: 2500 }
      );

      expect(response.success).toBe(true);
      const tools = getToolNames(response.toolCalls!);
      const args = parseToolArgs(response.toolCalls!, 'createRectangle');

      expect(tools).toContain('createRectangle');
      expect(args.count).toBe(10);
    }, 15000);

    it('should use createCircle with count=100 for "create 100 circles"', async () => {
      const response = await getAIToolCalls(
        'create 100 circles',
        [],
        { x: 2500, y: 2500 }
      );

      expect(response.success).toBe(true);
      const tools = getToolNames(response.toolCalls!);
      const args = parseToolArgs(response.toolCalls!, 'createCircle');

      expect(tools).toContain('createCircle');
      expect(args.count).toBe(100);
    }, 15000);

    it('should use colors array for "create 10 random colored circles"', async () => {
      const response = await getAIToolCalls(
        'create 10 random colored circles',
        [],
        { x: 2500, y: 2500 }
      );

      expect(response.success).toBe(true);
      const tools = getToolNames(response.toolCalls!);
      const args = parseToolArgs(response.toolCalls!, 'createCircle');

      expect(tools).toContain('createCircle');
      expect(args.count).toBe(10);
      expect(args.colors).toBeDefined();
      expect(Array.isArray(args.colors)).toBe(true);
      expect(args.colors.length).toBeGreaterThan(1);
    }, 15000);

    it('should use colors array for "create 7 rainbow rectangles"', async () => {
      const response = await getAIToolCalls(
        'create 7 rainbow rectangles',
        [],
        { x: 2500, y: 2500 }
      );

      expect(response.success).toBe(true);
      const tools = getToolNames(response.toolCalls!);
      const args = parseToolArgs(response.toolCalls!, 'createRectangle');

      expect(tools).toContain('createRectangle');
      expect(args.count).toBe(7);
      expect(args.colors).toBeDefined();
      expect(Array.isArray(args.colors)).toBe(true);
    }, 15000);
  });

  describe('Layout Commands', () => {
    it('should use arrangeInGrid for "arrange in a grid"', async () => {
      const response = await getAIToolCalls(
        'arrange all shapes in a 3x3 grid',
        mockCanvasState,
        { x: 2500, y: 2500 }
      );

      expect(response.success).toBe(true);
      const tools = getToolNames(response.toolCalls!);
      expect(tools).toContain('arrangeInGrid');
    }, 15000);

    it('should use alignShapes for "align left"', async () => {
      const response = await getAIToolCalls(
        'align all shapes to the left',
        mockCanvasState,
        { x: 2500, y: 2500 }
      );

      expect(response.success).toBe(true);
      const tools = getToolNames(response.toolCalls!);
      expect(tools).toContain('alignShapes');
    }, 15000);

    it('should use distributeShapes for "distribute horizontally"', async () => {
      const response = await getAIToolCalls(
        'distribute all shapes horizontally',
        mockCanvasState,
        { x: 2500, y: 2500 }
      );

      expect(response.success).toBe(true);
      const tools = getToolNames(response.toolCalls!);
      expect(tools).toContain('distributeShapes');
    }, 15000);
  });

  describe('Manipulation Commands', () => {
    it('should use moveShapes for "move to center"', async () => {
      const response = await getAIToolCalls(
        'move all shapes to the center',
        mockCanvasState,
        { x: 2500, y: 2500 }
      );

      expect(response.success).toBe(true);
      const tools = getToolNames(response.toolCalls!);
      expect(tools).toContain('moveShapes');
    }, 15000);

    it('should use resizeShapes for "make them bigger"', async () => {
      const response = await getAIToolCalls(
        'make all shapes twice as big',
        mockCanvasState,
        { x: 2500, y: 2500 }
      );

      expect(response.success).toBe(true);
      const tools = getToolNames(response.toolCalls!);
      expect(tools).toContain('resizeShapes');
    }, 15000);

    it('should use rotateShapes for "rotate 45 degrees"', async () => {
      const response = await getAIToolCalls(
        'rotate every shape on the canvas 45 degrees',
        mockCanvasState,
        { x: 2500, y: 2500 }
      );

      expect(response.success).toBe(true);
      const tools = getToolNames(response.toolCalls!);
      expect(tools).toContain('selectShapes');
      expect(tools).toContain('rotateShapes');
      
      // Verify correct args
      const rotateArgs = parseToolArgs(response.toolCalls!, 'rotateShapes');
      expect(rotateArgs.degrees).toBe(45);
    }, 15000);

    it('should use changeColor for "change color to red"', async () => {
      const response = await getAIToolCalls(
        'change the color of all shapes to red',
        mockCanvasState,
        { x: 2500, y: 2500 }
      );

      expect(response.success).toBe(true);
      const tools = getToolNames(response.toolCalls!);
      expect(tools).toContain('selectShapes');
      expect(tools).toContain('changeColor');
    }, 15000);

    it('should use deleteShapes for "delete all"', async () => {
      const response = await getAIToolCalls(
        'delete all shapes',
        mockCanvasState,
        { x: 2500, y: 2500 }
      );

      expect(response.success).toBe(true);
      const tools = getToolNames(response.toolCalls!);
      expect(tools).toContain('deleteShapes');
    }, 15000);
  });

  describe('Complex Commands', () => {
    it('should create multiple shapes for "make a traffic light"', async () => {
      const response = await getAIToolCalls(
        'make a traffic light with red, yellow, and green circles',
        [],
        { x: 2500, y: 2500 }
      );

      expect(response.success).toBe(true);
      const tools = getToolNames(response.toolCalls!);
      const hasCircle = tools.includes('createCircle');

      expect(hasCircle).toBe(true);
    }, 15000);

    it('should create multiple elements for "create a login form"', async () => {
      const response = await getAIToolCalls(
        'create a simple login form',
        [],
        { x: 2500, y: 2500 }
      );

      expect(response.success).toBe(true);
      const tools = getToolNames(response.toolCalls!);

      expect(tools.length).toBeGreaterThan(2);
      expect(tools).toContain('createText');
    }, 15000);
  });

  describe('Selection and Query Commands', () => {
    it('should use selectShapes for "select all circles"', async () => {
      const response = await getAIToolCalls(
        'select all circles',
        mockCanvasState,
        { x: 2500, y: 2500 }
      );

      expect(response.success).toBe(true);
      const tools = getToolNames(response.toolCalls!);

      // AI should use the provided canvas state, not call getCanvasState
      expect(tools).toContain('selectShapes');
      
      // Verify it selected the circles
      const args = parseToolArgs(response.toolCalls!, 'selectShapes');
      expect(args.shapeIds).toContain('circle1');
      expect(args.shapeIds).toContain('circle2');
    }, 15000);

    it('should selectShapes and manipulate for "distribute all circles"', async () => {
      const response = await getAIToolCalls(
        'distribute all circles horizontally',
        mockCanvasState,
        { x: 2500, y: 2500 }
      );

      expect(response.success).toBe(true);
      const tools = getToolNames(response.toolCalls!);

      // AI should use provided canvas state (no need for getCanvasState)
      expect(tools).toContain('selectShapes');
      expect(tools).toContain('distributeShapes');
      
      // Verify correct shapes selected
      const selectArgs = parseToolArgs(response.toolCalls!, 'selectShapes');
      expect(selectArgs.shapeIds).toContain('circle1');
      expect(selectArgs.shapeIds).toContain('circle2');
    }, 15000);
  });

  describe('Complex UI Components', () => {
    it('should create a login form with grouped elements and padding', async () => {
      const response = await getAIToolCalls(
        'create a login form',
        [],
        { x: 2500, y: 2500 }
      );

      expect(response.success).toBe(true);
      const tools = getToolNames(response.toolCalls!);

      // Should create multiple elements (container, text, inputs)
      expect(tools).toContain('createRectangle'); // Container and/or input fields
      expect(tools).toContain('createText'); // Labels or title
      
      // Verify multiple elements created
      expect(response.toolCalls!.length).toBeGreaterThanOrEqual(3);
      
      // Parse the tool calls to verify structure
      const rectangles = response.toolCalls!.filter(tc => tc.function.name === 'createRectangle');
      const texts = response.toolCalls!.filter(tc => tc.function.name === 'createText');
      
      expect(rectangles.length).toBeGreaterThanOrEqual(1); // At least container
      expect(texts.length).toBeGreaterThanOrEqual(1); // At least one label/title
      
      // Verify text is positioned inside containers (basic check)
      if (rectangles.length > 0 && texts.length > 0) {
        const containerArgs = JSON.parse(rectangles[0].function.arguments);
        const textArgs = JSON.parse(texts[0].function.arguments);
        
        // Text should be roughly inside the container area (within reasonable bounds)
        const containerBounds = {
          minX: containerArgs.x - 100,
          maxX: containerArgs.x + containerArgs.width + 100,
          minY: containerArgs.y - 50,
          maxY: containerArgs.y + containerArgs.height + 50,
        };
        
        expect(textArgs.x).toBeGreaterThan(containerBounds.minX);
        expect(textArgs.x).toBeLessThan(containerBounds.maxX);
        expect(textArgs.y).toBeGreaterThan(containerBounds.minY);
        expect(textArgs.y).toBeLessThan(containerBounds.maxY);
      }
    }, 35000);

    it('should create a dashboard with cards and titles', async () => {
      const response = await getAIToolCalls(
        'create a dashboard with 3 cards with titles',
        [],
        { x: 2500, y: 2500 }
      );

      expect(response.success).toBe(true);
      const tools = getToolNames(response.toolCalls!);

      // Should create cards (rectangles) and titles (text)
      expect(tools).toContain('createRectangle');
      expect(tools).toContain('createText');
      
      const rectangles = response.toolCalls!.filter(tc => tc.function.name === 'createRectangle');
      const texts = response.toolCalls!.filter(tc => tc.function.name === 'createText');
      
      // Dashboard should create each card+text pair separately (not batched)
      expect(rectangles.length).toBeGreaterThanOrEqual(3);
      expect(texts.length).toBeGreaterThanOrEqual(3);
      
      // Verify text is positioned inside each card (check first pair)
      if (rectangles.length > 0 && texts.length > 0) {
        const cardArgs = JSON.parse(rectangles[0].function.arguments);
        const titleArgs = JSON.parse(texts[0].function.arguments);
        
        // Title should be within card bounds
        const cardBounds = {
          minX: cardArgs.x,
          maxX: cardArgs.x + cardArgs.width,
          minY: cardArgs.y,
          maxY: cardArgs.y + cardArgs.height,
        };
        
        expect(titleArgs.x).toBeGreaterThanOrEqual(cardBounds.minX);
        expect(titleArgs.x).toBeLessThanOrEqual(cardBounds.maxX);
        expect(titleArgs.y).toBeGreaterThanOrEqual(cardBounds.minY);
        expect(titleArgs.y).toBeLessThanOrEqual(cardBounds.maxY);
      }
    }, 35000);
  });
});

