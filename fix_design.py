import re

# Read the file
with open(r'e:\Users\Judd\Downloads\path-system\client\src\components\CollaborativeComments.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove emoji from header
content = content.replace('''  .cc-header span::before {
    content: "💬";
    font-size: 16px;
  }

''', '')

# Replace the entire composer input styling
old_pattern = r'  \.cc-composer-input-group \{[\s\S]*?  \}(?=\n\n  \.cc-file-list)'
new_input_group = '''  .cc-composer-input-group {
    display: flex;
    gap: 6px;
    align-items: center;
    background: #f5f0fb;
    border-radius: 8px;
    padding: 0 12px;
    border: 1px solid #e0d5ef;
    transition: all 0.2s;
  }

  .cc-composer-input-group:focus-within {
    border-color: #7c3aed;
    background: #fafbff;
  }

  .cc-file-picker-btn {
    padding: 8px 4px;
    border: none;
    background: transparent;
    color: #9a8ba6;
    font-size: 18px;
    cursor: pointer;
    transition: all 0.2s;
    line-height: 1;
    font-weight: 600;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .cc-file-picker-btn:hover:not(:disabled) {
    color: #7c3aed;
    transform: scale(1.1);
  }

  .cc-file-picker-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .cc-composer textarea {
    flex: 1;
    padding: 10px 0;
    border: none;
    background: transparent;
    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 13px;
    color: #5d4867;
    resize: none;
    outline: none;
    transition: all 0.2s;
  }

  .cc-composer textarea::placeholder {
    color: #b0a0bd;
  }

  .cc-composer textarea:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }'''

# More flexible replacement
content = re.sub(r'  \.cc-composer-input-group \{[\s\S]*?  \}\s*\.cc-file-picker-btn \{[\s\S]*?  \}\s*\.cc-composer textarea \{[\s\S]*?  \}\s*\.cc-composer textarea::placeholder \{[\s\S]*?  \}\s*\.cc-composer textarea:disabled \{[\s\S]*?  \}', new_input_group, content)

# Write back
with open(r'e:\Users\Judd\Downloads\path-system\client\src\components\CollaborativeComments.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ Design updated successfully!")
