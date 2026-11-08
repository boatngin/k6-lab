import { journey } from './journey.js';

export const options = {
  stages: [
    { duration: '30s', target: 1 }, // baseline: 1 user for 30 s
    { duration: '5s', target: 5 }, // spike to 5 users within 5 s
    { duration: '30s', target: 5 }, // hold the spike for 30 s
    { duration: '5s', target: 1 }, // drop back to 1 user within 5 s
    { duration: '1m', target: 1 }, // recovery: 1 user for 1 min
    { duration: '10s', target: 0 }, // ramp down
  ],
  thresholds: {
    checks: ['rate>0.99'],
    http_req_failed: ['rate<0.01'],
    'http_req_duration{group:::home}': ['p(95)<1000'],
    'http_req_duration{group:::recommendation}': ['p(95)<1500'],
  },
};

export default function () {
  journey();
}
