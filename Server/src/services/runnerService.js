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
    image: "node:18-alpine",
    fileName: "solution.js",
    cmd: ["node", "/app/solution.js"],
    localCmd: "node",
    localArgs: []
  },
  typescript: {
    image: "node:18-alpine",
    fileName: "solution.ts",
    cmd: ["npx", "tsx", "/app/solution.ts"],
    localCmd: "npx",
    localArgs: ["tsx"]
  },
  python: {
    image: "python:3.10-alpine",
    fileName: "solution.py",
    cmd: ["python", "/app/solution.py"],
    localCmd: "python",
    localArgs: []
  },
  cpp: {
    image: "gcc:12-alpine",
    fileName: "solution.cpp",
    compileCmd: "g++",
    compileArgs: ["-O3", "-o"],
    cmd: ["/app/solution"],
    localCmd: "g++",
    binaryName: process.platform === "win32" ? "solution.exe" : "solution"
  },
  c: {
    image: "gcc:12-alpine",
    fileName: "solution.c",
    compileCmd: "gcc",
    compileArgs: ["-O3", "-o"],
    cmd: ["/app/solution"],
    localCmd: "gcc",
    binaryName: process.platform === "win32" ? "solution.exe" : "solution"
  },
  java: {
    image: "openjdk:17-alpine",
    fileName: "Main.java",
    compileCmd: "javac",
    compileArgs: [],
    cmd: ["java", "-cp", "/app", "Main"],
    localCmd: "javac",
    execCmd: "java",
    execArgs: ["Main"]
  },
  go: {
    image: "golang:1.20-alpine",
    fileName: "main.go",
    cmd: ["go", "run", "/app/main.go"],
    localCmd: "go",
    localArgs: ["run"]
  },
  rust: {
    image: "rust:alpine",
    fileName: "main.rs",
    compileCmd: "rustc",
    compileArgs: ["-o"],
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
    if (!code.includes("readFileSync") && !code.includes("process.stdin") && !code.includes("console.log(solve")) {
      return `${code}

// --- LeetCode Driver Harness ---
const __fs = require('fs');
const __input = __fs.readFileSync(0, 'utf-8').trim();
const __lines = __input.split('\\n').map(l => l.trim()).filter(Boolean);

if (typeof twoSum === 'function') {
  const target = parseInt(__lines[0]);
  const nums = __lines[1].split(/\\s+/).map(Number);
  const res = twoSum(nums, target);
  const sorted = Array.isArray(res) ? res.slice().sort((a, b) => a - b) : res;
  console.log(Array.isArray(sorted) ? sorted.join(' ') : sorted);
} else if (typeof isPalindrome === 'function') {

  console.log(isPalindrome(__input));
} else if (typeof lengthOfLongestSubstring === 'function') {
  console.log(lengthOfLongestSubstring(__input));
} else if (typeof climbStairs === 'function') {
  console.log(climbStairs(parseInt(__input)));
} else if (typeof trap === 'function') {
  const height = __input.split(/\\s+/).map(Number);
  console.log(trap(height));
} else if (typeof solve === 'function') {
  console.log(solve(__input));
}
`;
    }
  }

  // Python
  if (language === "python") {
    if (!code.includes("sys.stdin") && !code.includes("input(")) {
      return `${code}

# --- LeetCode Driver Harness ---
import sys

if __name__ == '__main__':
    __raw = sys.stdin.read().strip()
    __lines = [l.strip() for l in __raw.split('\\n') if l.strip()]
    __sol = Solution() if 'Solution' in globals() else None

    if (__sol and hasattr(__sol, 'twoSum')) or 'twoSum' in globals():
        __fn = getattr(__sol, 'twoSum', None) or globals().get('twoSum')
        __target = int(__lines[0])
        __nums = list(map(int, __lines[1].split()))
        __res = list(__fn(__nums, __target))
        __res.sort()
        print(" ".join(map(str, __res)))
    elif (__sol and hasattr(__sol, 'isPalindrome')) or 'isPalindrome' in globals():

        __fn = getattr(__sol, 'isPalindrome', None) or globals().get('isPalindrome')
        print(str(__fn(__raw)).lower())
    elif (__sol and hasattr(__sol, 'lengthOfLongestSubstring')) or 'lengthOfLongestSubstring' in globals():
        __fn = getattr(__sol, 'lengthOfLongestSubstring', None) or globals().get('lengthOfLongestSubstring')
        print(__fn(__raw))
    elif (__sol and hasattr(__sol, 'climbStairs')) or 'climbStairs' in globals():
        __fn = getattr(__sol, 'climbStairs', None) or globals().get('climbStairs')
        print(__fn(int(__raw)))
    elif (__sol and hasattr(__sol, 'trap')) or 'trap' in globals():
        __fn = getattr(__sol, 'trap', None) or globals().get('trap')
        __nums = list(map(int, __raw.split()))
        print(__fn(__nums))
    elif (__sol and hasattr(__sol, 'solve')) or 'solve' in globals():
        __fn = getattr(__sol, 'solve', None) or globals().get('solve')
        print(__fn(__raw))
`;
    }
  }

  // Java
  if (language === "java") {
    if (!code.includes("public class Main") && !code.includes("BufferedReader") && !code.includes("Scanner")) {
      return `import java.util.*;
import java.io.*;

${code}

public class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        List<String> lines = new ArrayList<>();
        String line;
        while ((line = br.readLine()) != null) {
            lines.add(line.trim());
        }
        if (lines.isEmpty()) return;

        Solution sol = new Solution();
        try {
            for (java.lang.reflect.Method m : Solution.class.getDeclaredMethods()) {
                if (m.getName().equals("twoSum")) {
                    int target = Integer.parseInt(lines.get(0));
                    String[] parts = lines.get(1).split("\\\\s+");
                    int[] nums = new int[parts.length];
                    for (int i = 0; i < parts.length; i++) nums[i] = Integer.parseInt(parts[i]);
                    int[] res = (int[]) m.invoke(sol, nums, target);
                    Arrays.sort(res);
                    System.out.println(res[0] + " " + res[1]);
                    return;

                }
                if (m.getName().equals("isPalindrome")) {
                    String full = String.join("\\n", lines);
                    boolean res = (boolean) m.invoke(sol, full);
                    System.out.println(res);
                    return;
                }
                if (m.getName().equals("lengthOfLongestSubstring")) {
                    String full = String.join("\\n", lines);
                    int res = (int) m.invoke(sol, full);
                    System.out.println(res);
                    return;
                }
                if (m.getName().equals("climbStairs")) {
                    int n = Integer.parseInt(lines.get(0));
                    int res = (int) m.invoke(sol, n);
                    System.out.println(res);
                    return;
                }
                if (m.getName().equals("trap")) {
                    String[] parts = lines.get(0).split("\\\\s+");
                    int[] nums = new int[parts.length];
                    for (int i = 0; i < parts.length; i++) nums[i] = Integer.parseInt(parts[i]);
                    int res = (int) m.invoke(sol, nums);
                    System.out.println(res);
                    return;
                }
                if (m.getName().equals("solve")) {
                    String full = String.join("\\n", lines);
                    Object res = m.invoke(sol, full);
                    System.out.println(res);
                    return;
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
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

using namespace std;

${code}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    Solution sol;
    string line1, line2;
    if (getline(cin, line1)) {
        if (getline(cin, line2)) {
            try {
                int target = stoi(line1);
                stringstream ss(line2);
                vector<int> nums;
                int x;
                while (ss >> x) nums.push_back(x);
                auto res = sol.twoSum(nums, target);
                if (res.size() >= 2) {
                    if (res[0] > res[1]) swap(res[0], res[1]);
                    cout << res[0] << " " << res[1] << "\\n";
                }
                return 0;

            } catch (...) {}
        } else {
            stringstream ss(line1);
            vector<int> nums;
            int x;
            while (ss >> x) nums.push_back(x);
            
            if (nums.size() == 1) {
                try {
                    cout << sol.climbStairs(nums[0]) << "\\n";
                    return 0;
                } catch (...) {}
            } else if (nums.size() > 1) {
                try {
                    cout << sol.trap(nums) << "\\n";
                    return 0;
                } catch (...) {}
            }
            try {
                cout << (sol.isPalindrome(line1) ? "true" : "false") << "\\n";
                return 0;
            } catch (...) {}
            try {
                cout << sol.lengthOfLongestSubstring(line1) << "\\n";
                return 0;
            } catch (...) {}
        }
    }
    return 0;
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
  return str.replace(/\r\n/g, "\n").trim();
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

      if (input && child.stdin) {
        child.stdin.write(input);
        child.stdin.end();
      }
    };

    // If language requires compilation (C++, C, Java, Rust)
    if (config.compileCmd) {
      let compileArgs = [];
      if (config.binaryName) {
        const binPath = path.join(hostFileDir, config.binaryName);
        compileArgs = [...config.compileArgs, binPath, filePath];
      } else {
        compileArgs = [...config.compileArgs, filePath];
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
          const binPath = path.join(hostFileDir, config.binaryName);
          executeProcess(binPath, []);
        }
      });
    } else {
      // Interpreted / Script languages
      const args = [...(config.localArgs || []), filePath];
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

    if (input) {
      stream.write(input);
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
  isDockerAvailable: () => isDockerAvailable
};

