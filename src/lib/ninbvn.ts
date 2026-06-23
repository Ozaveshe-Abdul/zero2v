const BASE_URL = 'https://checkmyninbvn.com.ng/api'
const API_KEY = process.env.CHECKMYNINBVN_API_KEY!

export async function callNINBVNApi(
  endpoint: string,
  body: Record<string, unknown>
) {
  const res = await fetch(`${BASE_URL}/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify({ ...body, consent: true }),
  })
  return res.json()
}

export async function callNINBVNBalance() {
  const res = await fetch(`${BASE_URL}/balance`, {
    headers: { 'x-api-key': API_KEY },
  })
  return res.json()
}
