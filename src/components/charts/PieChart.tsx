import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import { PieSlice } from '../../types';
import { formatCurrency } from '../../utils/dateUtils';
import { THEME } from '../../theme/colors';

interface PieChartProps {
  slices: PieSlice[];
  total: number;
  size?: number;
  emptyMessage?: string;
}

export const PieChart: React.FC<PieChartProps> = ({
  slices,
  total,
  size = 200,
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
  const innerRadius = radius * 0.62;
  const cx = radius;
  const cy = radius;

  let currentAngle = -Math.PI / 2;

  const paths = slices.map((slice, idx) => {
    const sliceAngle = (slice.value / total) * (2 * Math.PI);
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    currentAngle = endAngle;

    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);

    const ix1 = cx + innerRadius * Math.cos(endAngle);
    const iy1 = cy + innerRadius * Math.sin(endAngle);
    const ix2 = cx + innerRadius * Math.cos(startAngle);
    const iy2 = cy + innerRadius * Math.sin(startAngle);

    const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;

    const sliceColor = slice.color || THEME.chartPalette[idx % THEME.chartPalette.length];

    if (sliceAngle >= 2 * Math.PI - 0.001) {
      return {
        path: `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx} ${cy + radius} A ${radius} ${radius} 0 1 1 ${cx} ${cy - radius} Z`,
        color: sliceColor,
      };
    }

    const pathData = [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `L ${ix1} ${iy1}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${ix2} ${iy2}`,
      'Z',
    ].join(' ');

    return { path: pathData, color: sliceColor };
  });

  return (
    <View style={styles.container}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size}>
          <G>
            {paths.map((p, idx) => (
              <Path
                key={`slice-${idx}`}
                d={p.path}
                fill={p.color}
                stroke={THEME.bg.card}
                strokeWidth={2}
              />
            ))}
          </G>
        </Svg>

        <View style={styles.centerLabel}>
          <Text style={styles.centerSub}>Total</Text>
          <Text style={styles.centerValue} numberOfLines={1}>
            {formatCurrency(total)}
          </Text>
        </View>
      </View>

      <View style={styles.legendContainer}>
        {slices.map((slice, idx) => {
          const color = slice.color || THEME.chartPalette[idx % THEME.chartPalette.length];
          return (
            <View key={`legend-${idx}`} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: color }]} />
              <Text style={styles.legendName} numberOfLines={1}>
                {slice.label}
              </Text>
              <Text style={styles.legendPercent}>{slice.percentage}%</Text>
              <Text style={styles.legendAmount}>{formatCurrency(slice.value)}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  centerLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 110,
  },
  centerSub: {
    color: THEME.text.tertiary,
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  centerValue: {
    color: THEME.text.primary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
  },
  legendContainer: {
    width: '100%',
    marginTop: 16,
    paddingHorizontal: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: THEME.bg.border,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  legendName: {
    color: THEME.text.primary,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  legendPercent: {
    color: THEME.text.secondary,
    fontSize: 12,
    marginRight: 10,
  },
  legendAmount: {
    color: THEME.text.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.bg.card,
    borderRadius: 12,
    marginVertical: 4,
    width: '100%',
  },
  emptyText: {
    color: THEME.text.tertiary,
    fontSize: 13,
  },
});
