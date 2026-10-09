/**
 * Safe Deterministic Math & Arithmetic Evaluator
 * Safely parses and calculates arithmetic expressions, equality comparisons,
 * and direct conceptual arithmetic questions without using eval() or Function().
 * Returns a concise formatted answer or null if it should be delegated to Gemini.
 */

export function evaluateSimpleMath(input: string): string | null {
  if (!input || typeof input !== "string") return null;

  const raw = input.trim();
  const lower = raw.toLowerCase();

  // 1. Direct addition / subtraction / multiplication example requests
  if (
    /^(give (me )?(an )?example of addition|example of addition|addition example)\b/i.test(lower)
  ) {
    return "Example: 12 + 8 = 20.";
  }
  if (
    /^(give (me )?(an )?example of subtraction|example of subtraction|subtraction example)\b/i.test(lower)
  ) {
    return "Example: 25 - 9 = 16.";
  }
  if (
    /^(give (me )?(an )?example of multiplication|example of multiplication|multiplication example)\b/i.test(lower)
  ) {
    return "Example: 7 × 6 = 42.";
  }
  if (
    /^(give (me )?(an )?example of division|example of division|division example)\b/i.test(lower)
  ) {
    return "Example: 48 ÷ 6 = 8.";
  }

  // 2. Inequality explanation (e.g. "Explain why 34 is not equal to 45" or "Why is 34 != 45")
  const whyNotEqualMatch = lower.match(
    /^(?:explain\s+)?why\s+(?:is\s+)?(-?\d+(?:\.\d+)?)\s*(?:is\s+not\s+equal\s+to|!=|≠|is\s+different\s+from)\s*(-?\d+(?:\.\d+)?)/i
  );
  if (whyNotEqualMatch) {
    const num1 = parseFloat(whyNotEqualMatch[1]);
    const num2 = parseFloat(whyNotEqualMatch[2]);
    if (num1 === num2) {
      return `${num1} = ${num2}. These two numbers are identical in value.`;
    }
    const diff = Math.abs(num2 - num1);
    const comparison = num1 < num2 ? `${num1} is ${diff} less than ${num2}` : `${num1} is ${diff} greater than ${num2}`;
    return `${comparison}, so the two numbers are not equal (${num1} ≠ ${num2}).`;
  }

  // 3. Equality / Inequality direct comparison query (e.g. "34 = 45", "34 == 45", "34 != 45", "34 ≠ 45", "is 34 = 45?")
  let compExpr = raw.replace(/^(is\s+|check\s+if\s+)/i, "").replace(/[?]+$/, "").trim();
  const eqMatch = compExpr.match(/^([0-9\.\s\+\-\*\/\(\)]+?)\s*(===|==|=|!=|≠|<>)\s*([0-9\.\s\+\-\*\/\(\)]+)$/);
  if (eqMatch) {
    try {
      const lhsVal = evaluateArithmeticString(eqMatch[1]);
      const rhsVal = evaluateArithmeticString(eqMatch[3]);
      const op = eqMatch[2];

      if (lhsVal !== null && rhsVal !== null) {
        const isActuallyEqual = Math.abs(lhsVal - rhsVal) < 1e-9;
        const isNotEqualOp = op === "!=" || op === "≠" || op === "<>";

        if (isNotEqualOp) {
          if (!isActuallyEqual) {
            return `${lhsVal} ≠ ${rhsVal}. This statement is correct (${lhsVal} is not equal to ${rhsVal}).`;
          } else {
            return `${lhsVal} = ${rhsVal}. This statement is incorrect because both sides evaluate to ${lhsVal}.`;
          }
        } else {
          if (isActuallyEqual) {
            return `${lhsVal} = ${rhsVal}. This statement is true.`;
          } else {
            return `${lhsVal} ≠ ${rhsVal}. In standard arithmetic, ${lhsVal} is not equal to ${rhsVal}.`;
          }
        }
      }
    } catch (_) {
      // Fall through if parsing fails
    }
  }

  // 4. Standard arithmetic calculation (e.g., "20 + 78", "what is 20 + 78", "15 * 4", "(12 + 8) / 2")
  let expr = raw;
  expr = expr.replace(/^(what is|calculate|evaluate|solve|compute|find)\s+/i, "");
  expr = expr.replace(/[?!=]+$/, "").trim();

  // Normalize operators
  const normalized = expr
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/\s+/g, "");

  // Must contain only digits, decimal dots, parentheses, and standard operators (+, -, *, /, %, ^)
  if (/^[\d\.\+\-\*\/\%\^\(\)]+$/.test(normalized) && /[\+\-\*\/\%\^]/.test(normalized)) {
    try {
      const result = parseAndEval(normalized);
      if (result !== null && Number.isFinite(result)) {
        const cleanResult = parseFloat(result.toFixed(10)).toString();
        const displayExpr = expr.replace(/\s+/g, " ");
        return `${displayExpr} = ${cleanResult}`;
      }
    } catch (_) {
      return null;
    }
  }

  return null;
}

// Helper to evaluate a small arithmetic string
function evaluateArithmeticString(str: string): number | null {
  const norm = str.replace(/×/g, "*").replace(/÷/g, "/").replace(/\s+/g, "");
  if (/^[\d\.\+\-\*\/\%\^\(\)]+$/.test(norm)) {
    return parseAndEval(norm);
  }
  return null;
}

// Safe recursive descent arithmetic parser without eval
function parseAndEval(str: string): number | null {
  let pos = 0;

  function peek(): string {
    return str[pos] || "";
  }

  function get(): string {
    return str[pos++] || "";
  }

  function parseExpression(): number {
    let value = parseTerm();
    while (peek() === "+" || peek() === "-") {
      const op = get();
      const next = parseTerm();
      if (op === "+") value += next;
      else value -= next;
    }
    return value;
  }

  function parseTerm(): number {
    let value = parseFactor();
    while (peek() === "*" || peek() === "/" || peek() === "%") {
      const op = get();
      const next = parseFactor();
      if (op === "*") value *= next;
      else if (op === "/") {
        if (next === 0) throw new Error("Division by zero");
        value /= next;
      } else if (op === "%") {
        value %= next;
      }
    }
    return value;
  }

  function parseFactor(): number {
    let value = parseUnary();
    if (peek() === "^") {
      get(); // consume '^'
      const exp = parseFactor();
      value = Math.pow(value, exp);
    }
    return value;
  }

  function parseUnary(): number {
    if (peek() === "+") {
      get();
      return parseUnary();
    }
    if (peek() === "-") {
      get();
      return -parseUnary();
    }
    return parsePrimary();
  }

  function parsePrimary(): number {
    if (peek() === "(") {
      get(); // consume '('
      const val = parseExpression();
      if (get() !== ")") throw new Error("Missing closing parenthesis");
      return val;
    }

    let numStr = "";
    while (/[\d\.]/.test(peek())) {
      numStr += get();
    }

    if (numStr === "") throw new Error("Expected number");
    const num = parseFloat(numStr);
    if (isNaN(num)) throw new Error("Invalid number");
    return num;
  }

  const result = parseExpression();
  if (pos < str.length) throw new Error("Unexpected trailing characters");
  return result;
}
