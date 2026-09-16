import { Document, Page, StyleSheet, Text, View, renderToBuffer } from '@react-pdf/renderer';
import type { ReactNode } from 'react';
import type { CountItem, DailyItem, InspectorItem, ReportData } from '@/lib/report-data';

const COLORS = {
  ink: '#17212b',
  muted: '#64748b',
  border: '#d9e1e8',
  surface: '#f7f9fb',
  accent: '#0f6a5c',
  accentPale: '#e8f3f0',
};

const styles = StyleSheet.create({
  page: { paddingTop: 54, paddingBottom: 46, paddingHorizontal: 42, fontFamily: 'Helvetica', fontSize: 9, color: COLORS.ink },
  header: { position: 'absolute', top: 20, left: 42, right: 42, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerBrand: { fontSize: 8, color: COLORS.accent, fontFamily: 'Helvetica-Bold', letterSpacing: 0.6 },
  headerLabel: { fontSize: 7.5, color: COLORS.muted },
  footer: { position: 'absolute', bottom: 18, left: 42, right: 42, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 0.5, borderTopColor: COLORS.border, paddingTop: 7, color: COLORS.muted, fontSize: 7.5 },
  titleBlock: { borderLeftWidth: 4, borderLeftColor: COLORS.accent, paddingLeft: 13, marginBottom: 18 },
  title: { fontFamily: 'Helvetica-Bold', fontSize: 22, lineHeight: 1.15, color: COLORS.ink },
  subtitle: { marginTop: 5, fontSize: 10, color: COLORS.muted },
  generatedAt: { marginTop: 3, fontSize: 8, color: COLORS.muted },
  metricGrid: { flexDirection: 'row', marginBottom: 18, borderWidth: 0.75, borderColor: COLORS.border, borderRadius: 3 },
  metric: { width: '25%', paddingVertical: 11, paddingHorizontal: 10, borderRightWidth: 0.75, borderRightColor: COLORS.border },
  metricLast: { borderRightWidth: 0 },
  metricLabel: { color: COLORS.muted, fontSize: 7.5, lineHeight: 1.25 },
  metricValue: { marginTop: 5, fontFamily: 'Helvetica-Bold', fontSize: 18, color: COLORS.ink },
  section: { marginBottom: 17 },
  sectionHeading: { fontFamily: 'Helvetica-Bold', fontSize: 13, color: COLORS.ink },
  sectionCaption: { marginTop: 2, marginBottom: 7, color: COLORS.muted, fontSize: 8 },
  table: { borderWidth: 0.75, borderColor: COLORS.border, borderRadius: 3 },
  tableHeader: { flexDirection: 'row', backgroundColor: COLORS.surface, borderBottomWidth: 0.75, borderBottomColor: COLORS.border, paddingVertical: 6, paddingHorizontal: 8 },
  tableHeaderText: { fontFamily: 'Helvetica-Bold', color: COLORS.muted, fontSize: 7.5 },
  tableRow: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  tableRowLast: { borderBottomWidth: 0 },
  tableCell: { fontSize: 8.5, lineHeight: 1.25 },
  countCell: { textAlign: 'right', fontFamily: 'Helvetica-Bold' },
  trendDate: { width: '29%', color: COLORS.muted },
  trendBarArea: { width: '57%', paddingVertical: 2 },
  trendTrack: { height: 4, backgroundColor: COLORS.accentPale, borderRadius: 2, overflow: 'hidden' },
  trendBar: { height: 4, backgroundColor: COLORS.accent, borderRadius: 2 },
  trendCount: { width: '14%', textAlign: 'right', fontFamily: 'Helvetica-Bold' },
  empty: { padding: 12, color: COLORS.muted, textAlign: 'center' },
});

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Karachi',
  }).format(new Date(`${dateString}T00:00:00`));
}

function formatRange(from: string, to: string) {
  const start = formatDate(from);
  const end = formatDate(to);
  return from === to ? start : `${start} to ${end}`;
}

function formatGeneratedAt(date: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Karachi', hour12: false,
  }).format(date) + ' PKT';
}

function Section({ title, caption, children }: { title: string; caption: string; children: ReactNode }) {
  return <View style={styles.section} wrap={false}>
    <Text style={styles.sectionHeading}>{title}</Text>
    <Text style={styles.sectionCaption}>{caption}</Text>
    {children}
  </View>;
}

function CountTable({ items, label }: { items: CountItem[]; label: string }) {
  if (items.length === 0) return <View style={styles.table}><Text style={styles.empty}>No challans in this date range.</Text></View>;

  return <View style={styles.table}>
    <View style={styles.tableHeader} fixed>
      <Text style={[styles.tableHeaderText, { width: '84%' }]}>{label}</Text>
      <Text style={[styles.tableHeaderText, { width: '16%', textAlign: 'right' }]}>Challans</Text>
    </View>
    {items.map((item, index) => (
      <View key={item.name} style={[styles.tableRow, index === items.length - 1 ? styles.tableRowLast : {}]} wrap={false}>
        <Text style={[styles.tableCell, { width: '84%' }]}>{item.name}</Text>
        <Text style={[styles.tableCell, styles.countCell, { width: '16%' }]}>{item.count.toLocaleString('en-GB')}</Text>
      </View>
    ))}
  </View>;
}

function TrendTable({ items }: { items: DailyItem[] }) {
  const maximum = Math.max(...items.map((item) => item.count), 1);
  return <View style={styles.table}>
    <View style={styles.tableHeader} fixed>
      <Text style={[styles.tableHeaderText, { width: '29%' }]}>Date</Text>
      <Text style={[styles.tableHeaderText, { width: '57%' }]}>Volume</Text>
      <Text style={[styles.tableHeaderText, { width: '14%', textAlign: 'right' }]}>Count</Text>
    </View>
    {items.map((item, index) => (
      <View key={item.date} style={[styles.tableRow, index === items.length - 1 ? styles.tableRowLast : {}]} wrap={false}>
        <Text style={[styles.tableCell, styles.trendDate]}>{formatDate(item.date)}</Text>
        <View style={styles.trendBarArea}>
          <View style={styles.trendTrack}>
            <View style={[styles.trendBar, { width: `${(item.count / maximum) * 100}%` }]} />
          </View>
        </View>
        <Text style={[styles.tableCell, styles.trendCount]}>{item.count.toLocaleString('en-GB')}</Text>
      </View>
    ))}
  </View>;
}

function InspectorTable({ items }: { items: InspectorItem[] }) {
  if (items.length === 0) return <View style={styles.table}><Text style={styles.empty}>No inspectors recorded in this date range.</Text></View>;

  return <View style={styles.table}>
    <View style={styles.tableHeader} fixed>
      <Text style={[styles.tableHeaderText, { width: '10%' }]}>Rank</Text>
      <Text style={[styles.tableHeaderText, { width: '43%' }]}>Inspector</Text>
      <Text style={[styles.tableHeaderText, { width: '27%' }]}>Staff ID</Text>
      <Text style={[styles.tableHeaderText, { width: '20%', textAlign: 'right' }]}>Challans</Text>
    </View>
    {items.map((item, index) => (
      <View key={`${item.staffId}-${item.name}`} style={[styles.tableRow, index === items.length - 1 ? styles.tableRowLast : {}]} wrap={false}>
        <Text style={[styles.tableCell, { width: '10%', color: COLORS.muted }]}>{item.rank}</Text>
        <Text style={[styles.tableCell, { width: '43%', fontFamily: 'Helvetica-Bold' }]}>{item.name}</Text>
        <Text style={[styles.tableCell, { width: '27%', color: COLORS.muted }]}>{item.staffId}</Text>
        <Text style={[styles.tableCell, styles.countCell, { width: '20%' }]}>{item.count.toLocaleString('en-GB')}</Text>
      </View>
    ))}
  </View>;
}

export async function renderReportPdf(data: ReportData, generatedAt = new Date()) {
  const townsRepresented = data.townData.filter((item) => item.count > 0).length;
  const report = (
    <Document title="Suthra Punjab e-Challan Management Report" author="Suthra Punjab">
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <Text style={styles.headerBrand}>SUTHRA PUNJAB</Text>
          <Text style={styles.headerLabel}>e-Challan management report</Text>
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.title}>Management report</Text>
          <Text style={styles.subtitle}>Coverage: {formatRange(data.from, data.to)}</Text>
          <Text style={styles.generatedAt}>Generated: {formatGeneratedAt(generatedAt)}</Text>
        </View>

        <View style={styles.metricGrid} wrap={false}>
          <View style={styles.metric}><Text style={styles.metricLabel}>TOTAL CHALLANS</Text><Text style={styles.metricValue}>{data.totalCount.toLocaleString('en-GB')}</Text></View>
          <View style={styles.metric}><Text style={styles.metricLabel}>CATEGORIES RECORDED</Text><Text style={styles.metricValue}>{data.categoryData.length}</Text></View>
          <View style={styles.metric}><Text style={styles.metricLabel}>TOWNS REPRESENTED</Text><Text style={styles.metricValue}>{townsRepresented}</Text></View>
          <View style={[styles.metric, styles.metricLast]}><Text style={styles.metricLabel}>INSPECTORS ACTIVE</Text><Text style={styles.metricValue}>{data.inspectorData.length}</Text></View>
        </View>

        <Section title="Violation category breakdown" caption="Challans by recorded category">
          <CountTable items={data.categoryData} label="Violation category" />
        </Section>
        <Section title="Town breakdown" caption="Town or tehsil recorded on each challan">
          <CountTable items={data.townData} label="Town" />
        </Section>
        <Section title="Daily trend" caption="Challans recorded each day">
          <TrendTable items={data.dailyData} />
        </Section>
        <Section title="Top inspectors" caption="Highest challan volume in this period">
          <InspectorTable items={data.inspectorData} />
        </Section>

        <View style={styles.footer} fixed>
          <Text>Confidential administrative report</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );

  return renderToBuffer(report);
}
