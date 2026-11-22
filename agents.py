from langchain.agents import create_agent
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from dotenv import load_dotenv

# importing web_search and scrape_url from tools.py file
from tools import web_search, scrape_url

load_dotenv()

# Bucket 1 (8,000 TPM): Fast model for tool-calling agents (Search & Reader)
worker_llm = ChatGroq(
    model="openai/gpt-oss-20b",
    max_tokens=1500,
    temperature=0,
    max_retries=3,
)

# Bucket 2 (8,000 TPM): Flagship model for final report synthesis & critic audit
writer_llm = ChatGroq(
    model="openai/gpt-oss-120b",
    max_tokens=2000,
    temperature=0,
    max_retries=3,
)


# 1st Agent: finds sources
def build_search_agent():
    return create_agent(
        model=worker_llm.bind_tools([web_search], tool_choice="auto"),
        tools=[web_search],
        system_prompt=(
            "You are a research assistant with access to a custom function named `web_search`. "
            "Do not use built-in browser tools. Always call the `web_search(query=...)` function "
            "to gather URLs and snippets, then summarize the results with titles and exact URLs."
        ),
    )


# 2nd Agent: reads a page in full
def build_reader_agent():
    return create_agent(
        model=worker_llm.bind_tools([scrape_url], tool_choice="auto"),
        tools=[scrape_url],
        system_prompt=(
            "You are a reader agent with access to a custom function named `scrape_url`. "
            "Do not use built-in browser tools. Always call `scrape_url(url=...)` to read "
            "the given page in full, then summarize the key points concisely and cite the URL."
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

writer_chain = writer_prompt | writer_llm | StrOutputParser()


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

critic_chain = critic_prompt | writer_llm | StrOutputParser()