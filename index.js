const $ = (selector) => document.querySelector(selector);
const display = $(".output");
const numberButtons = document.querySelectorAll(".btn:not(.operator)");
const operatorButtons = document.querySelectorAll(".operator");
const operators = ["+", "-", "*", "/", "(", ")"];
const DEFAULT_VALUE = "0";
const ERROR_VALUE = "Error";

// ----------------------
// Helper Functions
// ----------------------

const getValue = () => display.textContent;

const setValue = (value) => {
  display.textContent = value;
};

const removeZero = () => {
  if (getValue() === DEFAULT_VALUE) {
    setValue("");
  }
};

const lastChar = () => getValue().at(-1);

const isNumber = (char) => !isNaN(Number(char));

const currentNumber = () =>
  getValue()
    .split(/[+\-*/]/)
    .pop();

const append = (value) => {
  removeZero();
  setValue(getValue() + value);
};

const clear = () => {
  setValue(DEFAULT_VALUE);
};

const backspace = () => {
  setValue(getValue().slice(0, -1) || DEFAULT_VALUE);
};
const hasBalancedParentheses = () => {
  let count = 0;

  for (const char of getValue()) {
    if (char === "(") count++;
    if (char === ")") count--;

    if (count < 0) return false;
  }

  return count === 0;
};
const evaluate = () => {
  try {
    if (!hasBalancedParentheses()) {
      setValue(ERROR_VALUE);
      return;
    }
    let result = parantheseis(tokenizer());
    result = solveAddSub(solveMulDiv(result));
    setValue(result);
  } catch {
    setValue(ERROR_VALUE);
  }
};
let parantheseis = (e) => {
  let prev = [];
  while (e.some((k) => ['('].includes(k))){
    for(let i = 0; i<e.length;i++){
      if (e[i] === "(") {
      prev.push(i);
    } else if (e[i] === ")") {
      let a = prev.pop();
      e.splice(
        a,
        i - a + 1,
        solveAddSub(solveMulDiv(e.slice(a, i + 1))),
      );
      break;
    }
    }
  }
  
  return e
};
const tokenizer = () => {
  const chars = getValue().split("");
  const tokens = [];
  let currentNumber = "";
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    // ---------- Unary Minus ----------
    if (
      char === "-" &&
      (
        i === 0 ||
        ["+", "-", "*", "/", "("].includes(chars[i - 1])
      )
    ) {
      currentNumber = "-";
      continue;
    }
    // ---------- Operators / Parentheses ----------
    if (operators.includes(char)) {
      if (currentNumber !== "") {
        tokens.push(Number(currentNumber));
        currentNumber = "";
      }
      // Implicit multiplication
      if (
        char === "(" &&
        (
          typeof tokens.at(-1) === "number" ||
          tokens.at(-1) === ")"
        )
      ) {
        tokens.push("*");
      }
      if (
        char === ")" &&
        chars[i + 1] &&
        (
          !operators.includes(chars[i + 1]) ||
          chars[i + 1] === "("
        )
      ) {
        tokens.push(")");
        tokens.push("*");
        continue;
      }

      tokens.push(char);
      continue;
    }

    // ---------- Number ----------
    currentNumber += char;
  }
  if (currentNumber !== "") {
    tokens.push(Number(currentNumber));
  }
  return tokens;
};
const solveMulDiv = (e) => {
  let res;
  while (e.some((k) => ["*", "/"].includes(k))) {
    for (let i = 0; i < e.length; i++) {
      if (e[i] === "*" || e[i] === "/") {
        if (e[i] == "*") {
          res = e[i - 1] * e[i + 1];
        } else {
          res = e[i - 1] / e[i + 1];
        }
        e.splice(i - 1, 3, res);
        break;
      }
    }
  }
  return e;
};
const solveAddSub = (e) => {
  let res;
  while (e.some((k) => ["+", "-"].includes(k))) {
    for (let i = 0; i < e.length; i++) {
      if (e[i] === "+" || e[i] === "-") {
        if (e[i] == "+") {
          res = e[i - 1] + e[i + 1];
        } else {
          res = e[i - 1] - e[i + 1];
        }
        e.splice(i - 1, 3, res);
        break;
      }
    }
  }
  for (let i =0;i<e.length;i++){
    if(isNumber(e[i])){
      return e[i];
      break;
    }
  }
};

const canAddOperator = (operator) => {
  const last = lastChar();

  if (operator === "-") {
    // Normal subtraction
    if (isNumber(last) || last === ")") {
      return true;
    }

    // Unary minus only after one operator or (
    if (
      getValue() === DEFAULT_VALUE ||
      last === "(" ||
      ["+", "-", "*", "/"].includes(last)
    ) {
      // Prevent ---, +---, *--- etc.
      const prev = getValue().at(-2);

      return !["+", "-", "*", "/"].includes(prev);
    }

    return false;
  }

  return isNumber(last) || last === ")";
};
const canAddOpenBracket = () => {
  return (
    getValue() === DEFAULT_VALUE ||
    (operators.includes(lastChar())) ||
    lastChar() === "("
  );
};

const canAddCloseBracket = () => {
  return isNumber(lastChar()) || lastChar() === ")";
};

const canAddDecimal = () => {
  return lastChar() !== "." && !currentNumber().includes(".");
};

// ----------------------
// Mouse Events
// -----------;-----------

numberButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    append(btn.dataset.value);
  });
});

operatorButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const value = btn.dataset.value;

    if (value === "AC") {
      clear();
      return;
    }

    if (value === "C") {
      backspace();
      return;
    }

    if (value === "=") {
      evaluate();
      return;
    }

    if (value === ".") {
      if (canAddDecimal()) {
        append(".");
      }
      return;
    }

    if (value === "(") {
      if (canAddOpenBracket()) {
        append(value);
      }
      return;
    }

    if (value === ")") {
      if (canAddCloseBracket()) {
        append(value);
      }
      return;
    }

    if (canAddOperator(value)) {
      append(value);
    }
  });
});

// ----------------------
// Keyboard Events
// ----------------------

document.addEventListener("keydown", (e) => {
  const key = e.key;

  if (!isNaN(Number(key))) {
    append(key);
    return;
  }

  if (key === ".") {
    if (canAddDecimal()) {
      append(".");
    }
    return;
  }

  if (key === "=" || key === "Enter") {
    evaluate();
    return;
  }

  if (key === "Backspace") {
    backspace();
    return;
  }

  if (key === "Escape") {
    clear();
    return;
  }

  if (key === "(") {
    if (canAddOpenBracket()) {
      append(key);
    }
    return;
  }

  if (key === ")") {
    if (canAddCloseBracket()) {
      append(key);
    }
    return;
  }

  if (operators.includes(key) && canAddOperator(key)) {
    append(key);
  }
});
