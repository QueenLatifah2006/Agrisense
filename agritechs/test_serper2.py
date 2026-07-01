import os
from dotenv import load_dotenv
load_dotenv()
from crewai_tools import SerperDevTool
tool = SerperDevTool()
try:
    print("Trying .run(search_query=...)")
    print(tool.run(search_query='prix tomate cameroun'))
except Exception as e:
    print(f"Failed .run(search_query): {e}")

try:
    print("Trying .run(query)")
    print(tool.run('prix tomate cameroun'))
except Exception as e:
    print(f"Failed .run(query): {e}")
