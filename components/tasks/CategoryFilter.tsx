import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import type { TaskCategory } from '../../lib/types';
import { TASK_CATEGORIES } from '../../lib/constants';
import { COLORS, BORDER_RADIUS, SPACING, FONT_SIZES, FONT_WEIGHTS } from '../../lib/constants/theme';

interface CategoryFilterProps {
  selected: TaskCategory | 'all';
  onSelect: (category: TaskCategory | 'all') => void;
}

export default function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity
        style={[styles.chip, selected === 'all' && styles.chipActive]}
        onPress={() => onSelect('all')}
      >
        <Text style={[styles.chipText, selected === 'all' && styles.chipTextActive]}>All</Text>
      </TouchableOpacity>
      {TASK_CATEGORIES.map(category => {
        const isActive = selected === category.key;
        return (
          <TouchableOpacity
            key={category.key}
            style={[styles.chip, isActive && { backgroundColor: category.color, borderColor: category.color }]}
            onPress={() => onSelect(category.key)}
          >
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{category.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  content: {
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  chip: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    backgroundColor: COLORS.surface,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium as any,
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: 'white',
  },
});
