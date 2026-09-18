import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import Svg, { Rect, G, Text as SvgText, Line } from 'react-native-svg';
import { StackedBarGroup } from '../../types';
import { THEME } from '../../theme/colors';
import { formatCurrency } from '../../utils/dateUtils';

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
  height = 200,
  onMonthPress,
  selectedMonthKey: propSelectedMonthKey,
  emptyMessage = 'No income data recorded in the last 12 months.',
}) => {
  // Find initial selected group (prefer current selectedMonthKey, else last group with data)
  const defaultKey =
    propSelectedMonthKey ||
    [...groups].reverse().find((g) => g.total > 0)?.key ||
    groups[groups.length - 1]?.key;

  const [selectedKey, setSelectedKey] = useState<string>(defaultKey || '');

  const activeKey = propSelectedMonthKey || selectedKey;

  const { width: windowWidth } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const chartWidth = containerWidth > 0 ? containerWidth : Math.max(260, windowWidth - 60);
  const paddingTop = 26;
  const paddingBottom = 26;
  const paddingLeft = 32;
  const paddingRight = 10;

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
  const safeMax = maxTotal * 1.2;

  const barWidth = Math.max(10, Math.min(20, (innerWidth / groups.length) * 0.6));
  const slotWidth = innerWidth / groups.length;

  const getBarX = (index: number) => {
    return paddingLeft + index * slotWidth + (slotWidth - barWidth) / 2;
  };

  const gridLevels = [0, safeMax * 0.5, safeMax];

  const formatShortValue = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
    return `${val}`;
  };

  const selectedGroup = groups.find((g) => g.key === activeKey) || groups[groups.length - 1];

  const handleBarTap = (g: StackedBarGroup) => {
    setSelectedKey(g.key);
    onMonthPress?.(g.key);
  };

  return (
    <View
      style={styles.container}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w > 0 && Math.abs(w - containerWidth) > 1) {
          setContainerWidth(w);
        }
      }}
    >
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
                stroke={THEME.bg.border}
                strokeDasharray="3, 3"
                strokeWidth={1}
              />
              <SvgText
                x={paddingLeft - 4}
                y={y + 3}
                fill={THEME.text.tertiary}
                fontSize={8.5}
                textAnchor="end"
              >
                {formatShortValue(Math.round(lvl))}
              </SvgText>
            </G>
          );
        })}

        {/* Bars */}
        {groups.map((g, index) => {
          const x = getBarX(index);
          const isSelected = activeKey === g.key;

          let currentStackY = paddingTop + innerHeight;

          return (
            <G key={`group-${index}`}>
              {/* Column selection indicator */}
              {isSelected && (
                <Rect
                  x={paddingLeft + index * slotWidth}
                  y={paddingTop - 6}
                  width={slotWidth}
                  height={innerHeight + 10}
                  fill="rgba(56, 189, 248, 0.08)"
                  rx={4}
                />
              )}

              {/* Individual total value on top of bar */}
              {g.total > 0 && (
                <SvgText
                  x={x + barWidth / 2}
                  y={paddingTop + innerHeight - (g.total / safeMax) * innerHeight - 5}
                  fill={isSelected ? THEME.text.primary : THEME.text.secondary}
                  fontSize={8}
                  fontWeight={isSelected ? 'bold' : '500'}
                  textAnchor="middle"
                >
                  {formatShortValue(g.total)}
                </SvgText>
              )}

              {/* Stacks */}
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
                    rx={sIdx === g.stacks.length - 1 ? 2 : 0}
                  />
                );
              })}

              {/* Month label below bar */}
              <SvgText
                x={x + barWidth / 2}
                y={height - 8}
                fill={isSelected ? THEME.text.primary : THEME.text.tertiary}
                fontSize={8.5}
                fontWeight={isSelected ? '600' : 'normal'}
                textAnchor="middle"
              >
                {g.label}
              </SvgText>
            </G>
          );
        })}
      </Svg>

      {/* Touch overlays for selecting months */}
      <View style={[StyleSheet.absoluteFill, { flexDirection: 'row', paddingLeft, paddingRight, top: 34 }]}>
        {groups.map((g, index) => (
          <TouchableOpacity
            key={`touch-${index}`}
            style={{ width: slotWidth, height: '100%' }}
            activeOpacity={0.6}
            onPress={() => handleBarTap(g)}
          />
        ))}
      </View>

      {/* Selected Month Individual Values Breakdown Card */}
      {selectedGroup && (
        <View style={styles.breakdownCard}>
          <View style={styles.breakdownHeader}>
            <Text style={styles.breakdownTitle}>{selectedGroup.key}</Text>
            <Text style={styles.breakdownTotal}>
              Total: {formatCurrency(selectedGroup.total)}
            </Text>
          </View>

          {selectedGroup.stacks.length === 0 ? (
            <Text style={styles.noDataBreakdown}>No income entries for this month.</Text>
          ) : (
            <View style={styles.stackValuesList}>
              {selectedGroup.stacks.map((st) => (
                <View key={st.name} style={styles.stackRow}>
                  <View style={styles.stackLeft}>
                    <View style={[styles.miniDot, { backgroundColor: st.color }]} />
                    <Text style={styles.stackName}>{st.name}</Text>
                  </View>
                  <Text style={styles.stackAmount}>
                    {formatCurrency(st.value)}
                    <Text style={styles.stackPercent}>
                      {' '}
                      ({selectedGroup.total > 0 ? Math.round((st.value / selectedGroup.total) * 100) : 0}%)
                    </Text>
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 6,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 8,
    paddingHorizontal: 8,
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 4,
  },
  legendText: {
    color: THEME.text.secondary,
    fontSize: 11,
  },
  breakdownCard: {
    width: '100%',
    backgroundColor: THEME.bg.input,
    borderWidth: 1,
    borderColor: THEME.bg.border,
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: THEME.bg.border,
    marginBottom: 8,
  },
  breakdownTitle: {
    color: THEME.text.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  breakdownTotal: {
    color: THEME.accent.income,
    fontSize: 13,
    fontWeight: '700',
  },
  noDataBreakdown: {
    color: THEME.text.tertiary,
    fontSize: 12,
    fontStyle: 'italic',
  },
  stackValuesList: {
    gap: 4,
  },
  stackRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  stackLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  stackName: {
    color: THEME.text.secondary,
    fontSize: 12,
  },
  stackAmount: {
    color: THEME.text.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  stackPercent: {
    color: THEME.text.tertiary,
    fontSize: 11,
    fontWeight: 'normal',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.bg.card,
    borderRadius: 12,
    marginVertical: 8,
    width: '100%',
  },
  emptyText: {
    color: THEME.text.tertiary,
    fontSize: 13,
  },
});
