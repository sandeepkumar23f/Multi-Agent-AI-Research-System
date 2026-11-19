from langchain.agents import create_agent
from langchain_openai import ChatOpenAI
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

#importing web_search and scrape_url from tools.py file
from tools import web_search, scrape_url
from dotenv import load_dotenv

load_dotenv()

llm = ChatGroq(
    model="groq:openai/gpt-oss-120b", 
    max_tokens=600,
    temperature=0
    )

# 1st Agent
def build_search_agent():
    return create_agent(
        model=llm,
        tools=[web_search]
    )

# 2nd Agent
def build_reader_agent():
    return create_agent(
        model=llm,
        tools=[scrape_url]
    )

