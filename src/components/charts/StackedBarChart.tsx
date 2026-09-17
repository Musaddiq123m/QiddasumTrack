import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Svg, { Rect, G, Text as SvgText, Line } from 'react-native-svg';
import { StackedBarGroup } from '../../types';

interface StackedBarChartProps {
  groups: StackedBarGroup[];
  typeColors: { [type: string]: string };
  height?: number;
  onMonthPress?: (monthKey: string) => void;
  selectedMonthKey?: string;
  emptyMessage?: string;
}

export const StackedBarChart: React.FC<StackedBarChartProps> = ({
  groups,
  typeColors,
  height = 220,
  onMonthPress,
  selectedMonthKey,
  emptyMessage = 'No income data recorded in the last 12 months.',
}) => {
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = Math.max(300, screenWidth - 48);
  const paddingTop = 20;
  const paddingBottom = 28;
  const paddingLeft = 32;
  const paddingRight = 12;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = height - paddingTop - paddingBottom;

  const hasData = groups.some((g) => g.total > 0);
  if (!hasData) {
    return (
      <View style={[styles.emptyContainer, { height }]}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  const maxTotal = Math.max(...groups.map((g) => g.total), 1);
  const safeMax = maxTotal * 1.15;

  const barWidth = Math.max(12, Math.min(22, (innerWidth / groups.length) * 0.65));
  const slotWidth = innerWidth / groups.length;

  const getBarX = (index: number) => {
    return paddingLeft + index * slotWidth + (slotWidth - barWidth) / 2;
  };

  const gridLevels = [0, safeMax * 0.5, safeMax];

  return (
    <View style={styles.container}>
      {/* Legend header */}
      <View style={styles.legendRow}>
        {Object.entries(typeColors).map(([typeName, color]) => (
          <View key={typeName} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={styles.legendText}>{typeName}</Text>
          </View>
        ))}
      </View>

      <Svg width={chartWidth} height={height}>
        {/* Grid lines */}
        {gridLevels.map((lvl, idx) => {
          const y = paddingTop + innerHeight - (lvl / safeMax) * innerHeight;
          return (
            <G key={`grid-${idx}`}>
              <Line
                x1={paddingLeft}
                y1={y}
                x2={chartWidth - paddingRight}
                y2={y}
                stroke="#334155"
                strokeDasharray="4, 4"
                strokeWidth={1}
              />
              <SvgText x={paddingLeft - 4} y={y + 3} fill="#94A3B8" fontSize={9} textAnchor="end">
                {Math.round(lvl) >= 1000 ? `${(Math.round(lvl) / 1000).toFixed(0)}k` : Math.round(lvl)}
              </SvgText>
            </G>
          );
        })}

        {/* Bars */}
        {groups.map((g, index) => {
          const x = getBarX(index);
          const isSelected = selectedMonthKey === g.key;

          // Build stacks from bottom to top
          let currentStackY = paddingTop + innerHeight;

          return (
            <G key={`group-${index}`}>
              {/* Highlight background column if selected */}
              {isSelected && (
                <Rect
                  x={paddingLeft + index * slotWidth}
                  y={paddingTop}
                  width={slotWidth}
                  height={innerHeight}
                  fill="rgba(59, 130, 246, 0.15)"
                  rx={4}
                />
              )}

              {/* Stack segments */}
              {g.stacks.map((stack, sIdx) => {
                const segmentHeight = (stack.value / safeMax) * innerHeight;
                currentStackY -= segmentHeight;

                return (
                  <Rect
                    key={`stack-${sIdx}`}
                    x={x}
                    y={currentStackY}
                    width={barWidth}
                    height={Math.max(0, segmentHeight)}
                    fill={stack.color}
                    rx={sIdx === g.stacks.length - 1 ? 3 : 0}
                  />
                );
              })}

              {/* Month label below bar */}
              <SvgText
                x={x + barWidth / 2}
                y={height - 8}
                fill={isSelected ? '#38BDF8' : '#94A3B8'}
                fontSize={9}
                fontWeight={isSelected ? 'bold' : 'normal'}
                textAnchor="middle"
              >
                {g.label}
              </SvgText>
            </G>
          );
        })}
      </Svg>

      {/* Transparent touch overlays for clicking months to drill down */}
      {onMonthPress && (
        <View style={[StyleSheet.absoluteFill, { flexDirection: 'row', paddingLeft, paddingRight, top: 40 }]}>
          {groups.map((g, index) => (
            <TouchableOpacity
              key={`touch-${index}`}
              style={{ width: slotWidth, height: '100%' }}
              activeOpacity={0.6}
              onPress={() => onMonthPress(g.key)}
            />
          ))}
        </View>
      )}

      <Text style={styles.drillHint}>Tap a month to view that month's details</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendText: {
    color: '#94A3B8',
    fontSize: 11,
  },
  drillHint: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 4,
    fontStyle: 'italic',
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
