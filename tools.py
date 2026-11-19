from langchain.tools import tool
import requests
from bs4 import BeautifulSoup
from tavily import TavilyClient
import os
from dotenv import load_dotenv
load_dotenv()
from rich import print
from pydantic import BaseModel, Field

tavily = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))


class SearchInput(BaseModel):
    query: str = Field(description="The search text to look up")


@tool("web_search", args_schema=SearchInput)
def web_search(query : str) -> str:
    """Search the web for recent and reliable information on topic. Returns the Title, URLs and snippets"""
    result = tavily.search(query=query, max_results=2)

    out = []
    for r in result['results']:
        out.append(
            f"Title: {r['title']}\n Url{r['url']}\n Snippet: {r['content'][:300]}\n "
        )

    return "\n-----\n".join(out)

# print(web_search.invoke("What is the recent AI news on hiring of freshers in IT"))

@tool
def scrape_url(url : str) -> str:
    """Scrape and return clean text content from a given URL for deeper reading."""

    try:
        res = requests.get(url, timeout=8, headers={"User-Agent": "Mozilla/5.0"})
        soup = BeautifulSoup(res.text, "html.parser")
        for tag in soup(["script", "style", "nav","footer"]):
            tag.decompose()
        return soup.get_text(separator=" ",strip=True)[:3000]
    except Exception as e:
        return f"Could not scrape URL: {str(e)}"
    

# print(scrape_url.invoke("https://www.crictracker.com/cricket-news/mi-2027-retentions-released-retained-trade-players-list-ahead-of-ipl-2027-auction/"))