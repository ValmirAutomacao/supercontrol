import re

with open('PRD_GF_GAS_CONTROL.md', 'r') as f:
    content = f.read()

# Replacements
content = content.replace('Claude API (Anthropic)', 'OpenAI API')
content = content.replace('Claude API', 'OpenAI API')
content = content.replace('Claude Code', 'Gemini/Cursor (IA de Código)')
content = content.replace('Claude', 'OpenAI GPT')
content = content.replace('claude-sonnet-4-20250514', 'gpt-4o')
content = content.replace('Anthropic', 'OpenAI')
content = content.replace('CLAUDE_MODEL', 'OPENAI_MODEL')
content = content.replace('ANTHROPIC_API_KEY', 'OPENAI_API_KEY')
content = content.replace('anthropic==0.40.0', 'openai>=1.0.0')

with open('PRD_GF_GAS_CONTROL.md', 'w') as f:
    f.write(content)

print("Replacement done.")
