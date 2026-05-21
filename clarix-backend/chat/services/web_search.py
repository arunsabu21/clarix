from tavily import TavilyClient
from django.conf import settings


def get_tavily_client():
    api_key = getattr(settings, "TAVILY_API_KEY", "")
    if not api_key:
        raise ValueError("TAVILY API KEY is not configured in settings.")
    return TavilyClient(api_key=api_key)


def should_search(message: str) -> bool:
    message_lower = message.lower().strip()

    if len(message_lower) < 10:
        return False
    
    project_keywords = [
        "my project",
        "current_project",
        "attached project",
        "this project",
        "project  context",
    ]

    if any (keyword in message_lower for keyword in project_keywords):
        print("PROJECT EXCLUSION HIT")
        return False
    
    if "project" in message_lower:
        return False

    # Always search triggers
    high_priority = [
        # Time-sensitive
        "latest",
        "current",
        "today",
        "now",
        "recent",
        "this week",
        "this month",
        "this year",
        "2024",
        "2025",
        "2026",
        "breaking",
        "update",
        "news",
        # Factual lookups
        "price of",
        "cost of",
        "how much is",
        "how much does",
        "stock price",
        "exchange rate",
        "weather",
        "who is the",
        "who won",
        "who is ceo",
        "who is president",
        # Events
        "match",
        "score",
        "result",
        "election",
        "launch",
        "release date",
        "when did",
        "when is",
        # Research
        "find me",
        "search for",
        "look up",
        "what happened",
    ]
    
    for trigger in high_priority:
        if trigger in message_lower:
            return True

    # Skip triggers
    skip_triggers = [
        "hello",
        "hi",
        "hey",
        "how are you",
        "what is your name",
        "explain",
        "define",
        "what is",
        "how does",
        "teach me",
        "write",
        "create",
        "generate",
        "make",
        "help me write",
        "code",
        "function",
        "fix",
        "debug",
        "error",
        "what do you think",
        "opinion",
        "suggest",
    ]

    for skip in skip_triggers:
        if message_lower.startswith(skip):
            return False
        
    return False


def web_search(query: str, max_results: int = 5) -> dict:
    """
    {
        "success": bool,
        "query": str,
        "results": [
            {
                "title": str,
                "url": str,
                "content": str,
                "score": float,
            }
        ],
        "answer": str,
    }
    """

    try:
        client = get_tavily_client()

        response = client.search(
            query=query,
            search_depth="advanced",
            max_results=max_results,
            include_answer=True,
            include_raw_content=False,
        )

        results = []
        for r in response.get("results", []):
            results.append(
                {
                    "title": r.get("title", ""),
                    "url": r.get("url", ""),
                    "content": r.get("content", "")[:500],
                    "score": r.get("score", 0),
                }
            )

        return {
            "success": True,
            "query": query,
            "results": results,
            "answer": response.get("answer", ""),
        }

    except Exception as e:
        print(f"Tavily search error: {e}")
        return {
            "success": False,
            "query": query,
            "results": [],
            "answer": "",
            "error": str(e),
        }


def format_search_context(search_data: dict) -> str:
    if not search_data.get("success") or not search_data.get("results"):
        return ""

    lines = [
        f"[Web Search Results for: {search_data['query']}]",
        "",
    ]
    
    if search_data.get("answer"):
      lines.append(f"Summary: {search_data['answer']}")
      lines.append("")
    
    for i, result in enumerate(search_data["results"][:3], 1):
      lines.append(f"Source {i}: {result['title']}")
      lines.append(f"URL: {result['url']}")
      lines.append(f"Content: {result['content']}")
      lines.append("")
      
    lines.append(
      "[Use the above search results to answer the user\'s question."
      "Cite sources when relevant. If results don't help say no.]"
    )
    
    return "\n".join(lines)
