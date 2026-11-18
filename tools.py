from langchain.tools import tool
import requests
from bs4 import BeautifulSoup
from tavily import TavilyClient
import os
from dotenv import load_dotenv
load_dotenv()
from rich import print
tavily = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

@tool
def web_search(query : str) -> str:
    """Search the web for recent and reliable information on topic. Returns the Title, URLs and snippets"""
    result = tavily.search(query=query, max_results=5)
    return result

print(web_search.invoke("What is recent news on Nvidia's Jansen Huang"))
