# AI Tool Selection Integration Tests

This test suite validates that the AI correctly selects the appropriate tools for various natural language commands.

## Purpose

The tests verify that:
1. ✅ The AI chooses the right tool for each command type
2. ✅ Batched creation uses the `count` parameter efficiently
3. ✅ Random colored shapes use the `colors` array
4. ✅ Complex commands generate multiple tool calls
5. ✅ Edge cases are handled gracefully

## Running the Tests

### 1. Start Firebase Emulators

**Required**: The tests need the Firebase Functions emulator running.

```bash
# In one terminal:
firebase emulators:start --only functions,auth,database
```

Wait for the emulators to fully start (you should see "All emulators started").

### 2. Run the Tests

**In a separate terminal:**

```bash
# Run tests in watch mode
npm run test:ai-tools

# Run tests once
npm run test:ai-tools -- --run

# Run with UI
npm run test:ai-tools:ui
```

## Test Coverage

### Creation Commands
- ✅ Single shapes (rectangle, circle, line, text)
- ✅ Batched shapes with count parameter
- ✅ Random colored shapes with colors array
- ✅ Rainbow patterns

### Layout Commands
- ✅ Arrange in grid
- ✅ Align shapes (left, right, center, top, bottom)
- ✅ Distribute shapes (horizontal, vertical)

### Manipulation Commands
- ✅ Move shapes
- ✅ Resize shapes
- ✅ Rotate shapes
- ✅ Change colors
- ✅ Delete shapes

### Complex Commands
- ✅ Traffic light (multi-shape creation)
- ✅ Login form (complex layouts)

### Selection & Query
- ✅ Select shapes by type
- ✅ Get canvas state before manipulation

### Edge Cases
- ✅ Vague commands
- ✅ Impossible requests

## Expected Results

All tests should **PASS** if:
1. Firebase Functions emulator is running
2. OpenAI API key is configured in `functions/.env.local`
3. The AI model is `gpt-4o-mini` (configured in `functions/src/ai/openai.ts`)

## Debugging Failing Tests

If tests fail, check:

### 1. **Emulator Not Running**
```
Error: fetch failed
```
**Solution**: Start `firebase emulators:start --only functions,auth,database`

### 2. **Missing OpenAI API Key**
```
Error: Missing credentials
```
**Solution**: Add `OPENAI_API_KEY=sk-...` to `functions/.env.local`

### 3. **Wrong Tool Selected**
Example: Test expects `createRectangle` but AI used `createCircle`

**Solution**: 
- Check the system prompt in `functions/src/ai/executor.ts`
- Verify tool descriptions in `functions/src/ai/tools.ts`
- The AI might be interpreting the command differently - adjust test expectations or prompt

### 4. **No Tool Calls Generated**
The AI didn't generate any function calls.

**Possible causes**:
- Command is too vague
- OpenAI model changed behavior
- System prompt needs adjustment

## Test Output Example

```
✓ tests/ai-tool-selection.test.tsx (28)
  ✓ Creation Commands (4)
    ✓ should use createRectangle for "create a rectangle"
    ✓ should use createCircle for "create a circle"
    ✓ should use createLine for "create a line"
    ✓ should use createText for "create text that says Hello"
  ✓ Batched Creation Commands (4)
    ✓ should use createRectangle with count=10 for "create 10 rectangles"
    ✓ should use createCircle with count=100 for "create 100 circles"
    ✓ should use colors array for "create 10 random colored circles"
    ✓ should use colors array for "create 7 rainbow rectangles"
  ...
```

## Adding New Test Cases

To add a new test:

```typescript
it('should use [toolName] for "[command]"', async () => {
  const response = await testAICommand('[your command here]');
  const tools = getToolNames(response);
  const args = parseToolArgs(response, '[toolName]');
  
  expect(tools).toContain('[toolName]');
  expect(args.someParameter).toBe(expectedValue);
});
```

## Known Issues

1. **AI behavior varies slightly** between runs due to temperature=0.7
2. **Complex commands** may have multiple valid interpretations
3. **Color names** might differ (e.g., "lime" vs "lightgreen")

## Success Criteria

A successful test run means:
- ✅ All basic creation/manipulation commands work
- ✅ Batched creation uses `count` parameter (not individual calls)
- ✅ Random colors use `colors` array
- ✅ No timeouts or crashes
- ✅ At least 80% of tests passing

If less than 80% pass, review the failing tests and adjust either:
- The test expectations (if AI interpretation is reasonable)
- The system prompt (if AI is consistently choosing wrong tools)
- The tool descriptions (if tools are ambiguous)


