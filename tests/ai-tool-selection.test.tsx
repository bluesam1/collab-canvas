/**
 * AI Tool Selection Integration Tests
 * Tests that the AI selects the correct tools for various commands
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, connectAuthEmulator } from 'firebase/auth';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';

// Note: These tests require Firebase Functions emulator running
// Run: firebase emulators:start --only functions,auth,database

// Initialize Firebase for testing
const firebaseConfig = {
  apiKey: 'fake-api-key',
  authDomain: 'localhost',
  projectId: 'collab-canvas-2',
  storageBucket: 'collab-canvas-2.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:abcdef123456',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const functions = getFunctions(app);

// Connect to emulators
connectAuthEmulator(auth, 'http://localhost:9099');
connectFunctionsEmulator(functions, 'localhost', 5001);

interface AICommandResponse {
  success: boolean;
  toolCalls?: Array<{
    id: string;
    type: string;
    function: {
      name: string;
      arguments: string;
    };
  }>;
  error?: string;
}

async function testAICommand(command: string): Promise<AICommandResponse> {
  // Call the Cloud Function using Firebase SDK
  const processAICommand = httpsCallable<any, AICommandResponse>(functions, 'processAICommand');
  
  const result = await processAICommand({
    command,
    canvasId: 'test-canvas',
    canvasState: [],
    viewportCenter: { x: 2500, y: 2500 },
    selectedShapeIds: [],
    currentColor: '#3b82f6',
    currentStrokeWidth: 2,
  });

  return result.data;
}

function getToolNames(response: AICommandResponse): string[] {
  return response.toolCalls?.map(tc => tc.function.name) || [];
}

function parseToolArgs(response: AICommandResponse, toolName: string): any {
  const toolCall = response.toolCalls?.find(tc => tc.function.name === toolName);
  return toolCall ? JSON.parse(toolCall.function.arguments) : null;
}

describe('AI Tool Selection Tests', () => {
  beforeAll(async () => {
    console.log('\n⚠️  Make sure Firebase Functions emulator is running!');
    console.log('Run: firebase emulators:start --only functions,auth,database\n');
    
    // Sign in anonymously to get auth token for testing
    try {
      await signInAnonymously(auth);
      console.log('✅ Signed in anonymously for testing\n');
    } catch (error) {
      console.error('❌ Failed to sign in:', error);
      throw error;
    }
  });

  describe('Creation Commands', () => {
    it('should use createRectangle for "create a rectangle"', async () => {
      const response = await testAICommand('create a rectangle');
      const tools = getToolNames(response);
      
      expect(tools).toContain('createRectangle');
      expect(tools).toHaveLength(1);
    });

    it('should use createCircle for "create a circle"', async () => {
      const response = await testAICommand('create a circle');
      const tools = getToolNames(response);
      
      expect(tools).toContain('createCircle');
      expect(tools).toHaveLength(1);
    });

    it('should use createLine for "create a line"', async () => {
      const response = await testAICommand('create a line');
      const tools = getToolNames(response);
      
      expect(tools).toContain('createLine');
      expect(tools).toHaveLength(1);
    });

    it('should use createText for "create text that says Hello"', async () => {
      const response = await testAICommand('create text that says Hello');
      const tools = getToolNames(response);
      
      expect(tools).toContain('createText');
      expect(tools).toHaveLength(1);
    });
  });

  describe('Batched Creation Commands', () => {
    it('should use createRectangle with count=10 for "create 10 rectangles"', async () => {
      const response = await testAICommand('create 10 rectangles');
      const tools = getToolNames(response);
      const args = parseToolArgs(response, 'createRectangle');
      
      expect(tools).toContain('createRectangle');
      expect(args.count).toBe(10);
    });

    it('should use createCircle with count=100 for "create 100 circles"', async () => {
      const response = await testAICommand('create 100 circles');
      const tools = getToolNames(response);
      const args = parseToolArgs(response, 'createCircle');
      
      expect(tools).toContain('createCircle');
      expect(args.count).toBe(100);
    });

    it('should use colors array for "create 10 random colored circles"', async () => {
      const response = await testAICommand('create 10 random colored circles');
      const tools = getToolNames(response);
      const args = parseToolArgs(response, 'createCircle');
      
      expect(tools).toContain('createCircle');
      expect(args.count).toBe(10);
      expect(args.colors).toBeDefined();
      expect(Array.isArray(args.colors)).toBe(true);
      expect(args.colors.length).toBeGreaterThan(1);
    });

    it('should use colors array for "create 7 rainbow rectangles"', async () => {
      const response = await testAICommand('create 7 rainbow rectangles');
      const tools = getToolNames(response);
      const args = parseToolArgs(response, 'createRectangle');
      
      expect(tools).toContain('createRectangle');
      expect(args.count).toBe(7);
      expect(args.colors).toBeDefined();
      expect(Array.isArray(args.colors)).toBe(true);
      expect(args.colors.length).toBeGreaterThanOrEqual(5); // Should have rainbow colors
    });
  });

  describe('Layout Commands', () => {
    it('should use arrangeInGrid for "arrange in a grid"', async () => {
      const response = await testAICommand('arrange all shapes in a 3x3 grid');
      const tools = getToolNames(response);
      
      expect(tools).toContain('arrangeInGrid');
    });

    it('should use alignShapes for "align left"', async () => {
      const response = await testAICommand('align all shapes to the left');
      const tools = getToolNames(response);
      
      expect(tools).toContain('alignShapes');
    });

    it('should use distributeShapes for "distribute horizontally"', async () => {
      const response = await testAICommand('distribute shapes horizontally');
      const tools = getToolNames(response);
      
      expect(tools).toContain('distributeShapes');
    });
  });

  describe('Manipulation Commands', () => {
    it('should use moveShapes for "move to center"', async () => {
      const response = await testAICommand('move all shapes to the center');
      const tools = getToolNames(response);
      
      expect(tools).toContain('moveShapes');
    });

    it('should use resizeShapes for "make them bigger"', async () => {
      const response = await testAICommand('make all shapes twice as big');
      const tools = getToolNames(response);
      
      expect(tools).toContain('resizeShapes');
    });

    it('should use rotateShapes for "rotate 45 degrees"', async () => {
      const response = await testAICommand('rotate all shapes 45 degrees');
      const tools = getToolNames(response);
      
      expect(tools).toContain('rotateShapes');
    });

    it('should use changeColor for "change color to red"', async () => {
      const response = await testAICommand('change all shapes to red');
      const tools = getToolNames(response);
      
      expect(tools).toContain('changeColor');
    });

    it('should use deleteShapes for "delete all"', async () => {
      const response = await testAICommand('delete all shapes');
      const tools = getToolNames(response);
      
      expect(tools).toContain('deleteShapes');
    });
  });

  describe('Complex Commands', () => {
    it('should create multiple shapes for "make a traffic light"', async () => {
      const response = await testAICommand('make a traffic light with red, yellow, and green circles');
      const tools = getToolNames(response);
      
      // Should either use createCircle with count=3 and colors array
      // OR create 3 separate circles
      const circleCount = tools.filter(t => t === 'createCircle').length;
      const hasCircle = tools.includes('createCircle');
      
      expect(hasCircle).toBe(true);
      expect(circleCount).toBeGreaterThan(0);
    });

    it('should create multiple elements for "create a login form"', async () => {
      const response = await testAICommand('create a simple login form');
      const tools = getToolNames(response);
      
      // Should create text labels and rectangles for input fields
      expect(tools.length).toBeGreaterThan(2);
      expect(tools).toContain('createText');
    });
  });

  describe('Selection and Query Commands', () => {
    it('should use getCanvasState and selectShapes for "select all circles"', async () => {
      const response = await testAICommand('select all circles');
      const tools = getToolNames(response);
      
      expect(tools).toContain('getCanvasState');
      expect(tools).toContain('selectShapes');
    });

    it('should use getCanvasState before manipulating unselected shapes', async () => {
      const response = await testAICommand('distribute all circles horizontally');
      const tools = getToolNames(response);
      
      // Should first get canvas state to see what circles exist
      expect(tools).toContain('getCanvasState');
      expect(tools).toContain('selectShapes');
      expect(tools).toContain('distributeShapes');
    });
  });

  describe('Edge Cases', () => {
    it('should handle vague commands gracefully', async () => {
      const response = await testAICommand('do something cool');
      
      // Should either succeed with some creative interpretation
      // or return an error/empty tool calls
      expect(response).toBeDefined();
      expect(typeof response.success).toBe('boolean');
    });

    it('should handle impossible commands gracefully', async () => {
      const response = await testAICommand('teleport to Mars');
      
      // Should return an error or no tool calls
      expect(response).toBeDefined();
      if (response.toolCalls) {
        expect(response.toolCalls.length).toBe(0);
      }
    });
  });
});

