# VCRAFT AI - API Documentation

Complete API reference for the VCRAFT AI backend.

**Base URL**: `http://localhost:8000` (development)

**Auto-Generated Docs**: `http://localhost:8000/docs` (Swagger UI)

## Authentication

Currently, the API accepts Firebase user IDs in request bodies. In production, implement Bearer token authentication.

## Core Endpoints

---

### 1. Analyze Pitch

**POST** `/api/analyze-pitch`

Analyze a startup pitch using RAG-powered AI with persona-aware feedback.

#### Request Body

```json
{
  "startup_idea": "string (min 50 chars)",
  "pitch_deck_text": "string (optional)",
  "investor_stage": "seed|series_a|series_b|growth",
  "investor_persona": "saas|angel|growth_vc|institutional",
  "industry": "string",
  "user_id": "string (Firebase UID)"
}
```

#### Example Request

```json
{
  "startup_idea": "We're building an AI-powered platform that helps startup founders practice their investor pitches. Using RAG and persona-aware LLMs, we provide specific feedback tailored to different types of investors. Our target market is pre-seed to Series A founders preparing for fundraising.",
  "pitch_deck_text": "Market: $50B startup fundraising market. Traction: 200 beta users, 85% would recommend. Team: Ex-founders who raised $20M combined.",
  "investor_stage": "seed",
  "investor_persona": "saas",
  "industry": "SaaS / EdTech",
  "user_id": "firebase_user_123"
}
```

#### Response (200 OK)

```json
{
  "analysis_id": "uuid-string",
  "overall_score": 75,
  "section_scores": {
    "problem_clarity": 80,
    "market_opportunity": 70,
    "revenue_model": 75,
    "competitive_moat": 65,
    "scalability": 85
  },
  "feedback": {
    "problem_clarity": "Strong articulation of founder pain point. The problem is well-defined and significant. Consider quantifying the time/cost impact on founders.",
    "market_opportunity": "Market size is compelling but needs validation. $50B is the broader fundraising market - what's your serviceable obtainable market (SOM)? Show bottom-up calculation.",
    "revenue_model": "Business model is clear (SaaS subscription assumed). Need explicit pricing tiers and unit economics. What's your CAC and LTV?",
    "competitive_moat": "AI and RAG are technology advantages but not defensible alone. What prevents competitors from copying? Consider network effects from user data.",
    "scalability": "Software scales well. Impressive that you can serve 10x users without 10x costs. Ensure LLM API costs are factored into unit economics."
  },
  "recommendations": [
    "Provide bottom-up market sizing: number of target founders × price",
    "Include specific unit economics: CAC, LTV, LTV:CAC ratio",
    "Strengthen competitive moat beyond technology (data, community, brand)",
    "Show traction metrics: MRR, retention, NPS scores"
  ]
}
```

#### Error Responses

**400 Bad Request**
```json
{
  "detail": [
    "Startup idea must be at least 50 characters",
    "Invalid investor persona"
  ]
}
```

**500 Internal Server Error**
```json
{
  "detail": "Internal server error during analysis"
}
```

---

### 2. Generate Questions

**POST** `/api/generate-questions`

Generate VC questions for Q&A practice based on pitch and investor persona.

#### Request Body

```json
{
  "analysis_id": "string (from analyze-pitch response)",
  "investor_persona": "saas|angel|growth_vc|institutional",
  "num_questions": 5
}
```

#### Example Request

```json
{
  "analysis_id": "abc-123-def-456",
  "investor_persona": "saas",
  "num_questions": 5
}
```

#### Response (200 OK)

```json
{
  "questions": [
    {
      "id": "q1",
      "question": "What is your customer acquisition cost (CAC) and how does it compare to your lifetime value (LTV)?",
      "category": "business_model",
      "difficulty": "medium"
    },
    {
      "id": "q2",
      "question": "Walk me through your go-to-market strategy. How do you plan to acquire your first 100 customers?",
      "category": "market",
      "difficulty": "easy"
    },
    {
      "id": "q3",
      "question": "What happens when OpenAI or Google builds a similar pitch analysis feature into their products?",
      "category": "market",
      "difficulty": "hard"
    },
    {
      "id": "q4",
      "question": "What are your key metrics today and what do you expect them to be in 12 months?",
      "category": "traction",
      "difficulty": "medium"
    },
    {
      "id": "q5",
      "question": "Why is your founding team uniquely positioned to solve this problem?",
      "category": "team",
      "difficulty": "easy"
    }
  ]
}
```

#### Error Responses

**404 Not Found**
```json
{
  "detail": "Pitch analysis not found. Analyze pitch first."
}
```

---

### 3. Evaluate Answer

**POST** `/api/evaluate-answer`

Evaluate a founder's answer to a VC question with score and feedback.

#### Request Body

```json
{
  "question_id": "string (from generate-questions response)",
  "answer": "string (min 10 chars)",
  "analysis_id": "string"
}
```

#### Example Request

```json
{
  "question_id": "q1",
  "answer": "Our current CAC is around $50 through content marketing and SEO. We're seeing an LTV of approximately $600 based on our annual subscription of $200 with an expected 3-year retention. This gives us an LTV:CAC ratio of 12:1, which is strong. As we scale, we expect CAC to increase to $100-150 as we move into paid channels, but LTV should also grow as we add premium tiers.",
  "analysis_id": "abc-123-def-456"
}
```

#### Response (200 OK)

```json
{
  "score": 9,
  "feedback": "Excellent answer with specific metrics and clear understanding of unit economics. You provided actual numbers (CAC $50, LTV $600) and showed forward thinking about how metrics will evolve. The LTV:CAC ratio of 12:1 is impressive and demonstrates strong business fundamentals.",
  "improvement_tips": [
    "Mention your CAC payback period (e.g., '6 months to recover acquisition cost')",
    "Add context about how your metrics compare to SaaS benchmarks (LTV:CAC >3:1 is standard, you're at 12:1)",
    "Discuss your retention strategy - what keeps customers subscribed?"
  ]
}
```

#### Score Guide

- **9-10**: Excellent VC-ready answer with metrics and clear thinking
- **7-8**: Good answer but could be more specific
- **5-6**: Adequate but lacks depth
- **3-4**: Vague or incomplete
- **0-2**: Off-topic or shows lack of understanding

#### Error Responses

**404 Not Found**
```json
{
  "detail": "Pitch analysis not found"
}
```

---

### 4. Health Check

**GET** `/health`

Check API health status.

#### Response (200 OK)

```json
{
  "status": "healthy",
  "environment": "development"
}
```

---

## Data Models

### PitchRequest

```python
{
  "startup_idea": str (min_length=50),
  "pitch_deck_text": Optional[str],
  "investor_stage": Literal["seed", "series_a", "series_b", "growth"],
  "investor_persona": Literal["saas", "angel", "growth_vc", "institutional"],
  "industry": str (min_length=2),
  "user_id": str
}
```

### AnalysisResponse

```python
{
  "analysis_id": str,
  "overall_score": int (0-100),
  "section_scores": {
    "problem_clarity": int (0-100),
    "market_opportunity": int (0-100),
    "revenue_model": int (0-100),
    "competitive_moat": int (0-100),
    "scalability": int (0-100)
  },
  "feedback": {
    "problem_clarity": str,
    "market_opportunity": str,
    "revenue_model": str,
    "competitive_moat": str,
    "scalability": str
  },
  "recommendations": List[str]
}
```

### Question

```python
{
  "id": str,
  "question": str,
  "category": Literal["business_model", "market", "product", "traction", "team"],
  "difficulty": Literal["easy", "medium", "hard"]
}
```

### AnswerEvaluation

```python
{
  "score": int (0-10),
  "feedback": str,
  "improvement_tips": List[str]
}
```

---

## Investor Personas

### SaaS-Focused Investor
**Priorities**: MRR, CAC/LTV, retention, unit economics, scaling
**Questions Focus**: Metrics, pricing, customer acquisition, churn

### Early-Stage Angel
**Priorities**: Team quality, vision, problem significance, market timing
**Questions Focus**: Founder background, passion, early validation

### Growth-Stage VC
**Priorities**: Revenue growth (100%+ YoY), market leadership, path to IPO
**Questions Focus**: Scaling, competitive position, operational efficiency

### Conservative Institutional
**Priorities**: Profitability, defensibility, risk mitigation, governance
**Questions Focus**: Moat, IP, regulatory compliance, strategic fit

---

## Rate Limits

Currently no rate limiting. In production, implement:
- 100 requests/minute per IP
- 1000 requests/hour per user

---

## Error Handling

All errors return JSON with `detail` field:

```json
{
  "detail": "Error message here"
}
```

**Status Codes**:
- `200`: Success
- `400`: Bad request (validation error)
- `404`: Resource not found
- `500`: Internal server error

---

## Testing with cURL

### Analyze Pitch

```bash
curl -X POST http://localhost:8000/api/analyze-pitch \
  -H "Content-Type: application/json" \
  -d '{
    "startup_idea": "We are building an AI platform for pitch analysis...",
    "investor_stage": "seed",
    "investor_persona": "saas",
    "industry": "SaaS",
    "user_id": "test_user"
  }'
```

### Generate Questions

```bash
curl -X POST http://localhost:8000/api/generate-questions \
  -H "Content-Type: application/json" \
  -d '{
    "analysis_id": "your-analysis-id",
    "investor_persona": "saas",
    "num_questions": 5
  }'
```

### Evaluate Answer

```bash
curl -X POST http://localhost:8000/api/evaluate-answer \
  -H "Content-Type: application/json" \
  -d '{
    "question_id": "q1",
    "answer": "Our CAC is $50 and LTV is $600...",
    "analysis_id": "your-analysis-id"
  }'
```

---

## Interactive Documentation

FastAPI provides interactive API documentation:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

Use these to:
- Explore endpoints
- Test requests
- See request/response schemas
- Understand validation rules

---

## Notes

1. **RAG Context**: All analysis uses retrieved VC knowledge - not hallucinated
2. **JSON Output**: LLM responses are enforced to be valid JSON
3. **Async**: All endpoints are async for better performance
4. **Validation**: Pydantic models validate all inputs
5. **Caching**: Q&A uses in-memory cache (use Redis in production)

---

## Support

For API issues:
- Check FastAPI logs in terminal
- Verify request body matches schema
- Test with interactive docs at `/docs`
- Ensure RAG system is initialized
