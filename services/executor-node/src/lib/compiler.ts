import * as esbuild from 'esbuild';

export interface CompileResult {
  success: boolean;
  code?: string;
  compileTimeMs: number;
  error?: string;
}

/**
 * Compile TypeScript code to JavaScript using esbuild
 */
export async function compileTypeScript(code: string): Promise<CompileResult> {
  const startTime = performance.now();
  
  try {
    const result = await esbuild.transform(code, {
      loader: 'ts',
      target: 'es2022',
      format: 'esm',
      sourcemap: false,
    });

    const compileTimeMs = performance.now() - startTime;

    if (result.warnings.length > 0) {
      console.warn('TypeScript compilation warnings:', result.warnings);
    }

    return {
      success: true,
      code: result.code,
      compileTimeMs,
    };
  } catch (error) {
    const compileTimeMs = performance.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return {
      success: false,
      compileTimeMs,
      error: errorMessage,
    };
  }
}

