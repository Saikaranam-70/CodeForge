const Docker = require("dockerode");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFile } = require("child_process");
const { Writable } = require("stream");

// Initialize Docker client
const docker = new Docker({
  socketPath:
    process.env.DOCKER_SOCKET_PATH ||
    (process.platform === "win32"
      ? "//./pipe/docker_engine"
      : "/var/run/docker.sock")
});

let isDockerAvailable = false;

// Auto-detect JDK & compiler paths on Windows
let defaultJavac = "javac";
let defaultJava = "java";

if (process.platform === "win32") {
  const commonJavaDirs = [
    "C:\\Program Files\\Java",
    "C:\\Program Files (x86)\\Java",
    "C:\\Program Files\\Eclipse Adoptium",
    "C:\\Program Files\\Amazon Corretto"
  ];
  for (const baseDir of commonJavaDirs) {
    if (fs.existsSync(baseDir)) {
      try {
        const jdks = fs.readdirSync(baseDir);
        for (const jdk of jdks) {
          const binPath = path.join(baseDir, jdk, "bin");
          const javacPath = path.join(binPath, "javac.exe");
          const javaPath = path.join(binPath, "java.exe");
          if (fs.existsSync(javacPath) && fs.existsSync(javaPath)) {
            defaultJavac = javacPath;
            defaultJava = javaPath;
            break;
          }
        }
      } catch (e) {}
    }
  }
}

// Async function to ping and determine docker availability
const initDocker = async () => {
  try {
    await docker.ping();
    isDockerAvailable = true;
    console.log("🐳 Docker daemon connected successfully. Sandbox execution active.");
  } catch (err) {
    console.warn("⚠️ Docker daemon offline/unavailable. Falling back to local execution.");
    isDockerAvailable = false;
  }
};

// Start docker detection
initDocker();

// Language configurations for containerized and local fallback executions
const LANGUAGE_CONFIGS = {
  javascript: {
    image: "node:22-alpine",
    fileName: "solution.js",
    cmd: ["node", "/app/solution.js"],
    localCmd: "node",
    localArgs: []
  },
  typescript: {
    image: "node:22-alpine",
    fileName: "solution.ts",
    cmd: ["npx", "tsx", "/app/solution.ts"],
    localCmd: "node",
    localArgs: ["--experimental-strip-types"]
  },
  python: {
    image: "python:3.12-alpine",
    fileName: "solution.py",
    cmd: ["python", "/app/solution.py"],
    localCmd: "python",
    localArgs: []
  },
  cpp: {
    image: "gcc:14-alpine",
    fileName: "solution.cpp",
    compileCmd: "g++",
    compileArgs: ["-O3", "-std=c++23", "-o"],
    cmd: ["/app/solution"],
    localCmd: "g++",
    binaryName: process.platform === "win32" ? "solution.exe" : "solution"
  },
  c: {
    image: "gcc:14-alpine",
    fileName: "solution.c",
    compileCmd: "gcc",
    compileArgs: ["-O3", "-std=c17", "-o"],
    cmd: ["/app/solution"],
    localCmd: "gcc",
    binaryName: process.platform === "win32" ? "solution.exe" : "solution"
  },
  java: {
    image: "eclipse-temurin:21-alpine",
    fileName: "Main.java",
    compileCmd: defaultJavac,
    compileArgs: [],
    cmd: ["java", "-cp", "/app", "Main"],
    localCmd: defaultJavac,
    execCmd: defaultJava,
    execArgs: ["-cp", ".", "Main"]
  },
  go: {
    image: "golang:1.23-alpine",
    fileName: "main.go",
    cmd: ["go", "run", "/app/main.go"],
    localCmd: "go",
    localArgs: ["run"]
  },
  rust: {
    image: "rust:1.80-alpine",
    fileName: "main.rs",
    compileCmd: "rustc",
    compileArgs: ["-O", "-o"],
    cmd: ["/app/main"],
    localCmd: "rustc",
    binaryName: process.platform === "win32" ? "main.exe" : "main"
  }
};

/**
 * Automatically injects driver harness if user writes pure LeetCode class/function
 */
const prepareExecutableCode = (language, code) => {
  if (!code) return "";

  // JavaScript / TypeScript
  if (language === "javascript" || language === "typescript") {
    if (!code.includes("readFileSync") && !code.includes("process.stdin")) {
      return `${code}

// --- CodeForge LeetCode Driver Harness ---
(function() {
  const __fs = require('fs');
  let __input = "";
  try {
    __input = __fs.readFileSync(0, 'utf-8');
  } catch (e) {
    __input = "";
  }
  const __raw = __input;
  const __trimmed = __input.trim();
  const __lines = __trimmed.length > 0 ? __trimmed.split('\\n').map(l => l.trim()) : [];

  function __formatOutput(res, fallbackInput) {
    if (res === undefined || res === null) {
      if (fallbackInput !== undefined) return __formatOutput(fallbackInput);
      return "";
    }
    if (typeof res === 'boolean') {
      return res ? "true" : "false";
    }
    if (Array.isArray(res)) {
      if (res.length > 0 && Array.isArray(res[0])) {
        return res.map(row => Array.isArray(row) ? row.join(' ') : String(row)).join('\\n');
      }
      return res.join(' ');
    }
    if (typeof res === 'object') {
      return JSON.stringify(res);
    }
    return String(res);
  }

  function __parseNums(str) {
    if (!str) return [];
    const matches = str.match(/-?\\d+(?:\\.\\d+)?/g);
    return matches ? matches.map(Number) : [];
  }

  const __solObj = (typeof Solution !== 'undefined') ? (typeof Solution === 'function' ? (Solution.prototype && Object.getOwnPropertyNames(Solution.prototype).length > 1 ? new Solution() : Solution) : Solution) : null;

  function __findFn(name) {
    if (typeof globalThis[name] === 'function') return globalThis[name];
    if (typeof eval !== 'undefined') {
      try {
        const fn = eval(name);
        if (typeof fn === 'function') return fn;
      } catch (e) {}
    }
    if (__solObj && typeof __solObj[name] === 'function') return __solObj[name].bind(__solObj);
    return null;
  }

  const __twoSumFn = __findFn('twoSum');
  const __isPalindromeFn = __findFn('isPalindrome');
  const __lengthOfLongestSubstringFn = __findFn('lengthOfLongestSubstring');
  const __climbStairsFn = __findFn('climbStairs');
  const __trapFn = __findFn('trap');
  const __solveFn = __findFn('solve');

  if (__twoSumFn) {
    let nums = [];
    let target = 0;
    if (__lines.length >= 2) {
      const nums1 = __parseNums(__lines[0]);
      const nums2 = __parseNums(__lines[1]);
      if (nums1.length === 1 && nums2.length > 1) {
        target = nums1[0];
        nums = nums2;
      } else if (nums2.length === 1 && nums1.length > 1) {
        target = nums2[0];
        nums = nums1;
      } else if (nums1.length === 1 && nums2.length === 1) {
        target = nums1[0];
        nums = nums2;
      } else {
        nums = nums1;
        target = nums2[0] || 0;
      }
    } else if (__lines.length === 1) {
      const allNums = __parseNums(__lines[0]);
      if (allNums.length >= 2) {
        target = allNums[allNums.length - 1];
        nums = allNums.slice(0, allNums.length - 1);
      }
    }
    const res = __twoSumFn(nums, target);
    const sorted = Array.isArray(res) ? res.slice().sort((a, b) => a - b) : res;
    console.log(__formatOutput(sorted));
    return;
  }

  if (__isPalindromeFn) {
    console.log(__formatOutput(__isPalindromeFn(__raw.replace(/\\r\\n/g, '\\n').replace(/\\n$/, ''))));
    return;
  }

  if (__lengthOfLongestSubstringFn) {
    console.log(__formatOutput(__lengthOfLongestSubstringFn(__trimmed)));
    return;
  }

  if (__climbStairsFn) {
    const n = parseInt(__trimmed) || 0;
    console.log(__formatOutput(__climbStairsFn(n)));
    return;
  }

  if (__trapFn) {
    const nums = __parseNums(__trimmed);
    console.log(__formatOutput(__trapFn(nums)));
    return;
  }

  if (__solveFn) {
    const res = __solveFn(__raw.replace(/\\r\\n/g, '\\n'));
    console.log(__formatOutput(res));
    return;
  }

  // Generic function detector on Solution class or global scope
  if (__solObj) {
    const proto = Object.getPrototypeOf(__solObj);
    const methods = proto ? Object.getOwnPropertyNames(proto).filter(m => m !== 'constructor' && typeof __solObj[m] === 'function') : [];
    if (methods.length > 0) {
      const mName = methods[0];
      const fn = __solObj[mName].bind(__solObj);
      const res = fn(__raw.replace(/\\r\\n/g, '\\n'));
      console.log(__formatOutput(res));
      return;
    }
  }
})();
`;
    }
  }

  // Python
  if (language === "python") {
    if (!code.includes("sys.stdin") && !code.includes("input(")) {
      return `${code}

# --- CodeForge LeetCode Driver Harness ---
import sys
import re
import json

def __format_output(res, fallback=None):
    if res is None:
        if fallback is not None:
            return __format_output(fallback)
        return ""
    if isinstance(res, bool):
        return "true" if res else "false"
    if isinstance(res, (list, tuple)):
        if len(res) > 0 and isinstance(res[0], (list, tuple)):
            return "\\n".join(" ".join(str(x) for x in row) for row in res)
        return " ".join(str(x) for x in res)
    if isinstance(res, float):
        if res.is_integer():
            return str(int(res))
        return f"{res:.5f}".rstrip('0').rstrip('.') if False else str(res)
    return str(res)

def __parse_nums(s):
    if not s:
        return []
    return [int(x) if '.' not in x else float(x) for x in re.findall(r'-?\\d+(?:\\.\\d+)?', s)]

if __name__ == '__main__':
    __raw = sys.stdin.read()
    __trimmed = __raw.strip()
    __lines = [l.strip() for l in __trimmed.split('\\n') if l.strip()] if __trimmed else []
    __sol = Solution() if 'Solution' in globals() else None

    # 1. Two Sum
    if (__sol and hasattr(__sol, 'twoSum')) or 'twoSum' in globals():
        __fn = getattr(__sol, 'twoSum', None) or globals().get('twoSum')
        nums = []
        target = 0
        if len(__lines) >= 2:
            n1 = __parse_nums(__lines[0])
            n2 = __parse_nums(__lines[1])
            if len(n1) == 1 and len(n2) > 1:
                target = int(n1[0])
                nums = [int(x) for x in n2]
            elif len(n2) == 1 and len(n1) > 1:
                target = int(n2[0])
                nums = [int(x) for x in n1]
            elif len(n1) == 1 and len(n2) == 1:
                target = int(n1[0])
                nums = [int(n2[0])]
            else:
                nums = [int(x) for x in n1]
                target = int(n2[0]) if n2 else 0
        elif len(__lines) == 1:
            all_n = __parse_nums(__lines[0])
            if len(all_n) >= 2:
                target = int(all_n[-1])
                nums = [int(x) for x in all_n[:-1]]
        res = __fn(nums, target)
        if isinstance(res, (list, tuple)):
            res = sorted(list(res))
        print(__format_output(res))

    # 2. Palindrome
    elif (__sol and hasattr(__sol, 'isPalindrome')) or 'isPalindrome' in globals():
        __fn = getattr(__sol, 'isPalindrome', None) or globals().get('isPalindrome')
        arg = __raw.rstrip('\\r\\n')
        print(__format_output(__fn(arg)))

    # 3. Longest Substring
    elif (__sol and hasattr(__sol, 'lengthOfLongestSubstring')) or 'lengthOfLongestSubstring' in globals():
        __fn = getattr(__sol, 'lengthOfLongestSubstring', None) or globals().get('lengthOfLongestSubstring')
        print(__format_output(__fn(__trimmed)))

    # 4. Climbing Stairs
    elif (__sol and hasattr(__sol, 'climbStairs')) or 'climbStairs' in globals():
        __fn = getattr(__sol, 'climbStairs', None) or globals().get('climbStairs')
        n = int(__parse_nums(__trimmed)[0]) if __parse_nums(__trimmed) else 0
        print(__format_output(__fn(n)))

    # 5. Trapping Rain Water
    elif (__sol and hasattr(__sol, 'trap')) or 'trap' in globals():
        __fn = getattr(__sol, 'trap', None) or globals().get('trap')
        heights = [int(x) for x in __parse_nums(__trimmed)]
        print(__format_output(__fn(heights)))

    # 6. Generic Solve
    elif (__sol and hasattr(__sol, 'solve')) or 'solve' in globals():
        __fn = getattr(__sol, 'solve', None) or globals().get('solve')
        print(__format_output(__fn(__raw)))

    # 7. Any other method on Solution
    elif __sol:
        methods = [m for m in dir(__sol) if not m.startswith('_') and callable(getattr(__sol, m))]
        if methods:
            __fn = getattr(__sol, methods[0])
            print(__format_output(__fn(__raw)))
`;
    }
  }

  // Java
  if (language === "java") {
    if (!code.includes("public class Main") && !code.includes("BufferedReader") && !code.includes("Scanner")) {
      return `import java.util.*;
import java.io.*;
import java.util.regex.*;
import java.util.stream.*;

${code}

public class Main {
    private static List<Integer> parseNums(String s) {
        List<Integer> list = new ArrayList<>();
        if (s == null || s.isEmpty()) return list;
        Matcher m = Pattern.compile("-?\\\\d+").matcher(s);
        while (m.find()) {
            try {
                list.add(Integer.parseInt(m.group()));
            } catch (Exception ignored) {}
        }
        return list;
    }

    private static String formatOutput(Object res) {
        if (res == null) return "";
        if (res instanceof boolean[]) {
            boolean[] arr = (boolean[]) res;
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < arr.length; i++) sb.append(arr[i]).append(i == arr.length - 1 ? "" : " ");
            return sb.toString();
        }
        if (res instanceof int[]) {
            int[] arr = (int[]) res;
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < arr.length; i++) sb.append(arr[i]).append(i == arr.length - 1 ? "" : " ");
            return sb.toString();
        }
        if (res instanceof long[]) {
            long[] arr = (long[]) res;
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < arr.length; i++) sb.append(arr[i]).append(i == arr.length - 1 ? "" : " ");
            return sb.toString();
        }
        if (res instanceof int[][]) {
            int[][] mat = (int[][]) res;
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < mat.length; i++) {
                for (int j = 0; j < mat[i].length; j++) {
                    sb.append(mat[i][j]).append(j == mat[i].length - 1 ? "" : " ");
                }
                if (i < mat.length - 1) sb.append("\\n");
            }
            return sb.toString();
        }
        if (res instanceof List) {
            List<?> list = (List<?>) res;
            return list.stream().map(Object::toString).collect(Collectors.joining(" "));
        }
        if (res instanceof Boolean) {
            return (Boolean) res ? "true" : "false";
        }
        return res.toString();
    }

    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringBuilder sb = new StringBuilder();
        List<String> lines = new ArrayList<>();
        String line;
        while ((line = br.readLine()) != null) {
            lines.add(line);
            sb.append(line).append("\n");
        }
        String rawInput = sb.toString();
        String trimmed = rawInput.trim();

        Solution sol = new Solution();
        java.lang.reflect.Method[] allMethods = Solution.class.getDeclaredMethods();
        List<java.lang.reflect.Method> methods = new ArrayList<>();
        for (java.lang.reflect.Method m : allMethods) {
            if (!m.isSynthetic() && !m.getName().startsWith("$") && !m.getName().equals("main")) {
                methods.add(m);
            }
        }

        for (java.lang.reflect.Method target : methods) {
            Class<?>[] pTypes = target.getParameterTypes();
            Object res = null;

            try {
                if (pTypes.length == 0) {
                    res = target.invoke(sol);
                } else if (pTypes.length == 1) {
                    if (pTypes[0] == String.class) {
                        res = target.invoke(sol, rawInput.replaceAll("\\r\\n", "\n").replaceAll("\n$", ""));
                    } else if (pTypes[0] == int.class || pTypes[0] == Integer.class) {
                        List<Integer> nums = parseNums(trimmed);
                        res = target.invoke(sol, nums.isEmpty() ? 0 : nums.get(0));
                    } else if (pTypes[0] == int[].class) {
                        List<Integer> nums = parseNums(trimmed);
                        int[] arr = nums.stream().mapToInt(i -> i).toArray();
                        res = target.invoke(sol, arr);
                    } else if (pTypes[0] == long[].class) {
                        List<Integer> nums = parseNums(trimmed);
                        long[] arr = nums.stream().mapToLong(i -> i).toArray();
                        res = target.invoke(sol, arr);
                    } else if (pTypes[0] == char[].class) {
                        res = target.invoke(sol, trimmed.toCharArray());
                    } else {
                        res = target.invoke(sol, rawInput);
                    }
                } else if (pTypes.length == 2) {
                    if ((pTypes[0] == int.class || pTypes[0] == Integer.class) && (pTypes[1] == int.class || pTypes[1] == Integer.class)) {
                        List<Integer> nums = parseNums(trimmed);
                        int a = nums.size() > 0 ? nums.get(0) : 0;
                        int b = nums.size() > 1 ? nums.get(1) : 0;
                        res = target.invoke(sol, a, b);
                    } else if (pTypes[0] == int[].class && (pTypes[1] == int.class || pTypes[1] == Integer.class)) {
                        int[] nums = new int[0];
                        int t = 0;
                        if (lines.size() >= 2) {
                            List<Integer> n1 = parseNums(lines.get(0));
                            List<Integer> n2 = parseNums(lines.get(1));
                            if (n1.size() == 1 && n2.size() > 1) {
                                t = n1.get(0);
                                nums = n2.stream().mapToInt(i -> i).toArray();
                            } else if (n2.size() == 1 && n1.size() > 1) {
                                t = n2.get(0);
                                nums = n1.stream().mapToInt(i -> i).toArray();
                            } else {
                                nums = n1.stream().mapToInt(i -> i).toArray();
                                t = n2.isEmpty() ? 0 : n2.get(0);
                            }
                        } else if (lines.size() == 1) {
                            List<Integer> all = parseNums(lines.get(0));
                            if (all.size() >= 2) {
                                t = all.get(all.size() - 1);
                                nums = all.subList(0, all.size() - 1).stream().mapToInt(i -> i).toArray();
                            }
                        }
                        res = target.invoke(sol, nums, t);
                    } else if (pTypes[0] == String.class && pTypes[1] == String.class) {
                        String s1 = lines.size() > 0 ? lines.get(0) : "";
                        String s2 = lines.size() > 1 ? lines.get(1) : "";
                        res = target.invoke(sol, s1, s2);
                    } else {
                        res = target.invoke(sol, rawInput, trimmed);
                    }
                }

                if (res != null) {
                    if (res instanceof int[]) {
                        int[] arr = (int[]) res;
                        if (target.getName().equals("twoSum") && arr.length >= 2) {
                            Arrays.sort(arr);
                        }
                    }
                    System.out.println(formatOutput(res));
                    return;
                }
            } catch (Exception e) {
                // Continue to try next method if multiple defined
            }
        }
    }
}
`;
    }
  }

  // C++
  if (language === "cpp") {
    if (!code.includes("int main(") && !code.includes("cin >>")) {
      return `#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
#include <unordered_map>
#include <cctype>
#include <regex>

using namespace std;

${code}

static vector<int> parseNums(const string& s) {
    vector<int> res;
    regex r(R"(-?\\d+)");
    auto it = sregex_iterator(s.begin(), s.end(), r);
    auto end = sregex_iterator();
    for (; it != end; ++it) {
        try {
            res.push_back(stoi(it->str()));
        } catch (...) {}
    }
    return res;
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    string rawInput, line;
    vector<string> lines;
    while (getline(cin, line)) {
        lines.push_back(line);
        rawInput += line + "\\n";
    }

    Solution sol;

    // Check twoSum
    if (lines.size() >= 2) {
        auto n1 = parseNums(lines[0]);
        auto n2 = parseNums(lines[1]);
        vector<int> nums;
        int target = 0;
        if (n1.size() == 1 && n2.size() > 1) {
            target = n1[0];
            nums = n2;
        } else if (n2.size() == 1 && n1.size() > 1) {
            target = n2[0];
            nums = n1;
        } else if (n1.size() > 1 && n2.size() >= 1) {
            nums = n1;
            target = n2[0];
        }
        if (!nums.empty()) {
            try {
                auto res = sol.twoSum(nums, target);
                if (res.size() >= 2) {
                    if (res[0] > res[1]) swap(res[0], res[1]);
                    cout << res[0] << " " << res[1] << "\\n";
                    return 0;
                }
            } catch (...) {}
        }
    }

    // Single line methods or solve
    if (!lines.empty()) {
        string first = lines[0];
        auto p = parseNums(first);
        if (p.size() == 1) {
            try {
                cout << sol.climbStairs(p[0]) << "\\n";
                return 0;
            } catch (...) {}
        } else if (p.size() > 1) {
            try {
                cout << sol.trap(p) << "\\n";
                return 0;
            } catch (...) {}
        }
        try {
            cout << (sol.isPalindrome(first) ? "true" : "false") << "\\n";
            return 0;
        } catch (...) {}
        try {
            cout << sol.lengthOfLongestSubstring(first) << "\\n";
            return 0;
        } catch (...) {}
    }

    try {
        cout << sol.solve(rawInput) << "\\n";
        return 0;
    } catch (...) {}

    return 0;
}
`;
    }
  }

  // C
  if (language === "c") {
    if (!code.includes("int main(")) {
      return `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <ctype.h>

${code}

int main() {
    char buffer[65536];
    int bytes = fread(buffer, 1, sizeof(buffer) - 1, stdin);
    buffer[bytes] = '\\0';
    return 0;
}
`;
    }
  }

  // Go
  if (language === "go") {
    if (!code.includes("package main")) {
      return `package main

import (
    "fmt"
    "io"
    "os"
    "strings"
)

${code}

func main() {
    bytes, _ := io.ReadAll(os.Stdin)
    input := string(bytes)
    _ = input
}
`;
    }
  }

  // Rust
  if (language === "rust") {
    if (!code.includes("fn main(")) {
      return `use std::io::{self, Read};

${code}

fn main() {
    let mut buffer = String::new();
    let _ = io::stdin().read_to_string(&mut buffer);
}
`;
    }
  }

  return code;
};

/**
 * Standardize output line endings and trim whitespace
 */
const sanitizeOutput = (str) => {
  if (!str) return "";
  return str
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map(line => line.trimEnd())
    .join("\n")
    .trim();
};

/**
 * Runs code using local child_process execution fallback
 */
const runLocally = (config, code, input, timeLimit, language) => {
  return new Promise((resolve) => {
    const executableCode = prepareExecutableCode(language, code);

    const tempDir = path.join(__dirname, "../../temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const runId = crypto.randomUUID();
    const hostFileDir = path.join(tempDir, runId);
    fs.mkdirSync(hostFileDir, { recursive: true });

    const filePath = path.join(hostFileDir, config.fileName);
    fs.writeFileSync(filePath, executableCode);

    const cleanup = () => {
      try {
        fs.rmSync(hostFileDir, { recursive: true, force: true });
      } catch (fsErr) {
        console.error("Failed to delete local temp file:", fsErr.message);
      }
    };

    // Helper for executing the runnable process
    const executeProcess = (execCmd, execArgs) => {
      const startTime = performance.now();
      const child = execFile(
        execCmd,
        execArgs,
        { timeout: timeLimit, cwd: hostFileDir },
        (error, stdout, stderr) => {
          const endTime = performance.now();
          const executionTime = Math.round(endTime - startTime);
          cleanup();

          if (error) {
            if (error.killed || error.code === "ETIMEDOUT") {
              return resolve({
                status: "Time Limit Exceeded",
                executionTime: timeLimit,
                memoryUsed: 0,
                errorOutput: "Time limit exceeded"
              });
            }
            return resolve({
              status: "RunTime Error",
              executionTime,
              memoryUsed: 0,
              errorOutput: stderr || error.message
            });
          }

          if (stderr && stderr.trim()) {
            return resolve({
              status: "RunTime Error",
              executionTime,
              memoryUsed: 0,
              errorOutput: stderr
            });
          }

          return resolve({
            status: "Success",
            executionTime,
            stdout: stdout
          });
        }
      );

      if (child.stdin) {
        if (input !== undefined && input !== null && input !== "") {
          child.stdin.write(input);
        }
        child.stdin.end();
      }
    };

    // If language requires compilation (C++, C, Java, Rust)
    if (config.compileCmd) {
      let compileArgs = [];
      if (config.binaryName) {
        compileArgs = [...config.compileArgs, config.binaryName, config.fileName];
      } else {
        compileArgs = [...config.compileArgs, config.fileName];
      }

      execFile(config.compileCmd, compileArgs, { cwd: hostFileDir }, (compErr, compStdout, compStderr) => {
        if (compErr || (compStderr && compStderr.includes("error:"))) {
          cleanup();
          return resolve({
            status: "Compilation Error",
            executionTime: 0,
            memoryUsed: 0,
            errorOutput: compStderr || compErr?.message || "Compilation failed"
          });
        }

        if (config.execCmd) {
          // Java
          executeProcess(config.execCmd, config.execArgs || ["Main"]);
        } else {
          // C, C++, Rust executable
          const localBin = path.join(hostFileDir, config.binaryName);
          executeProcess(localBin, []);
        }
      });
    } else {
      // Interpreted / Script languages
      const args = [...(config.localArgs || []), config.fileName];
      executeProcess(config.localCmd, args);
    }
  });
};

/**
 * Runs code inside an isolated Docker container
 */
const runInDocker = async (config, code, input, timeLimit, memoryLimit) => {
  const tempDir = path.join(__dirname, "../../temp");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const runId = crypto.randomUUID();
  const hostFileDir = path.join(tempDir, runId);
  fs.mkdirSync(hostFileDir, { recursive: true });

  const hostFilePath = path.join(hostFileDir, config.fileName);
  fs.writeFileSync(hostFilePath, code);

  // Resolve absolute path for volume binding
  const absoluteHostPath = path.resolve(hostFilePath);
  const volumeBind = `${absoluteHostPath}:/app/${config.fileName}:ro`;

  let container = null;
  let isTimedOut = false;
  let timeoutId = null;

  try {
    container = await docker.createContainer({
      Image: config.image,
      Cmd: config.cmd,
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      OpenStdin: true,
      StdinOnce: true,
      NetworkDisabled: true,
      HostConfig: {
        Binds: [volumeBind],
        Memory: memoryLimit * 1024 * 1024, // Convert MB to Bytes
        NanoCpus: 500000000 // 0.5 CPU core limit
      }
    });

    const stream = await container.attach({
      stream: true,
      stdin: true,
      stdout: true,
      stderr: true
    });

    const stdoutChunks = [];
    const stderrChunks = [];

    const stdoutStream = new Writable({
      write(chunk, encoding, callback) {
        stdoutChunks.push(chunk);
        callback();
      }
    });

    const stderrStream = new Writable({
      write(chunk, encoding, callback) {
        stderrChunks.push(chunk);
        callback();
      }
    });

    container.modem.demuxStream(stream, stdoutStream, stderrStream);

    const startTime = performance.now();
    await container.start();

    if (stream) {
      if (input !== undefined && input !== null && input !== "") {
        stream.write(input);
      }
      stream.end();
    }

    timeoutId = setTimeout(async () => {
      isTimedOut = true;
      try {
        await container.kill();
      } catch (err) {
        // Container might have already exited
      }
    }, timeLimit);

    let exitCode;
    try {
      const waitResult = await container.wait();
      exitCode = waitResult.StatusCode;
    } catch (waitErr) {
      // Container killed due to timeout or error
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }

    const endTime = performance.now();
    const executionTime = Math.round(endTime - startTime);

    // Fetch container memory statistics
    let memoryUsed = 0;
    try {
      const stats = await container.stats({ stream: false });
      if (stats && stats.memory_stats && stats.memory_stats.max_usage) {
        memoryUsed = Math.round(stats.memory_stats.max_usage / 1024); // in KB
      }
    } catch (statsErr) {
      // Ignore stats errors if container already terminated
    }

    const stdoutStr = Buffer.concat(stdoutChunks).toString("utf8");
    const stderrStr = Buffer.concat(stderrChunks).toString("utf8");

    if (isTimedOut) {
      return {
        status: "Time Limit Exceeded",
        executionTime: timeLimit,
        memoryUsed,
        errorOutput: "Time limit exceeded"
      };
    }

    if (exitCode !== 0 || (stderrStr && stderrStr.trim())) {
      return {
        status: "RunTime Error",
        executionTime,
        memoryUsed,
        errorOutput: stderrStr || `Exit code ${exitCode}`
      };
    }

    return {
      status: "Success",
      executionTime,
      memoryUsed,
      stdout: stdoutStr
    };
  } catch (err) {
    console.error("Docker execution framework error:", err.message);
    throw err;
  } finally {
    if (container) {
      try {
        await container.remove({ force: true });
      } catch (remErr) {}
    }
    try {
      fs.rmSync(hostFileDir, { recursive: true, force: true });
    } catch (fsErr) {}
  }
};

/**
 * Main code runner entry point. Evaluates code against a single test case.
 */
const runTestCase = async ({
  code,
  language,
  input,
  expectedOutput,
  timeLimit,
  memoryLimit
}) => {
  const config = LANGUAGE_CONFIGS[language];
  if (!config) {
    return {
      status: "Compilation Error",
      errorOutput: `Unsupported language: ${language}`
    };
  }

  try {
    let result;
    const executableCode = prepareExecutableCode(language, code);
    if (isDockerAvailable) {
      result = await runInDocker(config, executableCode, input, timeLimit, memoryLimit);
    } else {
      result = await runLocally(config, code, input, timeLimit, language);
    }

    if (result.status !== "Success") {
      return result;
    }

    const actualOut = sanitizeOutput(result.stdout);
    const expectedOut = sanitizeOutput(expectedOutput);

    if (actualOut !== expectedOut) {
      return {
        status: "Wrong Answer",
        executionTime: result.executionTime,
        memoryUsed: result.memoryUsed || 0,
        input: input,
        actualOutput: actualOut,
        expectedOutput: expectedOut,
        errorOutput: `Input: ${input}\nExpected: "${expectedOut}"\nGot: "${actualOut}"`
      };
    }

    return {
      status: "Accepted",
      executionTime: result.executionTime,
      memoryUsed: result.memoryUsed || 0,
      actualOutput: actualOut,
      expectedOutput: expectedOut
    };
  } catch (err) {
    return {
      status: "RunTime Error",
      errorOutput: err.message
    };
  }
};

module.exports = {
  runTestCase,
  isDockerAvailable: () => isDockerAvailable,
  prepareExecutableCode,
  sanitizeOutput
};
