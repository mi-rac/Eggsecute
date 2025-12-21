import type { Problem } from '@code-practice/shared-types';

export const exercises: Record<string, Problem> = {
  'two-sum': {
    id: 'two-sum',
    title: 'Two Sum',
    description: `Given an array of integers \`nums\` and an integer \`target\`, return the indices of the two numbers that add up to \`target\`.

You may assume that each input has exactly one solution, and you may not use the same element twice.

**Example 1:**
\`\`\`
Input: nums = [2, 7, 11, 15], target = 9
Output: [0, 1]
Explanation: nums[0] + nums[1] = 2 + 7 = 9
\`\`\`

**Example 2:**
\`\`\`
Input: nums = [3, 2, 4], target = 6
Output: [1, 2]
\`\`\``,
    functionName: 'twoSum',
    inputSchema: {
      type: 'array',
      items: [
        { type: 'array', items: { type: 'number' } },
        { type: 'number' },
      ],
    },
    outputSchema: {
      type: 'array',
      items: { type: 'number' },
    },
    testCases: [
      {
        input: [[2, 7, 11, 15], 9],
        expectedOutput: [0, 1],
        description: 'Basic case',
      },
      {
        input: [[3, 2, 4], 6],
        expectedOutput: [1, 2],
        description: 'Numbers not at start',
      },
      {
        input: [[3, 3], 6],
        expectedOutput: [0, 1],
        description: 'Same numbers',
      },
      {
        input: [[1, 5, 3, 7, 2], 9],
        expectedOutput: [1, 3],
        description: 'Larger array',
      },
    ],
    difficulty: 'easy',
  },
  'fizz-buzz': {
    id: 'fizz-buzz',
    title: 'Fizz Buzz',
    description: `Given an integer \`n\`, return a string array where:
- \`answer[i] == "FizzBuzz"\` if \`i\` is divisible by 3 and 5.
- \`answer[i] == "Fizz"\` if \`i\` is divisible by 3.
- \`answer[i] == "Buzz"\` if \`i\` is divisible by 5.
- \`answer[i] == i\` (as a string) otherwise.

Note: The array is 1-indexed.

**Example:**
\`\`\`
Input: n = 5
Output: ["1", "2", "Fizz", "4", "Buzz"]
\`\`\``,
    functionName: 'fizzBuzz',
    inputSchema: { type: 'number' },
    outputSchema: { type: 'array', items: { type: 'string' } },
    testCases: [
      {
        input: [3],
        expectedOutput: ['1', '2', 'Fizz'],
        description: 'n = 3',
      },
      {
        input: [5],
        expectedOutput: ['1', '2', 'Fizz', '4', 'Buzz'],
        description: 'n = 5',
      },
      {
        input: [15],
        expectedOutput: ['1', '2', 'Fizz', '4', 'Buzz', 'Fizz', '7', '8', 'Fizz', 'Buzz', '11', 'Fizz', '13', '14', 'FizzBuzz'],
        description: 'n = 15 (includes FizzBuzz)',
      },
    ],
    difficulty: 'easy',
  },
};

export function getExerciseById(id: string): Problem | undefined {
  return exercises[id];
}

export function getAllExercises(): Problem[] {
  return Object.values(exercises);
}

