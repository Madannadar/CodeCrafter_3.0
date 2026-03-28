from chatbot_agent.graph import build_graph

graph = build_graph()

def run_agent(input_state: dict):
    return graph.invoke(input_state)
