import re

# Read the file
with open(r'e:\Users\Judd\Downloads\path-system\client\src\components\CollaborativeComments.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# New improved styles
new_styles = '''<style>{`
  .cc-container {
    margin-top: 24px;
    padding: 0;
    border: 1px solid #e5dff3;
    border-radius: 12px;
    background: linear-gradient(135deg, #fdfbff 0%, #faf8ff 100%);
    display: flex;
    flex-direction: column;
    height: 500px;
    box-shadow: 0 4px 12px rgba(124, 58, 237, 0.08);
    overflow: hidden;
  }

  .cc-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    background: linear-gradient(135deg, #f0ebfa 0%, #f5f0fb 100%);
    border-bottom: 1px solid #e9ddfb;
  }

  .cc-header span {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    font-weight: 700;
    color: #4a3a55;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .cc-header span::before {
    content: "💬";
    font-size: 16px;
  }

  .cc-header em {
    font-style: normal;
    padding: 4px 10px;
    background: #fff;
    border: 1px solid #e5dff3;
    border-radius: 6px;
    color: #8d7e98;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.05em;
  }

  .cc-loading,
  .cc-messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px;
    display: grid;
    gap: 12px;
    align-content: start;
  }

  .cc-loading {
    align-items: center;
    justify-content: center;
  }

  .cc-messages::-webkit-scrollbar {
    width: 6px;
  }

  .cc-messages::-webkit-scrollbar-track {
    background: transparent;
  }

  .cc-messages::-webkit-scrollbar-thumb {
    background: #d4c8e3;
    border-radius: 3px;
  }

  .cc-messages::-webkit-scrollbar-thumb:hover {
    background: #c5b7d5;
  }

  .cc-empty {
    padding: 40px 20px;
    text-align: center;
    color: #b0a0bd;
    font-size: 13px;
  }

  .cc-message {
    padding: 12px;
    border-radius: 8px;
    background: #fff;
    border: 1px solid #e9ddfb;
    font-size: 12px;
    transition: all 0.2s ease;
  }

  .cc-message:hover {
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.06);
    border-color: #dfc8f0;
    background: #fafafe;
  }

  .cc-message.cc-own {
    background: linear-gradient(135deg, #eef6fb 0%, #f0f9ff 100%);
    border-color: #d4e4f0;
  }

  .cc-message-header {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 8px;
    align-items: center;
  }

  .cc-message-header strong {
    font-size: 12px;
    font-weight: 700;
    color: #3a2a45;
  }

  .cc-message-header small {
    font-size: 10px;
    color: #9a8ba6;
  }

  .cc-message-content {
    color: #5d4867;
    line-height: 1.5;
    word-wrap: break-word;
    white-space: pre-wrap;
    margin-bottom: 8px;
  }

  .cc-message-files {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin: 8px 0;
    padding: 8px 10px;
    background: #f8f5fc;
    border-radius: 6px;
    border: 1px solid #e9ddfb;
  }

  .cc-file-link {
    font-size: 11px;
    color: #7c3aed;
    text-decoration: none;
    word-break: break-all;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 500;
  }

  .cc-file-link:hover {
    color: #5b21b6;
  }

  .cc-message-actions {
    display: flex;
    gap: 6px;
    margin-top: 8px;
  }

  .cc-delete-btn, .cc-reply-btn {
    padding: 4px 8px;
    border: 1px solid #e0d5ef;
    border-radius: 4px;
    background: #f5f0fb;
    color: #8d7e98;
    font-size: 10px;
    font-weight: 600;
    cursor: pointer;
    opacity: 0;
    transition: all 0.2s;
  }

  .cc-message:hover .cc-delete-btn,
  .cc-message:hover .cc-reply-btn {
    opacity: 1;
  }

  .cc-delete-btn:hover, .cc-reply-btn:hover {
    background: #e9ddfb;
    color: #5d4867;
    border-color: #dfc8f0;
  }

  .cc-replies {
    margin-top: 10px;
    padding-left: 14px;
    border-left: 2px solid #e9ddfb;
  }

  .cc-reply-context {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: #fffbeb;
    border: 1px solid #fcdab7;
    border-radius: 6px;
    margin: 0 20px 12px 20px;
    font-size: 11px;
    color: #92400e;
  }

  .cc-reply-context button {
    padding: 3px 8px;
    border: 1px solid #fbbf24;
    border-radius: 4px;
    background: #fef3c7;
    color: #92400e;
    font-size: 10px;
    cursor: pointer;
    transition: all 0.2s;
    font-weight: 600;
  }

  .cc-reply-context button:hover {
    background: #fbbf24;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .cc-typing {
    padding: 6px 20px;
    font-size: 11px;
    color: #9a88a6;
    font-style: italic;
  }

  .cc-composer {
    margin: 12px 20px 20px 20px;
    padding-top: 12px;
    border-top: 1px solid #e9ddfb;
    display: grid;
    gap: 8px;
  }

  .cc-composer-input-group {
    display: flex;
    gap: 8px;
    align-items: flex-start;
  }

  .cc-composer textarea {
    flex: 1;
    padding: 10px 12px;
    border: 1px solid #e0d5ef;
    border-radius: 8px;
    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 12px;
    color: #5d4867;
    resize: none;
    outline: none;
    transition: all 0.2s;
    background: #fff;
  }

  .cc-composer textarea::placeholder {
    color: #b0a0bd;
  }

  .cc-composer textarea:focus {
    border-color: #7c3aed;
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
    background: #fafbff;
  }

  .cc-composer textarea:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .cc-file-picker-btn {
    padding: 10px 12px;
    border: 1px solid #7c3aed;
    border-radius: 8px;
    background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
    color: #fff;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.2s;
    line-height: 1;
    font-weight: 600;
    flex-shrink: 0;
    box-shadow: 0 2px 4px rgba(124, 58, 237, 0.2);
  }

  .cc-file-picker-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #6d28d9 0%, #5b21b6 100%);
    box-shadow: 0 4px 8px rgba(124, 58, 237, 0.3);
    transform: translateY(-1px);
  }

  .cc-file-picker-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .cc-file-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px;
    background: #f8f5fc;
    border-radius: 6px;
    border: 1px solid #e9ddfb;
  }

  .cc-file-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 8px;
    background: #fff;
    border-radius: 4px;
    border: 1px solid #e0d5ef;
    font-size: 11px;
    color: #5d4867;
    transition: all 0.2s;
  }

  .cc-file-item:hover {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    border-color: #dfc8f0;
  }

  .cc-file-item button {
    padding: 2px 4px;
    border: none;
    background: transparent;
    color: #9a8ba6;
    font-size: 10px;
    cursor: pointer;
    transition: color 0.2s;
    font-weight: 600;
  }

  .cc-file-item button:hover {
    color: #7c3aed;
  }

  .cc-composer-actions {
    display: flex;
    gap: 8px;
  }

  .cc-composer button {
    padding: 8px 14px;
    border: 1px solid #d9cbe6;
    border-radius: 6px;
    background: #fff;
    color: #5d4867;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .cc-composer button:hover:not(:disabled) {
    border-color: #7c3aed;
    background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
    color: #fff;
    box-shadow: 0 2px 6px rgba(124, 58, 237, 0.3);
    transform: translateY(-1px);
  }

  .cc-composer button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .cc-error {
    margin-top: 8px;
    padding: 10px 12px;
    border-radius: 6px;
    background: #fff9f8;
    border: 1px solid #f5d1cc;
    color: #b55e51;
    font-size: 11px;
    margin-left: 20px;
    margin-right: 20px;
  }
`}</style>'''

# Find and replace
pattern = r'<style>\{\`[\s\S]*?\`\}</style>'
new_content = re.sub(pattern, new_styles, content, flags=re.DOTALL)

# Write back
with open(r'e:\Users\Judd\Downloads\path-system\client\src\components\CollaborativeComments.jsx', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("✓ Styles updated successfully!")
