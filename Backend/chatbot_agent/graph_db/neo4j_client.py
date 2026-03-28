import os
from neo4j import GraphDatabase
from typing import Dict, List, Any, Optional
import json

class Neo4jClient:
    def __init__(self):
        self.uri = os.getenv("NEO4J_URI")
        self.username = os.getenv("NEO4J_USERNAME")
        self.password = os.getenv("NEO4J_PASSWORD")
        self.database = os.getenv("NEO4J_DATABASE", "neo4j")
        
        if not all([self.uri, self.username, self.password]):
            raise ValueError("Missing required Neo4j environment variables (NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD)")
        
        self._driver = GraphDatabase.driver(self.uri, auth=(self.username, self.password))
    
    def close(self):
        """Close the driver connection."""
        if self._driver:
            self._driver.close()
    
    def verify_connectivity(self) -> bool:
        """Verify connection to Neo4j."""
        try:
            self._driver.verify_connectivity()
            return True
        except Exception as e:
            print(f"Neo4j Connection Error: {e}")
            return False
    
    def get_prerequisites_recursive(self, subject_name: str) -> Dict[str, Any]:
        """
        Get all prerequisites for a subject recursively till root nodes.
        Returns a hierarchical tree structure.
        Assumes: (Prerequisite)-[:PREREQUISITE_FOR]->(Subject)
        """
        with self._driver.session(database=self.database) as session:
            # Check if subject exists
            check = session.run(
                "MATCH (s:Subject {name: $subject}) RETURN s.name as name", 
                subject=subject_name
            ).single()
            
            if not check:
                return {
                    "error": f"Subject '{subject_name}' not found in database",
                    "subject": subject_name,
                    "prerequisites": [],
                    "total_count": 0
                }
            
            # Get all prerequisite paths till root (nodes that have no outgoing PREREQUISITE_FOR relationships)
            result = session.run("""
                // Get all paths from any root to the target subject
                MATCH path = (root:Subject)-[:PREREQUISITE_FOR*]->(target:Subject {name: $subject})
                WHERE NOT (root)-[:PREREQUISITE_FOR]->()
                
                // Return each path as a chain
                RETURN [node in nodes(path) | {
                    name: node.name, 
                    description: node.description,
                    difficulty: node.difficulty
                }] as prerequisite_chain,
                length(path) as depth
                ORDER BY depth DESC
            """, subject=subject_name)
            
            paths = []
            all_prerequisites = {}
            
            for record in result:
                chain = record["prerequisite_chain"]
                # Remove the target itself (last element) to get only prerequisites
                prereq_chain = chain[:-1] if len(chain) > 0 else []
                paths.append({
                    "path": prereq_chain,
                    "depth": record["depth"]
                })
                
                # Collect unique prerequisites
                for node in prereq_chain:
                    all_prerequisites[node["name"]] = node
            
            # Also get direct prerequisites with their immediate relationships
            direct_result = session.run("""
                MATCH (prereq:Subject)-[:PREREQUISITE_FOR]->(target:Subject {name: $subject})
                RETURN prereq.name as name, 
                       prereq.description as description,
                       prereq.difficulty as difficulty
            """, subject=subject_name)
            
            direct_prerequisites = [
                {
                    "name": record["name"],
                    "description": record["description"],
                    "difficulty": record["difficulty"]
                }
                for record in direct_result
            ]
            
            return {
                "subject": subject_name,
                "direct_prerequisites": direct_prerequisites,
                "prerequisite_paths": paths,  # All paths from root to subject
                "all_prerequisites": list(all_prerequisites.values()),
                "total_count": len(all_prerequisites),
                "structure": self._build_tree(paths, subject_name)
            }
    
    def _build_tree(self, paths: List[Dict], subject_name: str) -> Dict[str, Any]:
        """Build a nested tree structure from paths."""
        if not paths:
            return {"name": subject_name, "children": []}
        
        # Build tree from paths
        root_nodes = {}
        
        for path_data in paths:
            chain = path_data["path"]
            current_level = root_nodes
            
            for i, node in enumerate(chain):
                name = node["name"]
                if name not in current_level:
                    current_level[name] = {
                        "data": node,
                        "children": {}
                    }
                current_level = current_level[name]["children"]
        
        # Convert to nested list structure
        def convert_to_list(node_dict):
            result = []
            for name, data in node_dict.items():
                children = convert_to_list(data["children"])
                node = {
                    "name": name,
                    "description": data["data"].get("description"),
                    "difficulty": data["data"].get("difficulty"),
                    "children": children if children else None
                }
                result.append(node)
            return result
        
        return {
            "name": subject_name,
            "children": convert_to_list(root_nodes)
        }
    
    def get_subject_exists(self, subject_name: str) -> bool:
        """Check if a subject exists in the database."""
        with self._driver.session(database=self.database) as session:
            result = session.run(
                "MATCH (s:Subject {name: $subject}) RETURN count(s) as count",
                subject=subject_name
            )
            return result.single()["count"] > 0
    
    def get_all_subjects(self) -> List[str]:
        """Get list of all available subjects."""
        with self._driver.session(database=self.database) as session:
            result = session.run("MATCH (s:Subject) RETURN s.name as name ORDER BY s.name")
            return [record["name"] for record in result]