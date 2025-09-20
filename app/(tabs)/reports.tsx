import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Download, FileText } from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import Papa from 'papaparse';
import GradientBackground from '@/components/GradientBackground';
import { useAppStore } from '@/hooks/useAppStore';
import { globalStyles } from '@/constants/styles';
import { formatTime, formatDate } from '@/utils/timeUtils';

export default function ReportsScreen() {
  const { entries, getCurrentPeriod, t, settings } = useAppStore();
  const [selectedRange, setSelectedRange] = useState<'7days' | '30days' | 'rollover'>('rollover');

  const getFilteredEntries = () => {
    const now = new Date();
    let startDate: Date;

    switch (selectedRange) {
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'rollover':
        const period = getCurrentPeriod();
        startDate = new Date(period.startDate);
        break;
    }

    return entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= startDate;
    });
  };

  const filteredEntries = getFilteredEntries();
  const totalHours = filteredEntries.reduce((sum, entry) => sum + entry.totalHours, 0);
  const totalDays = filteredEntries.length;

  const createPdfHtml = () => {
    const title = t('reports');
    const rangeLabel = getRangeLabel();
    const totalDaysLabel = t('totalDays');
    const totalHoursLabel = t('totalHours');
    const averagePerDayLabel = t('averagePerDay');
    const detailsLabel = t('details');

    const entriesHtml = filteredEntries
      .map(
        (entry) => `
      <tr>
        <td>${formatDate(entry.date, settings.language === 'da' ? 'da-DK' : 'en-US')}</td>
        <td>${formatTime(entry.totalHours)}</td>
      </tr>
    `
      )
      .join('');

    return `
      <html>
        <head>
          <style>
            body { font-family: sans-serif; }
            h1, h2 { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .summary { margin-top: 20px; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <h2>${rangeLabel}</h2>
          <div class="summary">
            <p>${totalDaysLabel}: ${totalDays}</p>
            <p>${totalHoursLabel}: ${formatTime(totalHours)}</p>
            <p>${averagePerDayLabel}: ${totalDays > 0 ? formatTime(totalHours / totalDays) : '0t 0m'}</p>
          </div>
          <h2>${detailsLabel}</h2>
          <table>
            <thead>
              <tr>
                <th>${t('date')}</th>
                <th>${t('totalHours')}</th>
              </tr>
            </thead>
            <tbody>
              ${entriesHtml}
            </tbody>
          </table>
        </body>
      </html>
    `;
  };

  const handleExportPDF = async () => {
    const html = createPdfHtml();
    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: t('exportPDF') });
    } catch (error) {
      console.error('Failed to export PDF:', error);
    }
  };

  const handleExportCSV = async () => {
    const data = filteredEntries.map(entry => ({
      [t('date')]: formatDate(entry.date, settings.language === 'da' ? 'da-DK' : 'en-US'),
      [t('totalHours')]: formatTime(entry.totalHours),
    }));

    const csv = Papa.unparse(data);
    const filename = Platform.OS === 'android' ? 'report.csv' : `report.csv`;
    const uri = Print.SaveOptions.documentsDirectory + filename;

    try {
      if (Platform.OS === 'ios') {
        const { uri: fileUri } = await Print.printToFileAsync({ html: `<pre>${csv}</pre>` });
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: t('exportCSV'),
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        const { uri: fileUri } = await Print.printToFileAsync({ html: `<pre>${csv}</pre>` });
         await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: t('exportCSV'),
        });
      }
    } catch (error) {
      console.error('Failed to export CSV:', error);
    }
  };

  const getRangeLabel = () => {
    switch (selectedRange) {
      case '7days':
        return t('last7Days');
      case '30days':
        return t('last30Days');
      case 'rollover':
        return t('lastRollover');
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView style={globalStyles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={globalStyles.glassCard}>
            <Text style={globalStyles.title}>{t('reports')}</Text>
            <Text style={globalStyles.subtitle}>{getRangeLabel()}</Text>
          </View>

          <View style={globalStyles.glassCard}>
            <Text style={[globalStyles.bodyText, styles.sectionTitle]}>
              {t('selectDateRange')}
            </Text>
            
            <View style={styles.rangeButtons}>
              <TouchableOpacity
                style={[
                  globalStyles.secondaryButton,
                  selectedRange === '7days' && styles.activeRange
                ]}
                onPress={() => setSelectedRange('7days')}
              >
                <Text style={globalStyles.secondaryButtonText}>
                  {t('last7Days')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  globalStyles.secondaryButton,
                  selectedRange === '30days' && styles.activeRange
                ]}
                onPress={() => setSelectedRange('30days')}
              >
                <Text style={globalStyles.secondaryButtonText}>
                  {t('last30Days')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  globalStyles.secondaryButton,
                  selectedRange === 'rollover' && styles.activeRange
                ]}
                onPress={() => setSelectedRange('rollover')}
              >
                <Text style={globalStyles.secondaryButtonText}>
                  {t('lastRollover')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={globalStyles.glassCard}>
            <Text style={[globalStyles.bodyText, styles.sectionTitle]}>
              Oversigt
            </Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={[globalStyles.smallText, styles.statLabel]}>Arbejdsdage</Text>
                <Text style={[globalStyles.bodyText, styles.statValue]}>
                  {totalDays}
                </Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={[globalStyles.smallText, styles.statLabel]}>Total timer</Text>
                <Text style={[globalStyles.bodyText, styles.statValue]}>
                  {formatTime(totalHours)}
                </Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={[globalStyles.smallText, styles.statLabel]}>Gennemsnit/dag</Text>
                <Text style={[globalStyles.bodyText, styles.statValue]}>
                  {totalDays > 0 ? formatTime(totalHours / totalDays) : '0t 0m'}
                </Text>
              </View>
            </View>
          </View>

          <View style={globalStyles.glassCard}>
            <Text style={[globalStyles.bodyText, styles.sectionTitle]}>
              Eksporter data
            </Text>
            
            <View style={styles.exportButtons}>
              <TouchableOpacity
                style={globalStyles.primaryButton}
                onPress={handleExportPDF}
              >
                <View style={styles.exportButtonContent}>
                  <FileText size={20} color="#018d36" />
                  <Text style={globalStyles.primaryButtonText}>
                    {t('exportPDF')}
                  </Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={globalStyles.primaryButton}
                onPress={handleExportCSV}
              >
                <View style={styles.exportButtonContent}>
                  <Download size={20} color="#018d36" />
                  <Text style={globalStyles.primaryButtonText}>
                    {t('exportCSV')}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {filteredEntries.length > 0 && (
            <View style={globalStyles.glassCard}>
              <Text style={[globalStyles.bodyText, styles.sectionTitle]}>
                Detaljer
              </Text>
              
              {filteredEntries.map((entry) => (
                <View key={entry.id} style={styles.entryRow}>
                  <Text style={globalStyles.bodyText}>
                    {formatDate(entry.date, settings.language === 'da' ? 'da-DK' : 'en-US')}
                  </Text>
                  <Text style={[globalStyles.bodyText, styles.entryHours]}>
                    {formatTime(entry.totalHours)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  rangeButtons: {
    gap: 12,
  },
  activeRange: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    minHeight: 80,
  },
  statLabel: {
    textAlign: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
  exportButtons: {
    gap: 12,
  },
  exportButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  entryHours: {
    fontWeight: '600',
  },
});