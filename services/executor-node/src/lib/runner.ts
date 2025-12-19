import { spawn } from 'child_process';
import { writeFile, rm, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import type { TestCase, TestResult } from '@code-practice/shared-types';

export interface RunResult {
  testResults: TestResult[];
  totalExecutionTimeMs: number;
  peakMemoryUsageBytes: number;
}

interface SingleTestResult {
  passed: boolean;
  actualOutput: unknown;
  executionTimeMs: number;
  memoryUsageBytes: number;
  error?: string;
}

/**
 * Execute compiled JavaScript code against test cases
 */
export async function runCode(
  compiledCode: string,
  functionName: string,
  testCases: TestCase[],
  onTestResult: (result: TestResult) => void,
): Promise<RunResult> {
  const workDir = join(tmpdir(), `executor-node-${Date.now()}`);
  await mkdir(workDir, { recursive: true });

  const testResults: TestResult[] = [];
  let totalExecutionTimeMs = 0;
  let peakMemoryUsageBytes = 0;

  try {
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      const result = await runSingleTest(
        workDir,
        compiledCode,
        functionName,
        testCase,
        i,
      );

      const testResult: TestResult = {
        testIndex: i,
        passed: result.passed,
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: result.actualOutput,
        error: result.error,
        executionTimeMs: result.executionTimeMs,
        memoryUsageBytes: result.memoryUsageBytes,
      };

      testResults.push(testResult);
      totalExecutionTimeMs += result.executionTimeMs;
      peakMemoryUsageBytes = Math.max(peakMemoryUsageBytes, result.memoryUsageBytes);
      
      // Emit live update
      onTestResult(testResult);
    }

    return { testResults, totalExecutionTimeMs, peakMemoryUsageBytes };
  } finally {
    // Cleanup
    await rm(workDir, { recursive: true, force: true });
  }
}

async function runSingleTest(
  workDir: string,
  compiledCode: string,
  functionName: string,
  testCase: TestCase,
  testIndex: number,
): Promise<SingleTestResult> {
  const testFile = join(workDir, `test_${testIndex}.mjs`);
  
  // Create a test harness that runs the user function and reports results
  const harness = `
${compiledCode}

const input = ${JSON.stringify(testCase.input)};
const expected = ${JSON.stringify(testCase.expectedOutput)};

const startTime = performance.now();
const startMemory = process.memoryUsage().heapUsed;

try {
  const args = Array.isArray(input) ? input : [input];
  const result = ${functionName}(...args);
  const endTime = performance.now();
  const endMemory = process.memoryUsage().heapUsed;
  
  console.log(JSON.stringify({
    success: true,
    result,
    executionTimeMs: endTime - startTime,
    memoryUsageBytes: Math.max(0, endMemory - startMemory),
  }));
} catch (error) {
  const endTime = performance.now();
  console.log(JSON.stringify({
    success: false,
    error: error.message || String(error),
    executionTimeMs: endTime - startTime,
    memoryUsageBytes: 0,
  }));
}
`;

  await writeFile(testFile, harness);

  return new Promise((resolve) => {
    const startTime = performance.now();
    let output = '';
    let errorOutput = '';

    const child = spawn('node', [testFile], {
      timeout: 10000, // 10 second timeout
      cwd: workDir,
    });

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    child.on('close', (code) => {
      const wallTime = performance.now() - startTime;

      if (code !== 0 || errorOutput) {
        resolve({
          passed: false,
          actualOutput: undefined,
          executionTimeMs: wallTime,
          memoryUsageBytes: 0,
          error: errorOutput || `Process exited with code ${code}`,
        });
        return;
      }

      try {
        const result = JSON.parse(output.trim());
        
        if (!result.success) {
          resolve({
            passed: false,
            actualOutput: undefined,
            executionTimeMs: result.executionTimeMs,
            memoryUsageBytes: result.memoryUsageBytes,
            error: result.error,
          });
          return;
        }

        const passed = JSON.stringify(result.result) === JSON.stringify(testCase.expectedOutput);
        
        resolve({
          passed,
          actualOutput: result.result,
          executionTimeMs: result.executionTimeMs,
          memoryUsageBytes: result.memoryUsageBytes,
        });
      } catch {
        resolve({
          passed: false,
          actualOutput: output,
          executionTimeMs: wallTime,
          memoryUsageBytes: 0,
          error: 'Failed to parse test output',
        });
      }
    });

    child.on('error', (err) => {
      resolve({
        passed: false,
        actualOutput: undefined,
        executionTimeMs: performance.now() - startTime,
        memoryUsageBytes: 0,
        error: err.message,
      });
    });
  });
}

