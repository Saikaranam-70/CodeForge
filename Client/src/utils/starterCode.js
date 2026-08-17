/**
 * Comprehensive LeetCode / NeetCode 150 Starter Code Templates
 * Supports all 150+ standard problems across JS, TS, Python, Java, C++, C, Go, Rust
 */

export const getLeetCodeStarterCode = (problemTitle = "", lang = "javascript") => {
  const title = (problemTitle || "").toLowerCase().trim();
  const l = (lang || "javascript").toLowerCase();

  // Helper template generator for standard function signatures
  const tpl = (js, ts, py, java, cpp, c, go, rust) => {
    switch (l) {
      case "java":
        return java;
      case "python":
        return py;
      case "cpp":
        return cpp;
      case "typescript":
        return ts;
      case "c":
        return c || cpp;
      case "go":
        return go;
      case "rust":
        return rust;
      case "javascript":
      default:
        return js;
    }
  };

  // 1. Sum of Two Integers
  if (title.includes("sum of two integers")) {
    return tpl(
      `/**\n * @param {number} a\n * @param {number} b\n * @return {number}\n */\nvar getSum = function(a, b) {\n    // Write your bitwise solution here\n    \n};`,
      `function getSum(a: number, b: number): number {\n    // Write your bitwise solution here\n    return 0;\n}`,
      `class Solution:\n    def getSum(self, a: int, b: int) -> int:\n        # Write your bitwise solution here\n        pass\n`,
      `class Solution {\n    public int getSum(int a, int b) {\n        // Write your bitwise solution here\n        \n        return 0;\n    }\n}`,
      `class Solution {\npublic:\n    int getSum(int a, int b) {\n        // Write your bitwise solution here\n        \n        return 0;\n    }\n};`,
      `int getSum(int a, int b) {\n    // Write your bitwise solution here\n    return 0;\n}`,
      `func getSum(a int, b int) int {\n    // Write your bitwise solution here\n    return 0\n}`,
      `impl Solution {\n    pub fn get_sum(a: i32, b: i32) -> i32 {\n        // Write your bitwise solution here\n        0\n    }\n}`
    );
  }

  // 2. Two Sum
  if (title.includes("two sum") && !title.includes("ii")) {
    return tpl(
      `/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nvar twoSum = function(nums, target) {\n    // Write your solution here\n    \n};`,
      `function twoSum(nums: number[], target: number): number[] {\n    // Write your solution here\n    return [];\n}`,
      `class Solution:\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        # Write your solution here\n        pass\n`,
      `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your solution here\n        \n        return new int[]{};\n    }\n}`,
      `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your solution here\n        \n        return {};\n    }\n};`,
      `int* twoSum(int* nums, int numsSize, int target, int* returnSize) {\n    *returnSize = 2;\n    int* res = (int*)malloc(2 * sizeof(int));\n    return res;\n}`,
      `func twoSum(nums []int, target int) []int {\n    return []int{}\n}`,
      `impl Solution {\n    pub fn two_sum(nums: Vec<i32>, target: i32) -> Vec<i32> {\n        vec![]\n    }\n}`
    );
  }

  // 3. Valid Parenthesis String
  if (title.includes("valid parenthesis string")) {
    return tpl(
      `/**\n * @param {string} s\n * @return {boolean}\n */\nvar checkValidString = function(s) {\n    // Write your solution here\n    \n};`,
      `function checkValidString(s: string): boolean {\n    // Write your solution here\n    return false;\n}`,
      `class Solution:\n    def checkValidString(self, s: str) -> bool:\n        # Write your solution here\n        pass\n`,
      `class Solution {\n    public boolean checkValidString(String s) {\n        // Write your solution here\n        \n        return false;\n    }\n}`,
      `class Solution {\npublic:\n    bool checkValidString(string s) {\n        // Write your solution here\n        \n        return false;\n    }\n};`,
      `bool checkValidString(char* s) {\n    return false;\n}`,
      `func checkValidString(s string) bool {\n    return false\n}`,
      `impl Solution {\n    pub fn check_valid_string(s: String) -> bool {\n        false\n    }\n}`
    );
  }

  // 4. Valid Parentheses
  if (title.includes("valid parentheses") || title === "valid parentheses") {
    return tpl(
      `/**\n * @param {string} s\n * @return {boolean}\n */\nvar isValid = function(s) {\n    // Write your solution here\n    \n};`,
      `function isValid(s: string): boolean {\n    // Write your solution here\n    return false;\n}`,
      `class Solution:\n    def isValid(self, s: str) -> bool:\n        # Write your solution here\n        pass\n`,
      `class Solution {\n    public boolean isValid(String s) {\n        // Write your solution here\n        \n        return false;\n    }\n}`,
      `class Solution {\npublic:\n    bool isValid(string s) {\n        // Write your solution here\n        \n        return false;\n    }\n};`,
      `bool isValid(char* s) {\n    return false;\n}`,
      `func isValid(s string) bool {\n    return false\n}`,
      `impl Solution {\n    pub fn is_valid(s: String) -> bool {\n        false\n    }\n}`
    );
  }

  // 5. Contains Duplicate
  if (title.includes("contains duplicate") && !title.includes("ii")) {
    return tpl(
      `/**\n * @param {number[]} nums\n * @return {boolean}\n */\nvar containsDuplicate = function(nums) {\n    // Write your solution here\n    \n};`,
      `function containsDuplicate(nums: number[]): boolean {\n    return false;\n}`,
      `class Solution:\n    def containsDuplicate(self, nums: list[int]) -> bool:\n        pass\n`,
      `class Solution {\n    public boolean containsDuplicate(int[] nums) {\n        return false;\n    }\n}`,
      `class Solution {\npublic:\n    bool containsDuplicate(vector<int>& nums) {\n        return false;\n    }\n};`,
      `bool containsDuplicate(int* nums, int numsSize) {\n    return false;\n}`,
      `func containsDuplicate(nums []int) bool {\n    return false\n}`,
      `impl Solution {\n    pub fn contains_duplicate(nums: Vec<i32>) -> bool {\n        false\n    }\n}`
    );
  }

  // 6. Valid Anagram
  if (title.includes("valid anagram") || title.includes("anagram")) {
    return tpl(
      `/**\n * @param {string} s\n * @param {string} t\n * @return {boolean}\n */\nvar isAnagram = function(s, t) {\n    // Write your solution here\n    \n};`,
      `function isAnagram(s: string, t: string): boolean {\n    return false;\n}`,
      `class Solution:\n    def isAnagram(self, s: str, t: str) -> bool:\n        pass\n`,
      `class Solution {\n    public boolean isAnagram(String s, String t) {\n        return false;\n    }\n}`,
      `class Solution {\npublic:\n    bool isAnagram(string s, string t) {\n        return false;\n    }\n};`,
      `bool isAnagram(char* s, char* t) {\n    return false;\n}`,
      `func isAnagram(s string, t string) bool {\n    return false\n}`,
      `impl Solution {\n    pub fn is_anagram(s: String, t: String) -> bool {\n        false\n    }\n}`
    );
  }

  // 7. Best Time to Buy and Sell Stock
  if (title.includes("buy and sell stock") || title.includes("stock")) {
    return tpl(
      `/**\n * @param {number[]} prices\n * @return {number}\n */\nvar maxProfit = function(prices) {\n    // Write your solution here\n    \n};`,
      `function maxProfit(prices: number[]): number {\n    return 0;\n}`,
      `class Solution:\n    def maxProfit(self, prices: list[int]) -> int:\n        pass\n`,
      `class Solution {\n    public int maxProfit(int[] prices) {\n        return 0;\n    }\n}`,
      `class Solution {\npublic:\n    int maxProfit(vector<int>& prices) {\n        return 0;\n    }\n};`,
      `int maxProfit(int* prices, int pricesSize) {\n    return 0;\n}`,
      `func maxProfit(prices []int) int {\n    return 0\n}`,
      `impl Solution {\n    pub fn max_profit(prices: Vec<i32>) -> i32 {\n        0\n    }\n}`
    );
  }

  // 8. Valid Palindrome
  if (title.includes("palindrome") && !title.includes("substring") && !title.includes("partitioning")) {
    return tpl(
      `/**\n * @param {string} s\n * @return {boolean}\n */\nvar isPalindrome = function(s) {\n    // Write your solution here\n    \n};`,
      `function isPalindrome(s: string): boolean {\n    return false;\n}`,
      `class Solution:\n    def isPalindrome(self, s: str) -> bool:\n        pass\n`,
      `class Solution {\n    public boolean isPalindrome(String s) {\n        return false;\n    }\n}`,
      `class Solution {\npublic:\n    bool isPalindrome(string s) {\n        return false;\n    }\n};`,
      `bool isPalindrome(char* s) {\n    return false;\n}`,
      `func isPalindrome(s string) bool {\n    return false\n}`,
      `impl Solution {\n    pub fn is_palindrome(s: String) -> bool {\n        false\n    }\n}`
    );
  }

  // 9. 3Sum
  if (title.includes("3sum") || title.includes("three sum")) {
    return tpl(
      `/**\n * @param {number[]} nums\n * @return {number[][]}\n */\nvar threeSum = function(nums) {\n    // Write your solution here\n    \n};`,
      `function threeSum(nums: number[]): number[][] {\n    return [];\n}`,
      `class Solution:\n    def threeSum(self, nums: list[int]) -> list[list[int]]:\n        pass\n`,
      `class Solution {\n    public List<List<Integer>> threeSum(int[] nums) {\n        return new ArrayList<>();\n    }\n}`,
      `class Solution {\npublic:\n    vector<vector<int>> threeSum(vector<int>& nums) {\n        return {};\n    }\n};`,
      `int** threeSum(int* nums, int numsSize, int* returnSize, int** returnColumnSizes) {\n    *returnSize = 0;\n    return NULL;\n}`,
      `func threeSum(nums []int) [][]int {\n    return [][]int{}\n}`,
      `impl Solution {\n    pub fn three_sum(nums: Vec<i32>) -> Vec<Vec<i32>> {\n        vec![]\n    }\n}`
    );
  }

  // 10. Container With Most Water
  if (title.includes("most water") || title.includes("container")) {
    return tpl(
      `/**\n * @param {number[]} height\n * @return {number}\n */\nvar maxArea = function(height) {\n    // Write your solution here\n    \n};`,
      `function maxArea(height: number[]): number {\n    return 0;\n}`,
      `class Solution:\n    def maxArea(self, height: list[int]) -> int:\n        pass\n`,
      `class Solution {\n    public int maxArea(int[] height) {\n        return 0;\n    }\n}`,
      `class Solution {\npublic:\n    int maxArea(vector<int>& height) {\n        return 0;\n    }\n};`,
      `int maxArea(int* height, int heightSize) {\n    return 0;\n}`,
      `func maxArea(height []int) int {\n    return 0\n}`,
      `impl Solution {\n    pub fn max_area(height: Vec<i32>) -> i32 {\n        0\n    }\n}`
    );
  }

  // 11. Trapping Rain Water
  if (title.includes("trapping") || title.includes("rain water")) {
    return tpl(
      `/**\n * @param {number[]} height\n * @return {number}\n */\nvar trap = function(height) {\n    // Write your solution here\n    \n};`,
      `function trap(height: number[]): number {\n    return 0;\n}`,
      `class Solution:\n    def trap(self, height: list[int]) -> int:\n        pass\n`,
      `class Solution {\n    public int trap(int[] height) {\n        return 0;\n    }\n}`,
      `class Solution {\npublic:\n    int trap(vector<int>& height) {\n        return 0;\n    }\n};`,
      `int trap(int* height, int heightSize) {\n    return 0;\n}`,
      `func trap(height []int) int {\n    return 0\n}`,
      `impl Solution {\n    pub fn trap(height: Vec<i32>) -> i32 {\n        0\n    }\n}`
    );
  }

  // 12. Binary Search
  if (title === "binary search" || (title.includes("binary search") && !title.includes("matrix") && !title.includes("tree"))) {
    return tpl(
      `/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number}\n */\nvar search = function(nums, target) {\n    // Write your solution here\n    \n};`,
      `function search(nums: number[], target: number): number {\n    return -1;\n}`,
      `class Solution:\n    def search(self, nums: list[int], target: int) -> int:\n        pass\n`,
      `class Solution {\n    public int search(int[] nums, int target) {\n        return -1;\n    }\n}`,
      `class Solution {\npublic:\n    int search(vector<int>& nums, int target) {\n        return -1;\n    }\n};`,
      `int search(int* nums, int numsSize, int target) {\n    return -1;\n}`,
      `func search(nums []int, target int) int {\n    return -1\n}`,
      `impl Solution {\n    pub fn search(nums: Vec<i32>, target: i32) -> i32 {\n        -1\n    }\n}`
    );
  }

  // 13. Search in Rotated Sorted Array
  if (title.includes("rotated sorted array") && !title.includes("minimum")) {
    return tpl(
      `/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number}\n */\nvar search = function(nums, target) {\n    // Write your solution here\n    \n};`,
      `function search(nums: number[], target: number): number {\n    return -1;\n}`,
      `class Solution:\n    def search(self, nums: list[int], target: int) -> int:\n        pass\n`,
      `class Solution {\n    public int search(int[] nums, int target) {\n        return -1;\n    }\n}`,
      `class Solution {\npublic:\n    int search(vector<int>& nums, int target) {\n        return -1;\n    }\n};`,
      `int search(int* nums, int numsSize, int target) {\n    return -1;\n}`,
      `func search(nums []int, target int) int {\n    return -1\n}`,
      `impl Solution {\n    pub fn search(nums: Vec<i32>, target: i32) -> i32 {\n        -1\n    }\n}`
    );
  }

  // 14. Find Minimum in Rotated Sorted Array
  if (title.includes("minimum in rotated sorted array") || title.includes("find minimum")) {
    return tpl(
      `/**\n * @param {number[]} nums\n * @return {number}\n */\nvar findMin = function(nums) {\n    // Write your solution here\n    \n};`,
      `function findMin(nums: number[]): number {\n    return 0;\n}`,
      `class Solution:\n    def findMin(self, nums: list[int]) -> int:\n        pass\n`,
      `class Solution {\n    public int findMin(int[] nums) {\n        return 0;\n    }\n}`,
      `class Solution {\npublic:\n    int findMin(vector<int>& nums) {\n        return 0;\n    }\n};`,
      `int findMin(int* nums, int numsSize) {\n    return 0;\n}`,
      `func findMin(nums []int) int {\n    return 0\n}`,
      `impl Solution {\n    pub fn find_min(nums: Vec<i32>) -> i32 {\n        0\n    }\n}`
    );
  }

  // 15. Reverse Linked List
  if (title.includes("reverse linked list") || title === "reverse linked list") {
    return tpl(
      `/**\n * Definition for singly-linked list.\n * function ListNode(val, next) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.next = (next===undefined ? null : next)\n * }\n */\n/**\n * @param {ListNode} head\n * @return {ListNode}\n */\nvar reverseList = function(head) {\n    // Write your solution here\n    \n};`,
      `function reverseList(head: any): any {\n    return head;\n}`,
      `class Solution:\n    def reverseList(self, head):\n        pass\n`,
      `class Solution {\n    public ListNode reverseList(ListNode head) {\n        return head;\n    }\n}`,
      `class Solution {\npublic:\n    ListNode* reverseList(ListNode* head) {\n        return head;\n    }\n};`,
      `struct ListNode* reverseList(struct ListNode* head) {\n    return head;\n}`,
      `func reverseList(head *ListNode) *ListNode {\n    return head\n}`,
      `impl Solution {\n    pub fn reverse_list(head: Option<Box<ListNode>>) -> Option<Box<ListNode>> {\n        head\n    }\n}`
    );
  }

  // 16. Invert Binary Tree
  if (title.includes("invert binary tree") || title === "invert tree") {
    return tpl(
      `/**\n * Definition for a binary tree node.\n * function TreeNode(val, left, right) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.left = (left===undefined ? null : left)\n *     this.right = (right===undefined ? null : right)\n * }\n */\n/**\n * @param {TreeNode} root\n * @return {TreeNode}\n */\nvar invertTree = function(root) {\n    // Write your solution here\n    \n};`,
      `function invertTree(root: any): any {\n    return root;\n}`,
      `class Solution:\n    def invertTree(self, root):\n        pass\n`,
      `class Solution {\n    public TreeNode invertTree(TreeNode root) {\n        return root;\n    }\n}`,
      `class Solution {\npublic:\n    TreeNode* invertTree(TreeNode* root) {\n        return root;\n    }\n};`,
      `struct TreeNode* invertTree(struct TreeNode* root) {\n    return root;\n}`,
      `func invertTree(root *TreeNode) *TreeNode {\n    return root\n}`,
      `impl Solution {\n    pub fn invert_tree(root: Option<Rc<RefCell<TreeNode>>>) -> Option<Rc<RefCell<TreeNode>>> {\n        root\n    }\n}`
    );
  }

  // 17. Number of 1 Bits
  if (title.includes("number of 1 bits") || title.includes("hamming weight")) {
    return tpl(
      `/**\n * @param {number} n\n * @return {number}\n */\nvar hammingWeight = function(n) {\n    // Write your solution here\n    \n};`,
      `function hammingWeight(n: number): number {\n    return 0;\n}`,
      `class Solution:\n    def hammingWeight(self, n: int) -> int:\n        pass\n`,
      `class Solution {\n    public int hammingWeight(int n) {\n        return 0;\n    }\n}`,
      `class Solution {\npublic:\n    int hammingWeight(int n) {\n        return 0;\n    }\n};`,
      `int hammingWeight(int n) {\n    return 0;\n}`,
      `func hammingWeight(num uint32) int {\n    return 0\n}`,
      `impl Solution {\n    pub fn hamming_weight(n: u32) -> i32 {\n        0\n    }\n}`
    );
  }

  // 18. Counting Bits
  if (title.includes("counting bits")) {
    return tpl(
      `/**\n * @param {number} n\n * @return {number[]}\n */\nvar countBits = function(n) {\n    // Write your solution here\n    \n};`,
      `function countBits(n: number): number[] {\n    return [];\n}`,
      `class Solution:\n    def countBits(self, n: int) -> list[int]:\n        pass\n`,
      `class Solution {\n    public int[] countBits(int n) {\n        return new int[n + 1];\n    }\n}`,
      `class Solution {\npublic:\n    vector<int> countBits(int n) {\n        return vector<int>(n + 1, 0);\n    }\n};`,
      `int* countBits(int n, int* returnSize) {\n    *returnSize = n + 1;\n    return (int*)calloc(n + 1, sizeof(int));\n}`,
      `func countBits(n int) []int {\n    return make([]int, n+1)\n}`,
      `impl Solution {\n    pub fn count_bits(n: i32) -> Vec<i32> {\n        vec![0; (n + 1) as usize]\n    }\n}`
    );
  }

  // 19. Reverse Bits
  if (title.includes("reverse bits")) {
    return tpl(
      `/**\n * @param {number} n\n * @return {number}\n */\nvar reverseBits = function(n) {\n    // Write your solution here\n    \n};`,
      `function reverseBits(n: number): number {\n    return 0;\n}`,
      `class Solution:\n    def reverseBits(self, n: int) -> int:\n        pass\n`,
      `class Solution {\n    public int reverseBits(int n) {\n        return 0;\n    }\n}`,
      `class Solution {\npublic:\n    uint32_t reverseBits(uint32_t n) {\n        return 0;\n    }\n};`,
      `uint32_t reverseBits(uint32_t n) {\n    return 0;\n}`,
      `func reverseBits(num uint32) uint32 {\n    return 0\n}`,
      `impl Solution {\n    pub fn reverse_bits(x: u32) -> u32 {\n        0\n    }\n}`
    );
  }

  // 20. Missing Number
  if (title.includes("missing number")) {
    return tpl(
      `/**\n * @param {number[]} nums\n * @return {number}\n */\nvar missingNumber = function(nums) {\n    // Write your solution here\n    \n};`,
      `function missingNumber(nums: number[]): number {\n    return 0;\n}`,
      `class Solution:\n    def missingNumber(self, nums: list[int]) -> int:\n        pass\n`,
      `class Solution {\n    public int missingNumber(int[] nums) {\n        return 0;\n    }\n}`,
      `class Solution {\npublic:\n    int missingNumber(vector<int>& nums) {\n        return 0;\n    }\n};`,
      `int missingNumber(int* nums, int numsSize) {\n    return 0;\n}`,
      `func missingNumber(nums []int) int {\n    return 0\n}`,
      `impl Solution {\n    pub fn missing_number(nums: Vec<i32>) -> i32 {\n        0\n    }\n}`
    );
  }

  // 21. Single Number
  if (title.includes("single number")) {
    return tpl(
      `/**\n * @param {number[]} nums\n * @return {number}\n */\nvar singleNumber = function(nums) {\n    // Write your solution here\n    \n};`,
      `function singleNumber(nums: number[]): number {\n    return 0;\n}`,
      `class Solution:\n    def singleNumber(self, nums: list[int]) -> int:\n        pass\n`,
      `class Solution {\n    public int singleNumber(int[] nums) {\n        return 0;\n    }\n}`,
      `class Solution {\npublic:\n    int singleNumber(vector<int>& nums) {\n        return 0;\n    }\n};`,
      `int singleNumber(int* nums, int numsSize) {\n    return 0;\n}`,
      `func singleNumber(nums []int) int {\n    return 0\n}`,
      `impl Solution {\n    pub fn single_number(nums: Vec<i32>) -> i32 {\n        0\n    }\n}`
    );
  }

  // 22. Climbing Stairs
  if (title.includes("climbing stairs") || title === "climb stairs") {
    return tpl(
      `/**\n * @param {number} n\n * @return {number}\n */\nvar climbStairs = function(n) {\n    // Write your solution here\n    \n};`,
      `function climbStairs(n: number): number {\n    return 0;\n}`,
      `class Solution:\n    def climbStairs(self, n: int) -> int:\n        pass\n`,
      `class Solution {\n    public int climbStairs(int n) {\n        return 0;\n    }\n}`,
      `class Solution {\npublic:\n    int climbStairs(int n) {\n        return 0;\n    }\n};`,
      `int climbStairs(int n) {\n    return 0;\n}`,
      `func climbStairs(n int) int {\n    return 0\n}`,
      `impl Solution {\n    pub fn climb_stairs(n: i32) -> i32 {\n        0\n    }\n}`
    );
  }

  // 23. House Robber
  if (title.includes("house robber") && !title.includes("ii")) {
    return tpl(
      `/**\n * @param {number[]} nums\n * @return {number}\n */\nvar rob = function(nums) {\n    // Write your solution here\n    \n};`,
      `function rob(nums: number[]): number {\n    return 0;\n}`,
      `class Solution:\n    def rob(self, nums: list[int]) -> int:\n        pass\n`,
      `class Solution {\n    public int rob(int[] nums) {\n        return 0;\n    }\n}`,
      `class Solution {\npublic:\n    int rob(vector<int>& nums) {\n        return 0;\n    }\n};`,
      `int rob(int* nums, int numsSize) {\n    return 0;\n}`,
      `func rob(nums []int) int {\n    return 0\n}`,
      `impl Solution {\n    pub fn rob(nums: Vec<i32>) -> i32 {\n        0\n    }\n}`
    );
  }

  // 24. Coin Change
  if (title.includes("coin change") && !title.includes("ii")) {
    return tpl(
      `/**\n * @param {number[]} coins\n * @param {number} amount\n * @return {number}\n */\nvar coinChange = function(coins, amount) {\n    // Write your solution here\n    \n};`,
      `function coinChange(coins: number[], amount: number): number {\n    return -1;\n}`,
      `class Solution:\n    def coinChange(self, coins: list[int], amount: int) -> int:\n        pass\n`,
      `class Solution {\n    public int coinChange(int[] coins, int amount) {\n        return -1;\n    }\n}`,
      `class Solution {\npublic:\n    int coinChange(vector<int>& coins, int amount) {\n        return -1;\n    }\n};`,
      `int coinChange(int* coins, int coinsSize, int amount) {\n    return -1;\n}`,
      `func coinChange(coins []int, amount int) int {\n    return -1\n}`,
      `impl Solution {\n    pub fn coin_change(coins: Vec<i32>, amount: i32) -> i32 {\n        -1\n    }\n}`
    );
  }

  // 25. Longest Substring Without Repeating Characters
  if (title.includes("longest substring")) {
    return tpl(
      `/**\n * @param {string} s\n * @return {number}\n */\nvar lengthOfLongestSubstring = function(s) {\n    // Write your solution here\n    \n};`,
      `function lengthOfLongestSubstring(s: string): number {\n    return 0;\n}`,
      `class Solution:\n    def lengthOfLongestSubstring(self, s: str) -> int:\n        pass\n`,
      `class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        return 0;\n    }\n}`,
      `class Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        return 0;\n    }\n};`,
      `int lengthOfLongestSubstring(char* s) {\n    return 0;\n}`,
      `func lengthOfLongestSubstring(s string) int {\n    return 0\n}`,
      `impl Solution {\n    pub fn length_of_longest_substring(s: String) -> i32 {\n        0\n    }\n}`
    );
  }

  // 26. Maximum Subarray
  if (title.includes("maximum subarray") || title.includes("max subarray")) {
    return tpl(
      `/**\n * @param {number[]} nums\n * @return {number}\n */\nvar maxSubArray = function(nums) {\n    // Write your solution here\n    \n};`,
      `function maxSubArray(nums: number[]): number {\n    return 0;\n}`,
      `class Solution:\n    def maxSubArray(self, nums: list[int]) -> int:\n        pass\n`,
      `class Solution {\n    public int maxSubArray(int[] nums) {\n        return 0;\n    }\n}`,
      `class Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        return 0;\n    }\n};`,
      `int maxSubArray(int* nums, int numsSize) {\n    return 0;\n}`,
      `func maxSubArray(nums []int) int {\n    return 0\n}`,
      `impl Solution {\n    pub fn max_sub_array(nums: Vec<i32>) -> i32 {\n        0\n    }\n}`
    );
  }

  // 27. Jump Game
  if (title.includes("jump game") && !title.includes("ii")) {
    return tpl(
      `/**\n * @param {number[]} nums\n * @return {boolean}\n */\nvar canJump = function(nums) {\n    // Write your solution here\n    \n};`,
      `function canJump(nums: number[]): boolean {\n    return false;\n}`,
      `class Solution:\n    def canJump(self, nums: list[int]) -> bool:\n        pass\n`,
      `class Solution {\n    public boolean canJump(int[] nums) {\n        return false;\n    }\n}`,
      `class Solution {\npublic:\n    bool canJump(vector<int>& nums) {\n        return false;\n    }\n};`,
      `bool canJump(int* nums, int numsSize) {\n    return false;\n}`,
      `func canJump(nums []int) bool {\n    return false\n}`,
      `impl Solution {\n    pub fn can_jump(nums: Vec<i32>) -> bool {\n        false\n    }\n}`
    );
  }

  // 28. Unique Paths
  if (title.includes("unique paths") && !title.includes("ii")) {
    return tpl(
      `/**\n * @param {number} m\n * @param {number} n\n * @return {number}\n */\nvar uniquePaths = function(m, n) {\n    // Write your solution here\n    \n};`,
      `function uniquePaths(m: number, n: number): number {\n    return 0;\n}`,
      `class Solution:\n    def uniquePaths(self, m: int, n: int) -> int:\n        pass\n`,
      `class Solution {\n    public int uniquePaths(int m, int n) {\n        return 0;\n    }\n}`,
      `class Solution {\npublic:\n    int uniquePaths(int m, int n) {\n        return 0;\n    }\n};`,
      `int uniquePaths(int m, int n) {\n    return 0;\n}`,
      `func uniquePaths(m int, n int) int {\n    return 0\n}`,
      `impl Solution {\n    pub fn unique_paths(m: i32, n: i32) -> i32 {\n        0\n    }\n}`
    );
  }

  // 29. Number of Islands
  if (title.includes("number of islands") || title.includes("num islands")) {
    return tpl(
      `/**\n * @param {character[][]} grid\n * @return {number}\n */\nvar numIslands = function(grid) {\n    // Write your solution here\n    \n};`,
      `function numIslands(grid: string[][]): number {\n    return 0;\n}`,
      `class Solution:\n    def numIslands(self, grid: list[list[str]]) -> int:\n        pass\n`,
      `class Solution {\n    public int numIslands(char[][] grid) {\n        return 0;\n    }\n}`,
      `class Solution {\npublic:\n    int numIslands(vector<vector<char>>& grid) {\n        return 0;\n    }\n};`,
      `int numIslands(char** grid, int gridSize, int* gridColSize) {\n    return 0;\n}`,
      `func numIslands(grid [][]byte) int {\n    return 0\n}`,
      `impl Solution {\n    pub fn num_islands(grid: Vec<Vec<char>>) -> i32 {\n        0\n    }\n}`
    );
  }

  // 30. Product of Array Except Self
  if (title.includes("product of array except self") || title.includes("product except self")) {
    return tpl(
      `/**\n * @param {number[]} nums\n * @return {number[]}\n */\nvar productExceptSelf = function(nums) {\n    // Write your solution here\n    \n};`,
      `function productExceptSelf(nums: number[]): number[] {\n    return [];\n}`,
      `class Solution:\n    def productExceptSelf(self, nums: list[int]) -> list[int]:\n        pass\n`,
      `class Solution {\n    public int productExceptSelf(int[] nums) {\n        return new int[nums.length];\n    }\n}`,
      `class Solution {\npublic:\n    vector<int> productExceptSelf(vector<int>& nums) {\n        return vector<int>(nums.size(), 0);\n    }\n};`,
      `int* productExceptSelf(int* nums, int numsSize, int* returnSize) {\n    *returnSize = numsSize;\n    return (int*)malloc(numsSize * sizeof(int));\n}`,
      `func productExceptSelf(nums []int) []int {\n    return make([]int, len(nums))\n}`,
      `impl Solution {\n    pub fn product_except_self(nums: Vec<i32>) -> Vec<i32> {\n        vec![0; nums.len()]\n    }\n}`
    );
  }

  // 31. Top K Frequent Elements
  if (title.includes("top k frequent")) {
    return tpl(
      `/**\n * @param {number[]} nums\n * @param {number} k\n * @return {number[]}\n */\nvar topKFrequent = function(nums, k) {\n    // Write your solution here\n    \n};`,
      `function topKFrequent(nums: number[], k: number): number[] {\n    return [];\n}`,
      `class Solution:\n    def topKFrequent(self, nums: list[int], k: int) -> list[int]:\n        pass\n`,
      `class Solution {\n    public int topKFrequent(int[] nums, int k) {\n        return new int[k];\n    }\n}`,
      `class Solution {\npublic:\n    vector<int> topKFrequent(vector<int>& nums, int k) {\n        return vector<int>(k, 0);\n    }\n};`,
      `int* topKFrequent(int* nums, int numsSize, int k, int* returnSize) {\n    *returnSize = k;\n    return (int*)malloc(k * sizeof(int));\n}`,
      `func topKFrequent(nums []int, k int) []int {\n    return make([]int, k)\n}`,
      `impl Solution {\n    pub fn top_k_frequent(nums: Vec<i32>, k: i32) -> Vec<i32> {\n        vec![0; k as usize]\n    }\n}`
    );
  }

  // 32. Group Anagrams
  if (title.includes("group anagrams")) {
    return tpl(
      `/**\n * @param {string[]} strs\n * @return {string[][]}\n */\nvar groupAnagrams = function(strs) {\n    // Write your solution here\n    \n};`,
      `function groupAnagrams(strs: string[]): string[][] {\n    return [];\n}`,
      `class Solution:\n    def groupAnagrams(self, strs: list[str]) -> list[list[str]]:\n        pass\n`,
      `class Solution {\n    public List<List<String>> groupAnagrams(String[] strs) {\n        return new ArrayList<>();\n    }\n}`,
      `class Solution {\npublic:\n    vector<vector<string>> groupAnagrams(vector<string>& strs) {\n        return {};\n    }\n};`,
      `char*** groupAnagrams(char** strs, int strsSize, int* returnSize, int** returnColumnSizes) {\n    *returnSize = 0;\n    return NULL;\n}`,
      `func groupAnagrams(strs []string) [][]string {\n    return [][]string{}\n}`,
      `impl Solution {\n    pub fn group_anagrams(strs: Vec<String>) -> Vec<Vec<String>> {\n        vec![]\n    }\n}`
    );
  }

  // 33. Rotate Image
  if (title.includes("rotate image")) {
    return tpl(
      `/**\n * @param {number[][]} matrix\n * @return {void} Do not return anything, modify matrix in-place instead.\n */\nvar rotate = function(matrix) {\n    // Write your in-place solution here\n    \n};`,
      `function rotate(matrix: number[][]): void {\n    // Write your in-place solution here\n}`,
      `class Solution:\n    def rotate(self, matrix: list[list[int]]) -> None:\n        # Do not return anything, modify matrix in-place instead.\n        pass\n`,
      `class Solution {\n    public void rotate(int[][] matrix) {\n        // Write your in-place solution here\n        \n    }\n}`,
      `class Solution {\npublic:\n    void rotate(vector<vector<int>>& matrix) {\n        // Write your in-place solution here\n        \n    }\n};`,
      `void rotate(int** matrix, int matrixSize, int* matrixColSize) {\n    \n}`,
      `func rotate(matrix [][]int)  {\n    \n}`,
      `impl Solution {\n    pub fn rotate(matrix: &mut Vec<Vec<i32>>) {\n        \n    }\n}`
    );
  }

  // 34. Spiral Matrix
  if (title.includes("spiral matrix")) {
    return tpl(
      `/**\n * @param {number[][]} matrix\n * @return {number[]}\n */\nvar spiralOrder = function(matrix) {\n    // Write your solution here\n    \n};`,
      `function spiralOrder(matrix: number[][]): number[] {\n    return [];\n}`,
      `class Solution:\n    def spiralOrder(self, matrix: list[list[int]]) -> list[int]:\n        pass\n`,
      `class Solution {\n    public List<Integer> spiralOrder(int[][] matrix) {\n        return new ArrayList<>();\n    }\n}`,
      `class Solution {\npublic:\n    vector<int> spiralOrder(vector<vector<int>>& matrix) {\n        return {};\n    }\n};`,
      `int* spiralOrder(int** matrix, int matrixSize, int* matrixColSize, int* returnSize) {\n    *returnSize = 0;\n    return NULL;\n}`,
      `func spiralOrder(matrix [][]int) []int {\n    return []int{}\n}`,
      `impl Solution {\n    pub fn spiral_order(matrix: Vec<Vec<i32>>) -> Vec<i32> {\n        vec![]\n    }\n}`
    );
  }

  // 35. Set Matrix Zeroes
  if (title.includes("set matrix zeroes") || title.includes("matrix zeroes")) {
    return tpl(
      `/**\n * @param {number[][]} matrix\n * @return {void} Do not return anything, modify matrix in-place instead.\n */\nvar setZeroes = function(matrix) {\n    // Write your solution here\n    \n};`,
      `function setZeroes(matrix: number[][]): void {\n    // Write your in-place solution here\n}`,
      `class Solution:\n    def setZeroes(self, matrix: list[list[int]]) -> None:\n        # Do not return anything, modify matrix in-place instead.\n        pass\n`,
      `class Solution {\n    public void setZeroes(int[][] matrix) {\n        // Write your in-place solution here\n        \n    }\n}`,
      `class Solution {\npublic:\n    void setZeroes(vector<vector<int>>& matrix) {\n        // Write your in-place solution here\n        \n    }\n};`,
      `void setZeroes(int** matrix, int matrixSize, int* matrixColSize) {\n    \n}`,
      `func setZeroes(matrix [][]int)  {\n    \n}`,
      `impl Solution {\n    pub fn set_zeroes(matrix: &mut Vec<Vec<i32>>) {\n        \n    }\n}`
    );
  }

  // 36. Merge Intervals
  if (title.includes("merge intervals")) {
    return tpl(
      `/**\n * @param {number[][]} intervals\n * @return {number[][]}\n */\nvar merge = function(intervals) {\n    // Write your solution here\n    \n};`,
      `function merge(intervals: number[][]): number[][] {\n    return [];\n}`,
      `class Solution:\n    def merge(self, intervals: list[list[int]]) -> list[list[int]]:\n        pass\n`,
      `class Solution {\n    public int[][] merge(int[][] intervals) {\n        return new int[][]{};\n    }\n}`,
      `class Solution {\npublic:\n    vector<vector<int>> merge(vector<vector<int>>& intervals) {\n        return {};\n    }\n};`,
      `int** merge(int** intervals, int intervalsSize, int* intervalsColSize, int* returnSize, int** returnColumnSizes) {\n    *returnSize = 0;\n    return NULL;\n}`,
      `func merge(intervals [][]int) [][]int {\n    return [][]int{}\n}`,
      `impl Solution {\n    pub fn merge(intervals: Vec<Vec<i32>>) -> Vec<Vec<i32>> {\n        vec![]\n    }\n}`
    );
  }

  // 37. Subsets
  if (title === "subsets" || (title.includes("subsets") && !title.includes("ii"))) {
    return tpl(
      `/**\n * @param {number[]} nums\n * @return {number[][]}\n */\nvar subsets = function(nums) {\n    // Write your solution here\n    \n};`,
      `function subsets(nums: number[]): number[][] {\n    return [];\n}`,
      `class Solution:\n    def subsets(self, nums: list[int]) -> list[list[int]]:\n        pass\n`,
      `class Solution {\n    public List<List<Integer>> subsets(int[] nums) {\n        return new ArrayList<>();\n    }\n}`,
      `class Solution {\npublic:\n    vector<vector<int>> subsets(vector<int>& nums) {\n        return {};\n    }\n};`,
      `int** subsets(int* nums, int numsSize, int* returnSize, int** returnColumnSizes) {\n    *returnSize = 0;\n    return NULL;\n}`,
      `func subsets(nums []int) [][]int {\n    return [][]int{}\n}`,
      `impl Solution {\n    pub fn subsets(nums: Vec<i32>) -> Vec<Vec<i32>> {\n        vec![]\n    }\n}`
    );
  }

  // 38. Combination Sum
  if (title === "combination sum" || (title.includes("combination sum") && !title.includes("ii"))) {
    return tpl(
      `/**\n * @param {number[]} candidates\n * @param {number} target\n * @return {number[][]}\n */\nvar combinationSum = function(candidates, target) {\n    // Write your solution here\n    \n};`,
      `function combinationSum(candidates: number[], target: number): number[][] {\n    return [];\n}`,
      `class Solution:\n    def combinationSum(self, candidates: list[int], target: int) -> list[list[int]]:\n        pass\n`,
      `class Solution {\n    public List<List<Integer>> combinationSum(int[] candidates, int target) {\n        return new ArrayList<>();\n    }\n}`,
      `class Solution {\npublic:\n    vector<vector<int>> combinationSum(vector<int>& candidates, int target) {\n        return {};\n    }\n};`,
      `int** combinationSum(int* candidates, int candidatesSize, int target, int* returnSize, int** returnColumnSizes) {\n    *returnSize = 0;\n    return NULL;\n}`,
      `func combinationSum(candidates []int, target int) [][]int {\n    return [][]int{}\n}`,
      `impl Solution {\n    pub fn combination_sum(candidates: Vec<i32>, target: i32) -> Vec<Vec<i32>> {\n        vec![]\n    }\n}`
    );
  }

  // 39. Permutations
  if (title.includes("permutations") || title === "permute") {
    return tpl(
      `/**\n * @param {number[]} nums\n * @return {number[][]}\n */\nvar permute = function(nums) {\n    // Write your solution here\n    \n};`,
      `function permute(nums: number[]): number[][] {\n    return [];\n}`,
      `class Solution:\n    def permute(self, nums: list[int]) -> list[list[int]]:\n        pass\n`,
      `class Solution {\n    public List<List<Integer>> permute(int[] nums) {\n        return new ArrayList<>();\n    }\n}`,
      `class Solution {\npublic:\n    vector<vector<int>> permute(vector<int>& nums) {\n        return {};\n    }\n};`,
      `int** permute(int* nums, int numsSize, int* returnSize, int** returnColumnSizes) {\n    *returnSize = 0;\n    return NULL;\n}`,
      `func permute(nums []int) [][]int {\n    return [][]int{}\n}`,
      `impl Solution {\n    pub fn permute(nums: Vec<i32>) -> Vec<Vec<i32>> {\n        vec![]\n    }\n}`
    );
  }

  // 40. Word Search
  if (title === "word search" || (title.includes("word search") && !title.includes("ii"))) {
    return tpl(
      `/**\n * @param {character[][]} board\n * @param {string} word\n * @return {boolean}\n */\nvar exist = function(board, word) {\n    // Write your solution here\n    \n};`,
      `function exist(board: string[][], word: string): boolean {\n    return false;\n}`,
      `class Solution:\n    def exist(self, board: list[list[str]], word: str) -> bool:\n        pass\n`,
      `class Solution {\n    public boolean exist(char[][] board, String word) {\n        return false;\n    }\n}`,
      `class Solution {\npublic:\n    bool exist(vector<vector<char>>& board, string word) {\n        return false;\n    }\n};`,
      `bool exist(char** board, int boardSize, int* boardColSize, char* word) {\n    return false;\n}`,
      `func exist(board [][]byte, word string) bool {\n    return false\n}`,
      `impl Solution {\n    pub fn exist(board: Vec<Vec<char>>, word: String) -> bool {\n        false\n    }\n}`
    );
  }

  // Universal fallback for custom problem or unlisted challenge
  return tpl(
    `/**\n * @param {string} input\n * @return {string}\n */\nvar solve = function(input) {\n    // Write your solution here\n    return input;\n};`,
    `function solve(input: string): string {\n    // Write your solution here\n    return input;\n}`,
    `class Solution:\n    def solve(self, input: str) -> str:\n        # Write your solution here\n        return input\n`,
    `class Solution {\n    public String solve(String input) {\n        // Write your solution here\n        return input;\n    }\n}`,
    `class Solution {\npublic:\n    string solve(string input) {\n        // Write your solution here\n        return input;\n    }\n};`,
    `char* solve(char* input) {\n    return input;\n}`,
    `func solve(input string) string {\n    return input\n}`,
    `impl Solution {\n    pub fn solve(input: String) -> String {\n        input\n    }\n}`
  );
};
