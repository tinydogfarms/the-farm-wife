import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { parseNaturalLanguage } from '../lib/utils/nlpParser';
import type { TransactionInput } from '../lib/types';
import { PROMPT_EXAMPLES } from '../lib/constants';

interface NaturalLanguageInputProps {
  onParsed: (data: Partial<TransactionInput>) => void;
}


export default function NaturalLanguageInput({ onParsed }: NaturalLanguageInputProps) {
  const [promptInput, setPromptInput] = useState('');
  const [showExamples, setShowExamples] = useState(false);

  const handlePromptSubmit = () => {
    if (!promptInput.trim()) return;
    
    const parsed = parseNaturalLanguage(promptInput);
    onParsed(parsed);
    
    setPromptInput('');
    setShowExamples(false);
  };

  return (
    <View style={styles.formCard}>
      <View style={styles.promptHeader}>
        <Text style={styles.formTitle}>Quick Entry</Text>
        <TouchableOpacity
          onPress={() => setShowExamples(!showExamples)}
          style={styles.examplesButton}
        >
          <Text style={styles.examplesButtonText}>
            {showExamples ? 'Hide Examples' : 'Show Examples'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.label}>Describe your transaction naturally</Text>
      <TextInput
        style={styles.textArea}
        value={promptInput}
        onChangeText={setPromptInput}
        placeholder="e.g., We bought a ton of feed on February 1 for $700"
        multiline
        numberOfLines={3}
      />
      
      <TouchableOpacity style={styles.parseButton} onPress={handlePromptSubmit}>
        <Text style={styles.parseButtonText}>Parse & Fill Form</Text>
      </TouchableOpacity>
      
      {showExamples && (
        <View style={styles.examplesContainer}>
          <Text style={styles.examplesTitle}>Try these examples:</Text>
          {PROMPT_EXAMPLES.map((example, index) => (
            <TouchableOpacity
              key={index}
              style={styles.exampleButton}
              onPress={() => setPromptInput(example)}
            >
              <Text style={styles.exampleText}>"{example}"</Text>
            </TouchableOpacity>
          ))}
          <Text style={styles.examplesNote}>
            The AI will automatically detect dates, amounts, and categories!
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  formCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  promptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  examplesButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  examplesButtonText: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '500',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  parseButton: {
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  parseButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  examplesContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  exampleButton: {
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  exampleText: {
    fontSize: 13,
    color: '#374151',
  },
  examplesNote: {
    fontSize: 11,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 8,
  },
});