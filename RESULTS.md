# K6 lab results

Run on 8 November 2026 with k6 v2.3.0 from macOS (Apple Silicon) against https://quickpizza.grafana.com.

## Part 0
- Step 0.1, http_req_duration: avg = min = med = max = p(95) = **287.5 ms** (1 request, so every statistic is the same).
- Step 0.2, requests, rate and p(95), and why the rate stays below 5: **75 requests**, **3.69 req/s**, **p(95) = 403.8 ms**.
  The rate is below 5 req/s because each virtual user does not send requests non-stop. One iteration is one request (~0.3 s) **plus `sleep(1)`**, so one iteration takes about 1.3 s (the summary shows `iteration_duration` avg = 1.35 s). One VU therefore makes about 1 / 1.35 ≈ 0.74 req/s, and 5 VUs make about 5 × 0.74 ≈ 3.7 req/s. To reach 5 req/s each iteration would have to take exactly 1 s, which is impossible when the sleep alone is 1 s and the request takes time too.
- Step 0.3: exactly 20 iterations, 20 requests, finished in 5.9 s, p(95) = 342.55 ms.
- Step 0.4: all 3 checks passed (status 200, pizza has a name, every ingredient is vegetarian), 313.58 ms.
- Step 0.5: the request without a token got 401, the check passed and `http_req_failed` stayed at 0.00 % thanks to `http.expectedStatuses(401)`.
- Step 0.6, exit code of the normal run and of the run with P95=300: normal run **exit code 0** (p(95) = 442.76 ms < 1500 ms, all thresholds ✓). With `-e P95=300` the p(95) rule failed (p(95) = 415.66 ms > 300 ms), K6 printed "thresholds on metrics 'http_req_duration' have been crossed" and the **exit code was 99**.
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
