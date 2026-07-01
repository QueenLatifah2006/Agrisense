from crewai import Agent, Crew, Process, Task, LLM
from crewai.project import CrewBase, agent, crew, task
from agritechs.tools.custom_tool import DiscoverDatabaseTool, QuerySQLTool, rag_dossier_tool
import os

@CrewBase
class AgritechsCrew():
    agents_config = 'config/agents.yaml'
    tasks_config = 'config/tasks.yaml'

    def __init__(self) -> None:
        self.groq_llm = LLM(
            model="groq/llama-3.3-70b-versatile", 
            api_key=os.getenv("GROQ_API_KEY"),
            temperature=0.0
        )

    @agent
    def analyste_sql(self) -> Agent:
        return Agent(
            config=self.agents_config['analyste_sql'],
            tools=[DiscoverDatabaseTool(), QuerySQLTool()], 
            llm=self.groq_llm,
            verbose=True,
            max_iter=3, # <--- ON LIMITE À 3 ESSAIS MAX POUR ÉVITER LE CRASH 429
            allow_delegation=False
        )

    @agent
    def agent_backend(self) -> Agent:
        return Agent(
            config=self.agents_config['agent_backend'],
            tools=[rag_dossier_tool],
            llm=self.groq_llm,
            verbose=True
        )

    @agent
    def conseiller_agricole(self) -> Agent:
        return Agent(
            config=self.agents_config['conseiller_agricole'],
            llm=self.groq_llm,
            verbose=True
        )

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

    @crew
    def crew(self) -> Crew:
        return Crew(
            agents=self.agents, 
            tasks=self.tasks,   
            process=Process.sequential,
            verbose=True,
        )