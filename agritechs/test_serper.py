import os
from dotenv import load_dotenv
load_dotenv()
from crewai_tools import SerperDevTool
tool = SerperDevTool()
print(tool._run(search_query='prix tomate cameroun'))
