from langchain.agents import create_agent
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from dotenv import load_dotenv

# importing web_search and scrape_url from tools.py file
from tools import web_search, scrape_url

load_dotenv()

llm = ChatGroq(
    model="openai/gpt-oss-120b",
    max_tokens=3000,
    temperature=0,
)


# 1st Agent: finds sources
def build_search_agent():
    return create_agent(
        model=llm,
        tools=[web_search],
        system_prompt=(
            "You are a search agent. Use web_search to find recent, reliable sources. "
            "Return the key findings along with their URLs."
        ),
    )


# 2nd Agent: reads a page in full
def build_reader_agent():
    return create_agent(
        model=llm,
        tools=[scrape_url],
        system_prompt=(
            "You are a reader agent. Use scrape_url to read the given page in full, "
            "then summarize the key points and cite the URL."
        ),
    )


# Writer chain
writer_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are an expert writer. Write clear, structured and insightful reports."),
    ("human", """Write a detailed research report on the topic below.

Topic: {topic}

Research Gathered:
{research}

Structure the report as:
- Introduction
- Key Findings (minimum 3 well-explained points)
- Conclusion
- Sources (list all URLs found in the research)

Be detailed, factual and professional."""),
])

writer_chain = writer_prompt | llm | StrOutputParser()


# Critic chain
critic_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a sharp and constructive research critic. Be honest and specific."),
    ("human", """Review the research report below and evaluate it strictly.

Report:
{report}

Respond in this exact format:

Score: X/10

Strengths:
- ...
- ...

Areas to Improve:
- ...
- ...

One line verdict:
..."""),
])

critic_chain = critic_prompt | llm | StrOutputParser()

