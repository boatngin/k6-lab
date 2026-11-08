# K6 lab results

Run on 8 November 2026 with k6 v2.3.0 from macOS (Apple Silicon) against https://quickpizza.grafana.com.

## Part 0
- Step 0.1, http_req_duration: avg = min = med = max = p(95) = **287.5 ms** (1 request, so every statistic is the same).
- Step 0.2, requests, rate and p(95), and why the rate stays below 5:
- Step 0.6, exit code of the normal run and of the run with P95=300:
- Step 0.7, rules that passed, p(95), p(99), exit code after your change:
- Step 0.8, what was wrong, and how the checks showed it:

## Part A results
| Step | Test type    | Users | Req/s | p(95)     | Max     | Failed | Checks              |
| ---- | ------------ | ----- | ----- | --------- | ------- | ------ | ------------------- |
| A1   | Smoke        | 1     |       |       |     |        |        |
| A2   | Average load | 3     |       |       |     |        |        |
| A3   | Stress       | 5     |       |       |     |        |        |
| A4   | Spike        | 5     |       |       |     |        |        |
| A5   | Soak         | 2     |       |       |     |        |        |

## Part B
1.
2.
3.
4.
5.
6.
7.
8.
9.
