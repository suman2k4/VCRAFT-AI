"""
Investor Persona Definitions

Each persona has different priorities, risk tolerances, and evaluation criteria.
These inform how we prompt the LLM for analysis and Q&A generation.
"""

INVESTOR_PERSONAS = {
    "saas": {
        "name": "SaaS-Focused Investor",
        "description": "Invests primarily in B2B SaaS companies. Deeply focused on unit economics, scalability, and recurring revenue.",
        "priorities": [
            "Monthly Recurring Revenue (MRR) and growth rate",
            "Customer Acquisition Cost (CAC) and Lifetime Value (LTV)",
            "Net Revenue Retention",
            "Product-market fit and customer satisfaction",
            "Scalability of the sales model"
        ],
        "risk_tolerance": "medium",
        "typical_check_size": "$1M - $5M",
        "questions_focus": [
            "unit_economics",
            "customer_acquisition",
            "churn_metrics",
            "pricing_strategy",
            "sales_process"
        ]
    },
    
    "angel": {
        "name": "Early-Stage Angel Investor",
        "description": "Individual investor supporting pre-seed and seed startups. More flexible on metrics, heavily focused on founder quality and market potential.",
        "priorities": [
            "Founding team quality and passion",
            "Problem significance",
            "Market size and timing",
            "Early customer validation",
            "Vision and long-term thinking"
        ],
        "risk_tolerance": "high",
        "typical_check_size": "$25K - $250K",
        "questions_focus": [
            "founder_background",
            "problem_validation",
            "early_traction",
            "vision",
            "market_opportunity"
        ]
    },
    
    "growth_vc": {
        "name": "Growth-Stage VC",
        "description": "Invests in Series B+ companies with proven models. Focused on scaling, market domination, and path to IPO.",
        "priorities": [
            "Revenue growth rate (100%+ YoY)",
            "Market leadership position",
            "Operational efficiency",
            "Path to profitability",
            "Team ability to scale"
        ],
        "risk_tolerance": "low",
        "typical_check_size": "$10M - $100M",
        "questions_focus": [
            "growth_metrics",
            "competitive_position",
            "scaling_strategy",
            "burn_efficiency",
            "exit_potential"
        ]
    },
    
    "institutional": {
        "name": "Conservative Institutional Investor",
        "description": "Corporate VC or institutional fund. Risk-averse, focused on defensible businesses with clear paths to profitability.",
        "priorities": [
            "Business model sustainability",
            "Competitive moat and IP",
            "Regulatory compliance",
            "Team track record",
            "Path to profitability"
        ],
        "risk_tolerance": "very_low",
        "typical_check_size": "$5M - $50M",
        "questions_focus": [
            "defensibility",
            "profitability",
            "risk_mitigation",
            "governance",
            "strategic_fit"
        ]
    },
    
    "deep_tech": {
        "name": "Deep Tech VC",
        "description": "Specializes in frontier technology: AI/ML, biotech, quantum computing, robotics. Values technical innovation, IP moats, and world-class engineering teams. Patient capital with long time horizons.",
        "priorities": [
            "Technical innovation and differentiation",
            "Intellectual property and patent portfolio",
            "R&D roadmap and timeline to commercialization",
            "Team technical depth (PhDs, publications, domain expertise)",
            "Platform potential and multiple use cases"
        ],
        "risk_tolerance": "high",
        "typical_check_size": "$2M - $20M",
        "questions_focus": [
            "technical_architecture",
            "ip_strategy",
            "research_validation",
            "team_expertise",
            "commercialization_path"
        ]
    },
    
    "impact": {
        "name": "Impact Investor",
        "description": "Invests in startups that generate measurable social or environmental impact alongside financial returns. Focused on sustainability, ESG compliance, and UN SDG alignment.",
        "priorities": [
            "Measurable social or environmental impact",
            "Alignment with UN Sustainable Development Goals",
            "ESG compliance and reporting capability",
            "Scalable impact model (impact per dollar invested)",
            "Financial sustainability alongside mission"
        ],
        "risk_tolerance": "medium",
        "typical_check_size": "$500K - $10M",
        "questions_focus": [
            "impact_measurement",
            "sustainability_model",
            "community_benefit",
            "esg_compliance",
            "mission_alignment"
        ]
    }
}

def get_persona(persona_key: str) -> dict:
    """
    Get persona configuration.
    
    Args:
        persona_key: One of 'saas', 'angel', 'growth_vc', 'institutional'
        
    Returns:
        Persona configuration dict
    """
    return INVESTOR_PERSONAS.get(persona_key, INVESTOR_PERSONAS['saas'])

def get_persona_context(persona_key: str) -> str:
    """
    Generate context string for LLM prompts about this persona.
    
    Args:
        persona_key: Persona identifier
        
    Returns:
        Formatted context string describing the persona
    """
    persona = get_persona(persona_key)
    
    context = f"""
INVESTOR PERSONA: {persona['name']}
{persona['description']}

PRIORITIES:
"""
    for priority in persona['priorities']:
        context += f"- {priority}\n"
    
    context += f"\nRISK TOLERANCE: {persona['risk_tolerance']}"
    context += f"\nTYPICAL CHECK SIZE: {persona['typical_check_size']}"
    
    return context


def get_persona_tone(persona_key: str) -> str:
    """
    Generate an investor-tone instruction for deck improvement prompts.

    Derived dynamically from the persona definition so there is a single
    source of truth (no duplicate dicts).

    Args:
        persona_key: Persona identifier

    Returns:
        A sentence describing the optimisation focus for the persona.
    """
    persona = get_persona(persona_key)
    top_priorities = ", ".join(persona["priorities"][:3]).lower()
    return (
        f"Optimise for {persona['name'].lower()}s: "
        f"emphasise {top_priorities}, and align with "
        f"{persona['risk_tolerance']} risk tolerance."
    )
