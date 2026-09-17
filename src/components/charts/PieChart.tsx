import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, G, Circle } from 'react-native-svg';
import { PieSlice } from '../../types';
import { formatCurrency } from '../../utils/dateUtils';

interface PieChartProps {
  slices: PieSlice[];
  total: number;
  size?: number;
  emptyMessage?: string;
}

export const PieChart: React.FC<PieChartProps> = ({
  slices,
  total,
  size = 220,
  emptyMessage = 'No income recorded for this month.',
}) => {
  if (!slices || slices.length === 0 || total === 0) {
    return (
      <View style={[styles.emptyContainer, { height: size }]}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  const radius = size / 2;
  const innerRadius = radius * 0.58;
  const cx = radius;
  const cy = radius;

  // Compute SVG arc paths
  let currentAngle = -Math.PI / 2; // start from top (12 o'clock)

  const paths = slices.map((slice) => {
    const sliceAngle = (slice.value / total) * (2 * Math.PI);
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    currentAngle = endAngle;

    // Outer arc points
    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);

    // Inner arc points
    const ix1 = cx + innerRadius * Math.cos(endAngle);
    const iy1 = cy + innerRadius * Math.sin(endAngle);
    const ix2 = cx + innerRadius * Math.cos(startAngle);
    const iy2 = cy + innerRadius * Math.sin(startAngle);

    const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;

    // If slice takes up almost the full circle (>= 99.9%)
    if (sliceAngle >= 2 * Math.PI - 0.001) {
      return {
        path: `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx} ${cy + radius} A ${radius} ${radius} 0 1 1 ${cx} ${cy - radius} Z`,
        color: slice.color,
      };
    }

    const pathData = [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `L ${ix1} ${iy1}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${ix2} ${iy2}`,
      'Z',
    ].join(' ');

    return { path: pathData, color: slice.color };
  });

  return (
    <View style={styles.container}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size}>
          <G>
            {paths.map((p, idx) => (
              <Path key={`slice-${idx}`} d={p.path} fill={p.color} stroke="#0F172A" strokeWidth={2} />
            ))}
          </G>
        </Svg>

        {/* Center label inside donut */}
        <View style={styles.centerLabel}>
          <Text style={styles.centerSub}>Total Income</Text>
          <Text style={styles.centerValue} numberOfLines={1}>
            {formatCurrency(total)}
          </Text>
        </View>
      </View>

      {/* Legend list */}
      <View style={styles.legendContainer}>
        {slices.map((slice, idx) => (
          <View key={`legend-${idx}`} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: slice.color }]} />
            <Text style={styles.legendName} numberOfLines={1}>
              {slice.label}
            </Text>
            <Text style={styles.legendPercent}>{slice.percentage}%</Text>
            <Text style={styles.legendAmount}>{formatCurrency(slice.value)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  centerLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
  },
  centerSub: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  centerValue: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 2,
    textAlign: 'center',
  },
  legendContainer: {
    width: '100%',
    marginTop: 20,
    paddingHorizontal: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendName: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  legendPercent: {
    color: '#94A3B8',
    fontSize: 12,
    marginRight: 12,
  },
  legendAmount: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    marginVertical: 8,
    width: '100%',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
    fontStyle: 'italic',
  },
});
