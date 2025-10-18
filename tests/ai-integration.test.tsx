/**
 * AI Integration Tests
 * Tests the full AI flow: Client → Cloud Function → OpenAI → Client
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, connectAuthEmulator } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';
import type { ProcessAICommandRequest, ProcessAICommandResponse } from '../src/types/ai';

// Firebase test configuration
const testConfig = {
  apiKey: "test-api-key",
  authDomain: "test.firebaseapp.com",
  projectId: "test-project",
  storageBucket: "test-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:test",
};

describe('AI Integration Tests', () => {
  let app: any;
  let auth: any;
  let functions: any;
  let userId: string;

  beforeAll(async () => {
    // Initialize Firebase for testing
    app = initializeApp(testConfig, 'test-app');
    auth = getAuth(app);
    functions = getFunctions(app);

    // Connect to emulators
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFunctionsEmulator(functions, 'localhost', 5001);

    // Sign in anonymously for testing
    const userCredential = await signInAnonymously(auth);
    userId = userCredential.user.uid;

    console.log('✅ Test setup complete. User ID:', userId);
  });

  afterAll(async () => {
    // Clean up
    await auth.signOut();
  });

  describe('processAICommand Cloud Function', () => {
    it('should require authentication', async () => {
      // Sign out to test unauthenticated access
      await auth.signOut();

      const processCommand = httpsCallable<ProcessAICommandRequest, ProcessAICommandResponse>(
        functions,
        'processAICommand'
      );

      const request: ProcessAICommandRequest = {
        command: 'create a blue rectangle',
        canvasId: 'test-canvas',
        canvasState: [],
        viewportCenter: { x: 2500, y: 2500 },
        selectedShapeIds: [],
      };

      try {
        await processCommand(request);
        expect.fail('Should have thrown unauthenticated error');
      } catch (error: any) {
        expect(error.code).toBe('functions/unauthenticated');
      }

      // Sign back in for other tests
      await signInAnonymously(auth);
    });

    it('should validate required fields', async () => {
      const processCommand = httpsCallable<any, any>(
        functions,
        'processAICommand'
      );

      // Missing command
      try {
        await processCommand({
          canvasId: 'test-canvas',
          canvasState: [],
          viewportCenter: { x: 2500, y: 2500 },
        });
        expect.fail('Should have thrown invalid-argument error');
      } catch (error: any) {
        expect(error.code).toBe('functions/invalid-argument');
        expect(error.message).toContain('Command is required');
      }

      // Missing canvasId
      try {
        await processCommand({
          command: 'create a rectangle',
          canvasState: [],
          viewportCenter: { x: 2500, y: 2500 },
        });
        expect.fail('Should have thrown invalid-argument error');
      } catch (error: any) {
        expect(error.code).toBe('functions/invalid-argument');
        expect(error.message).toContain('Canvas ID is required');
      }
    });

    it('should process simple shape creation command', async () => {
      const processCommand = httpsCallable<ProcessAICommandRequest, ProcessAICommandResponse>(
        functions,
        'processAICommand'
      );

      const request: ProcessAICommandRequest = {
        command: 'create a blue rectangle at 2500, 2500',
        canvasId: 'test-canvas',
        canvasState: [],
        viewportCenter: { x: 2500, y: 2500 },
        selectedShapeIds: [],
      };

      const result = await processCommand(request);
      const response = result.data;

      console.log('✅ Response:', JSON.stringify(response, null, 2));

      // Verify response structure
      expect(response).toBeDefined();
      expect(response.success).toBe(true);
      expect(response.toolCalls).toBeDefined();
      expect(Array.isArray(response.toolCalls)).toBe(true);
      expect(response.toolCalls!.length).toBeGreaterThan(0);

      // Verify tool call structure
      const firstTool = response.toolCalls![0];
      expect(firstTool.type).toBe('function');
      expect(firstTool.function).toBeDefined();
      expect(firstTool.function.name).toBeDefined();
      expect(firstTool.function.arguments).toBeDefined();

      // Parse arguments to verify structure
      const args = JSON.parse(firstTool.function.arguments);
      expect(args).toBeDefined();
      
      console.log('✅ Tool calls:', response.toolCalls!.map(tc => tc.function.name).join(', '));
    }, 30000); // 30 second timeout for OpenAI API

    it('should handle multiple shape creation', async () => {
      const processCommand = httpsCallable<ProcessAICommandRequest, ProcessAICommandResponse>(
        functions,
        'processAICommand'
      );

      const request: ProcessAICommandRequest = {
        command: 'create 3 red circles in a row',
        canvasId: 'test-canvas',
        canvasState: [],
        viewportCenter: { x: 2500, y: 2500 },
        selectedShapeIds: [],
      };

      const result = await processCommand(request);
      const response = result.data;

      expect(response.success).toBe(true);
      expect(response.toolCalls).toBeDefined();
      expect(response.toolCalls!.length).toBeGreaterThanOrEqual(3);

      // Verify all are createCircle calls
      response.toolCalls!.forEach((tool) => {
        expect(tool.function.name).toBe('createCircle');
        const args = JSON.parse(tool.function.arguments);
        expect(args.color).toBeDefined();
        expect(args.x).toBeDefined();
        expect(args.y).toBeDefined();
        expect(args.radius).toBeDefined();
      });

      console.log('✅ Created', response.toolCalls!.length, 'circles');
    }, 30000);

    it('should handle canvas state context', async () => {
      const processCommand = httpsCallable<ProcessAICommandRequest, ProcessAICommandResponse>(
        functions,
        'processAICommand'
      );

      const request: ProcessAICommandRequest = {
        command: 'arrange all shapes in a 2x2 grid',
        canvasId: 'test-canvas',
        canvasState: [
          { id: 'rect1', type: 'rectangle', x: 100, y: 100, width: 50, height: 50, fill: '#ff0000' },
          { id: 'rect2', type: 'rectangle', x: 200, y: 200, width: 50, height: 50, fill: '#00ff00' },
          { id: 'rect3', type: 'rectangle', x: 300, y: 300, width: 50, height: 50, fill: '#0000ff' },
          { id: 'rect4', type: 'rectangle', x: 400, y: 400, width: 50, height: 50, fill: '#ffff00' },
        ],
        viewportCenter: { x: 2500, y: 2500 },
        selectedShapeIds: [],
      };

      const result = await processCommand(request);
      const response = result.data;

      expect(response.success).toBe(true);
      expect(response.toolCalls).toBeDefined();
      
      // Should call arrangeInGrid
      const gridTool = response.toolCalls!.find(tc => tc.function.name === 'arrangeInGrid');
      expect(gridTool).toBeDefined();

      const args = JSON.parse(gridTool!.function.arguments);
      expect(args.rows).toBeDefined();
      expect(args.cols).toBeDefined();

      console.log('✅ Grid arrangement:', args);
    }, 30000);

    it('should handle selection-based commands', async () => {
      const processCommand = httpsCallable<ProcessAICommandRequest, ProcessAICommandResponse>(
        functions,
        'processAICommand'
      );

      const request: ProcessAICommandRequest = {
        command: 'change selected shapes to purple',
        canvasId: 'test-canvas',
        canvasState: [
          { id: 'rect1', type: 'rectangle', x: 100, y: 100, width: 50, height: 50, fill: '#ff0000' },
          { id: 'rect2', type: 'rectangle', x: 200, y: 200, width: 50, height: 50, fill: '#00ff00' },
        ],
        viewportCenter: { x: 2500, y: 2500 },
        selectedShapeIds: ['rect1', 'rect2'],
      };

      const result = await processCommand(request);
      const response = result.data;

      expect(response.success).toBe(true);
      expect(response.toolCalls).toBeDefined();
      
      // Should call changeColor
      const colorTool = response.toolCalls!.find(tc => tc.function.name === 'changeColor');
      expect(colorTool).toBeDefined();

      const args = JSON.parse(colorTool!.function.arguments);
      expect(args.shapeIds).toBeDefined();
      expect(args.color).toBeDefined();
      expect(args.shapeIds).toContain('rect1');
      expect(args.shapeIds).toContain('rect2');

      console.log('✅ Color change:', args);
    }, 30000);
  });

  describe('Error Handling', () => {
    it('should handle empty commands gracefully', async () => {
      const processCommand = httpsCallable<ProcessAICommandRequest, ProcessAICommandResponse>(
        functions,
        'processAICommand'
      );

      const request: ProcessAICommandRequest = {
        command: '',
        canvasId: 'test-canvas',
        canvasState: [],
        viewportCenter: { x: 2500, y: 2500 },
        selectedShapeIds: [],
      };

      try {
        await processCommand(request);
        expect.fail('Should have thrown invalid-argument error');
      } catch (error: any) {
        expect(error.code).toBe('functions/invalid-argument');
      }
    });

    it('should handle invalid viewport center', async () => {
      const processCommand = httpsCallable<any, any>(
        functions,
        'processAICommand'
      );

      const request = {
        command: 'create a rectangle',
        canvasId: 'test-canvas',
        canvasState: [],
        viewportCenter: { x: 'invalid', y: 2500 },
        selectedShapeIds: [],
      };

      try {
        await processCommand(request);
        expect.fail('Should have thrown invalid-argument error');
      } catch (error: any) {
        expect(error.code).toBe('functions/invalid-argument');
      }
    });
  });
});


