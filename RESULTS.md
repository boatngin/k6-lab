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
- Step 0.7, rules that passed, p(95), p(99), exit code after your change: `07-requirement.js` uses `vus: 3`, `duration: '30s'`, `http_req_duration: ['p(95)<1000', 'p(99)<1500']` and `http_req_failed: ['rate<0.01']`. All three rules passed: **p(95) = 426.87 ms**, **p(99) = 443.37 ms**, failed = 0.00 %, exit code 0.
  I then changed the requirement to "95 % within **200 ms**" (`k6 run -e P95=200 07-requirement.js`). The p(95) rule failed (p(95) = 426.49 ms), the other two still passed, and the **exit code was 99**.
- Step 0.8, what was wrong, and how the checks showed it: with 5 VUs for 20 s the original script got **36 of 222 checks failed (83.78 % passed)**: `no pepperoni` failed 12 of 74 times and `no knife needed` failed 24 of 74 times, although every response was 200.
  `explore.js` showed that QuickPizza names things with a capital letter: the topping is `"Pepperoni"` and the tools are `["Knife", "Pizza cutter", "Scissors"]`. The request sent `'pepperoni'` and `'knife'` in lower case, the API matches names case-sensitively, so it did not recognise them and silently ignored both restrictions. I fixed the request to `excludedIngredients: ['Pepperoni']` and `excludedTools: ['Knife']`, and the rerun passed **210 of 210 checks (100 %)**.
  One manual request might not have shown the bug because the pizza is random. Most random pizzas happen to have no pepperoni and no knife anyway (in the run, 83 % and 67 %), so a single try would often look correct. Under load the same check runs 74 times, and the failure rate becomes visible as a percentage. The status code was always 200, so only checks on the content of the answer could find it.

## Part A results
| Step | Test type    | Users | Req/s | p(95)     | Max     | Failed | Checks              |
| ---- | ------------ | ----- | ----- | --------- | ------- | ------ | ------------------- |
| A1   | Smoke        | 1     | 0.49  | 560.54 ms | 767.86 ms | 0.00 % | 100.00 % (20/20)  |
| A2   | Average load | 3     | 1.28  | 436.82 ms | 619.36 ms | 0.00 % | 100.00 % (312/312) |
| A3   | Stress       | 5     | 2.13  | 429.66 ms | 1.01 s    | 0.00 % | 100.00 % (512/512) |
| A4   | Spike        | 5     | 1.04  | 437.12 ms | 480.68 ms | 0.00 % | 100.00 % (196/196) |
| A5   | Soak         | 2     | 0.96  | 431.29 ms | 1.11 s    | 0.00 % | 100.00 % (844/844) |

All group thresholds passed in A2 to A5 (home p(95) ≈ 384–421 ms < 1000 ms, recommendation p(95) ≈ 440–450 ms < 1500 ms). The A1 smoke test had only 15 requests, so its p(95) is driven by one or two slow requests (the first one includes the TLS handshake).
HTML reports: `reports/a2-average.html`, `reports/a3-stress.html`, `reports/a4-spike.html`, `reports/a5-soak.html`.

## Part B
1. See the results table above.
2. Each virtual user runs its iterations one after another, and each iteration is one request (~0.3 s) plus `sleep(1)`, about 1.35 s. So one VU sends at most ≈ 0.74 req/s and 5 VUs ≈ 3.7 req/s (measured 3.69 req/s). The think time limits the rate, not the server.
3. No. The overall p(95) was 436.82 ms at 3 users and 429.66 ms at 5 users, which is the same within normal network noise (the recommendation p(95) went from 446.5 ms to 449.73 ms). The request rate went up from 1.28 to 2.13 req/s, but the response time did not grow. Only the max rose once to 1.01 s, a single outlier. In terms of the operational envelope, 5 users at about 2 req/s are far inside the envelope of QuickPizza, a service built to be shared by many K6 learners at once. Our "stress" test is only stress compared with our own average load, not compared with the system's capacity, so we never came near the edge where response times start to rise or errors appear.
4. In the 10-second snapshots of `reports/a4-spike.html`, the p(95) during the baseline at 1 user was about 318–360 ms. During the spike at 5 users it rose slightly to about 364–394 ms. In the first 10-second window after dropping back to 1 user it was already back to about 335 ms and then 308 ms. So the rise was small (≈ 30–40 ms, within network noise) and the response time returned to its earlier level within one snapshot, **about 10 seconds**, i.e. right away. No requests failed.
5. No. In `reports/a5-soak.html` the p(95) in the first minutes was about 290–395 ms and in the last minutes about 285–367 ms, so it did not get worse. The error rate stayed at 0.00 % for all 633 requests and all 844 checks passed. There were two short outliers in the middle of the run (max 955 ms and 911 ms in single 10-second windows), which went away immediately and do not form a trend. A soak test of several hours could reveal a **memory leak** (memory grows slowly until the process slows down from garbage collection or crashes), and also exhaustion of resources such as database connections, file handles or disk space from growing logs.
6. An average hides the slowest users. A few very slow requests barely move the average when most requests are fast, but those users still have a bad experience. The p(95) says that 95 % of requests were faster than this value, so it directly describes the experience of nearly every user, including the slow tail. In our A3 run the average was 340 ms but the max was 1.01 s; the p(95) of 430 ms is a fairer promise than the average.
7. (a) **Network distance and noise**: our requests travel over the public internet from Thailand to Grafana's servers, so most of the ~270–450 ms is network latency and TLS that varies with routing and the home connection; in a lab the client sits next to the server and the times would be much lower and more stable. (b) **Shared, unknown load and hardware**: QuickPizza is used at the same time by people all over the world, and runs on cloud hardware with possible caching, CDN and autoscaling that we do not control, so other users' traffic changes our numbers; a lab system has known hardware, configuration and only our load. (Also: the load generator itself, a laptop on Wi-Fi, could be the bottleneck.)
8. Because it is effectively a denial-of-service attack. Hundreds of users can slow down or crash the site for its real users, cost the owner money, and may break the law and the provider's terms of service. Only the owner can agree to that risk, so load testing requires written permission. On a site you own you can also watch the server side and stop the test safely.
9. Vague requirement (LINE chat app): "Sending a message should be fast, even when many people are using the app."
   Testable requirement: "With 200 concurrent users each sending one message every 5 seconds for 10 minutes, the send-message API answers 95 % of requests within 500 ms and 99 % within 1 s, fewer than 0.1 % of requests fail, and more than 99.9 % of messages are confirmed as delivered."
   ```js
   export const options = {
     stages: [
       { duration: '1m', target: 200 },
       { duration: '10m', target: 200 },
       { duration: '1m', target: 0 },
     ],
     thresholds: {
       'http_req_duration{name:send-message}': ['p(95)<500', 'p(99)<1000'],
       http_req_failed: ['rate<0.001'],
       checks: ['rate>0.999'], // check: 'message is delivered'
     },
   };
   ```
