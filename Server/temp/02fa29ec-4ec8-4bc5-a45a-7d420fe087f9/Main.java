import java.util.*;
import java.io.*;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your solution here
        int left = 0;
        int right = nums.length-1;
        while(left < right){
            int sum = nums[left] + nums[right];
            if(sum == target) return new int[]{left, right};
            else if(sum < target){
                left++;
            }else{
                right--;
            }
        }
        return new int[]{-1, -1};
    }
}

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
                    String[] parts = lines.get(1).split("\\s+");
                    int[] nums = new int[parts.length];
                    for (int i = 0; i < parts.length; i++) nums[i] = Integer.parseInt(parts[i]);
                    int[] res = (int[]) m.invoke(sol, nums, target);
                    System.out.println(res[0] + " " + res[1]);
                    return;
                }
                if (m.getName().equals("isPalindrome")) {
                    String full = String.join("\n", lines);
                    boolean res = (boolean) m.invoke(sol, full);
                    System.out.println(res);
                    return;
                }
                if (m.getName().equals("lengthOfLongestSubstring")) {
                    String full = String.join("\n", lines);
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
                    String[] parts = lines.get(0).split("\\s+");
                    int[] nums = new int[parts.length];
                    for (int i = 0; i < parts.length; i++) nums[i] = Integer.parseInt(parts[i]);
                    int res = (int) m.invoke(sol, nums);
                    System.out.println(res);
                    return;
                }
                if (m.getName().equals("solve")) {
                    String full = String.join("\n", lines);
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
