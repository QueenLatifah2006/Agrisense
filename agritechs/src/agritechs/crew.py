import os
import sys
import litellm
import time

# Configure litellm to automatically retry on rate limits
litellm.num_retries = 5
litellm.retry_strategy = "exponential_backoff"

# --- ROBUS MONKEYPATCH FOR CREWAI GROQ BUG ---
# CrewAI has a bug (Issue #5886) where it injects 'cache_breakpoint' into system and user messages.
# Groq fails with BadRequestError because it doesn't support prompt caching.
# This monkeypatch intercept all litellm calls (sync and async) and purges the unsupported parameters safely.

original_litellm_completion = litellm.completion
original_main_completion = getattr(litellm.main, 'completion', None)
original_litellm_acompletion = getattr(litellm, 'acompletion', None)
original_main_acompletion = getattr(litellm.main, 'acompletion', None) if hasattr(litellm, 'main') else None

# Enable drop_params as well just in case LiteLLM needs to drop unsupported top-level params
try:
    litellm.drop_params = True
except Exception:
    pass

def clean_messages_inplace(messages):
    if not messages:
        return
    for msg in messages:
        if isinstance(msg, dict):
            msg.pop('cache_breakpoint', None)
            msg.pop('cache_prompt', None)
            if 'extra_body' in msg and isinstance(msg['extra_body'], dict):
                msg['extra_body'].pop('cache_breakpoint', None)
                msg['extra_body'].pop('cache_prompt', None)
        elif hasattr(msg, 'pop'):
            try:
                msg.pop('cache_breakpoint', None)
                msg.pop('cache_prompt', None)
                if hasattr(msg, 'get') and isinstance(msg.get('extra_body'), dict):
                    msg.get('extra_body').pop('cache_breakpoint', None)
                    msg.get('extra_body').pop('cache_prompt', None)
            except Exception:
                pass
        elif hasattr(msg, '__dict__'):
            try:
                if 'cache_breakpoint' in msg.__dict__:
                    del msg.__dict__['cache_breakpoint']
                if 'cache_prompt' in msg.__dict__:
                    del msg.__dict__['cache_prompt']
            except Exception:
                pass
        
        # Check standard properties as attributes
        for attr in ['cache_breakpoint', 'cache_prompt']:
            if hasattr(msg, attr):
                try:
                    setattr(msg, attr, None)
                except Exception:
                    pass

def patched_completion(*args, **kwargs):
    try:
        if 'messages' in kwargs:
            clean_messages_inplace(kwargs['messages'])
        for arg in args:
            if isinstance(arg, list):
                clean_messages_inplace(arg)
    except Exception as e:
        print(f"[Patch Info] Non-blocking warning during message cleaning: {e}", file=sys.stderr)
    return original_litellm_completion(*args, **kwargs)

async def patched_acompletion(*args, **kwargs):
    try:
        if 'messages' in kwargs:
            clean_messages_inplace(kwargs['messages'])
        for arg in args:
            if isinstance(arg, list):
                clean_messages_inplace(arg)
    except Exception as e:
        print(f"[Patch Info] Non-blocking warning during async message cleaning: {e}", file=sys.stderr)
    return await original_litellm_acompletion(*args, **kwargs)

# Apply monkeypatch globally for both sync and async
litellm.completion = patched_completion
if original_main_completion:
    litellm.main.completion = patched_completion

if original_litellm_acompletion:
    litellm.acompletion = patched_acompletion
if original_main_acompletion:
    litellm.main.acompletion = patched_acompletion
# ---------------------------------------------

# Ensure current directory is in Python path for local relative imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from crewai import Agent, Crew, Process, Task, LLM
from crewai.project import CrewBase, agent, crew, task

from .tools.custom_tool import (
            DiscoverDatabaseTool,
            QuerySQLTool,
            rag_dossier_tool,
            FetchPDFsFromCloudinaryTool,
            ExtractPricesFromPDFTool,
            ScrapeAgriculturalPricesTool,
            AggregatePricesTool
)
    

@CrewBase
class AgritechsCrew():
    agents_config = 'config/agents.yaml'
    tasks_config = 'config/tasks.yaml'

    def __init__(self) -> None:
        # Construct absolute path to config files as crewai config loaders might resolve relatively
        base_dir = os.path.dirname(os.path.abspath(__file__))
        self.agents_config = os.path.join(base_dir, 'config/agents.yaml')
        self.tasks_config = os.path.join(base_dir, 'config/tasks.yaml')
        
        self.groq_llm = LLM(
            model="groq/llama-3.3-70b-versatile",
            api_key=os.getenv("GROQ_API_KEY"),
            temperature=0.0
        )
        
        self.groq_llm_fast = LLM(
            model="groq/llama-3.3-70b-versatile",
            api_key=os.getenv("GROQ_API_KEY"),
            temperature=0.2
        )

    # ── Agents Module 1 ──────────────────────────────────────
    @agent
    def analyste_sql(self) -> Agent:
        return Agent(
            config=self.agents_config['analyste_sql'],
            tools=[DiscoverDatabaseTool(), QuerySQLTool()],
            llm=self.groq_llm,
            verbose=True,
            max_iter=6,
            allow_delegation=False
        )

    @agent
    def agent_backend(self) -> Agent:
        return Agent(
            config=self.agents_config['agent_backend'],
            tools=[rag_dossier_tool, ScrapeAgriculturalPricesTool()],
            llm=self.groq_llm,
            verbose=True,
            max_iter=4,
            allow_delegation=False
        )

    @agent
    def conseiller_agricole(self) -> Agent:
        return Agent(
            config=self.agents_config['conseiller_agricole'],
            llm=self.groq_llm_fast,
            verbose=True,
            max_iter=3,
            allow_delegation=False
        )

    # ── Agents Module 2 ──────────────────────────────────────
    @agent
    def extracteur_pdfs(self) -> Agent:
        return Agent(
            config=self.agents_config['extracteur_pdfs'],
            tools=[
                FetchPDFsFromCloudinaryTool(),
                ExtractPricesFromPDFTool(),
                ScrapeAgriculturalPricesTool()
            ],
            llm=self.groq_llm,
            verbose=True,
            max_iter=10,
            allow_delegation=False
        )

    @agent
    def aggregateur_prix(self) -> Agent:
        return Agent(
            config=self.agents_config['aggregateur_prix'],
            tools=[AggregatePricesTool()],
            llm=self.groq_llm,
            verbose=True,
            max_iter=4,
            allow_delegation=False
        )

    # ── Tasks Module 1 ───────────────────────────────────────
    @task
    def task_decouverte_structure(self) -> Task:
        return Task(config=self.tasks_config['task_decouverte_structure'])

    @task
    def task_extraction_sql(self) -> Task:
        return Task(config=self.tasks_config['task_extraction_sql'])

    @task
    def task_centralisation_et_rag(self) -> Task:
        return Task(config=self.tasks_config['task_centralisation_et_rag'])

    @task
    def task_generation_conseiller(self) -> Task:
        return Task(config=self.tasks_config['task_generation_conseiller'])

    # ── Tasks Module 2 ───────────────────────────────────────
    @task
    def task_fetch_pdfs(self) -> Task:
        return Task(config=self.tasks_config['task_fetch_pdfs'])

    @task
    def task_extract_prices(self) -> Task:
        return Task(config=self.tasks_config['task_extract_prices'])

    @task
    def task_aggregate_prices(self) -> Task:
        return Task(config=self.tasks_config['task_aggregate_prices'])

    # ── Crews séparés par module ──────────────────────────────
    @crew
    def crew(self) -> Crew:
        """Crew Module 1 — Chat agriculteur"""
        return Crew(
            agents=[
                self.analyste_sql(),
                self.agent_backend(),
                self.conseiller_agricole()
            ],
            tasks=[
                self.task_decouverte_structure(),
                self.task_extraction_sql(),
                self.task_centralisation_et_rag(),
                self.task_generation_conseiller()
            ],
            process=Process.sequential,
            verbose=True,
        )

    def crew_prix(self) -> Crew:
        """Crew Module 2 — Extraction prix pour courbe"""
        return Crew(
            agents=[
                self.extracteur_pdfs(),
                self.aggregateur_prix()
            ],
            tasks=[
                self.task_fetch_pdfs(),
                self.task_extract_prices(),
                self.task_aggregate_prices()
            ],
            process=Process.sequential,
            verbose=True,
        )
