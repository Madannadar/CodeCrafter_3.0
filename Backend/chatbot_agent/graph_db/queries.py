class PrerequisiteQueries:
    """
    Cypher queries for prerequisite operations.
    Adjust these if your graph schema uses different labels/relationships.
    """
    
    # Schema assumptions:
    # - Nodes labeled :Subject with properties: name, description, difficulty (optional)
    # - Relationships: (:Subject)-[:PREREQUISITE_FOR]->(:Subject)
    
    GET_PREREQUISITE_TREE = """
    MATCH path = (root:Subject)-[:PREREQUISITE_FOR*]->(target:Subject {name: $subject})
    WHERE NOT (root)-[:PREREQUISITE_FOR]->()
    RETURN [node in nodes(path) | {
        id: id(node),
        name: node.name,
        description: node.description
    }] as chain,
    length(path) as depth
    ORDER BY depth DESC
    """
    
    GET_DIRECT_PREREQUISITES = """
    MATCH (prereq:Subject)-[:PREREQUISITE_FOR]->(target:Subject {name: $subject})
    RETURN prereq.name as name, 
           prereq.description as description,
           prereq.difficulty as difficulty
    ORDER BY prereq.name
    """
    
    GET_ALL_PREREQUISITES = """
    MATCH (prereq:Subject)-[:PREREQUISITE_FOR*]->(target:Subject {name: $subject})
    RETURN DISTINCT prereq.name as name, 
           prereq.description as description,
           prereq.difficulty as difficulty
    ORDER BY prereq.name
    """