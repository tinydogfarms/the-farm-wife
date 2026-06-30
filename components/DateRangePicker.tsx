import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Alert } from 'react-native';
import Dropdown from './Dropdown';

export interface DateRange {
  startDate?: string;
  endDate?: string;
  label: string;
}

interface DateRangePickerProps {
  onDateRangeSelect: (dateRange: DateRange | null) => void;
  transactions: Array<{ date: string }>;
  inline?: boolean;
}

export default function DateRangePicker({ onDateRangeSelect, transactions, inline = false }: DateRangePickerProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRange, setSelectedRange] = useState<DateRange | null>(null);
  const [customStartYear, setCustomStartYear] = useState<string>('');
  const [customEndYear, setCustomEndYear] = useState<string>('');

  // Get available years from transactions
  const getAvailableYears = (): number[] => {
    const years = new Set<number>();
    transactions.forEach(t => {
      const year = new Date(t.date).getFullYear();
      years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a); // Most recent first
  };

  const availableYears = getAvailableYears();
  const currentYear = new Date().getFullYear();

  // Predefined date ranges
  const getPredefinedRanges = (): DateRange[] => {
    const ranges: DateRange[] = [
      { label: 'All Time', startDate: undefined, endDate: undefined },
      { 
        label: 'Current Year', 
        startDate: `${currentYear}-01-01`, 
        endDate: `${currentYear}-12-31` 
      },
      { 
        label: 'Last Year', 
        startDate: `${currentYear - 1}-01-01`, 
        endDate: `${currentYear - 1}-12-31` 
      }
    ];

    // Add individual years that have transactions
    availableYears.forEach(year => {
      if (year !== currentYear && year !== currentYear - 1) {
        ranges.push({
          label: `${year}`,
          startDate: `${year}-01-01`,
          endDate: `${year}-12-31`
        });
      }
    });

    return ranges;
  };

  const handleRangeSelect = (range: DateRange) => {
    setSelectedRange(range);
    onDateRangeSelect(range);
    if (!inline) {
      setModalVisible(false);
    }
  };

  const handleCustomRange = () => {
    if (!customStartYear || !customEndYear) {
      Alert.alert('Invalid Range', 'Please select both start and end years.');
      return;
    }

    const startYear = parseInt(customStartYear);
    const endYear = parseInt(customEndYear);

    if (startYear > endYear) {
      Alert.alert('Invalid Range', 'Start year cannot be after end year.');
      return;
    }

    const customRange: DateRange = {
      label: startYear === endYear ? `${startYear}` : `${startYear} - ${endYear}`,
      startDate: `${startYear}-01-01`,
      endDate: `${endYear}-12-31`
    };

    handleRangeSelect(customRange);
  };

  const resetToAllTime = () => {
    const allTimeRange: DateRange = { label: 'All Time', startDate: undefined, endDate: undefined };
    setSelectedRange(allTimeRange);
    onDateRangeSelect(allTimeRange);
  };

  const yearOptions = availableYears.map(year => year.toString());

  const renderContent = () => (
    <View style={styles.modalContent}>
      <Text style={styles.sectionTitle}>Quick Select</Text>
      {getPredefinedRanges().map((range, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.rangeOption,
            selectedRange?.label === range.label && styles.selectedRange
          ]}
          onPress={() => handleRangeSelect(range)}
        >
          <Text style={[
            styles.rangeText,
            selectedRange?.label === range.label && styles.selectedRangeText
          ]}>
            {range.label}
          </Text>
        </TouchableOpacity>
      ))}

      {yearOptions.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Custom Year Range</Text>
          <View style={styles.customRangeContainer}>
            <View style={styles.dropdownContainer}>
              <Dropdown
                label="Start Year"
                options={yearOptions}
                value={customStartYear}
                onSelect={setCustomStartYear}
                placeholder="Start"
              />
            </View>
            <View style={styles.dropdownContainer}>
              <Dropdown
                label="End Year"
                options={yearOptions}
                value={customEndYear}
                onSelect={setCustomEndYear}
                placeholder="End"
              />
            </View>
          </View>
          <TouchableOpacity
            onPress={handleCustomRange}
            style={styles.applyButton}
          >
            <Text style={styles.applyButtonText}>Apply Custom Range</Text>
          </TouchableOpacity>
        </>
      )}

      {selectedRange && (
        <TouchableOpacity
          onPress={resetToAllTime}
          style={[styles.applyButton, styles.resetButton]}
        >
          <Text style={[styles.applyButtonText, styles.resetButtonText]}>Reset to All Time</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (inline) {
    return renderContent();
  }

  return (
    <View>
      <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.triggerButton}>
        <Text style={styles.triggerText}>
          {selectedRange ? `Export: ${selectedRange.label}` : 'Select Date Range'}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Export Date Range</Text>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
          {renderContent()}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  triggerButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#3b82f6',
    borderRadius: 6,
    minWidth: 140,
  },
  triggerText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontSize: 18,
    color: '#6b7280',
  },
  modalContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#374151',
  },
  rangeOption: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  selectedRange: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  rangeText: {
    fontSize: 14,
    color: '#374151',
  },
  selectedRangeText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  customRangeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dropdownContainer: {
    flex: 1,
  },
  applyButton: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 8,
  },
  applyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  resetButton: {
    backgroundColor: '#6b7280',
    marginTop: 16,
  },
  resetButtonText: {
    color: 'white',
  },
});