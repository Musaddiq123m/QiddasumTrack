import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import Svg, { Line, Circle, Path, G, Text as SvgText, Rect } from 'react-native-svg';
import { ChartDataPoint } from '../../types';
import { THEME } from '../../theme/colors';

interface LineChartProps {
  data: ChartDataPoint[];
  height?: number;
  lineColor?: string;
  fillColor?: string;
  valuePrefix?: string;
  valueSuffix?: string;
  onPointPress?: (point: ChartDataPoint, index: number) => void;
  selectedIndex?: number;
  emptyMessage?: string;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  height = 210,
  lineColor = THEME.accent.blue,
  fillColor = 'rgba(56, 189, 248, 0.08)',
  valuePrefix = '',
  valueSuffix = '',
  onPointPress,
  selectedIndex: propSelectedIndex,
  emptyMessage = 'No data available for this period',
}) => {
  const [internalSelectedIndex, setInternalSelectedIndex] = useState<number>(
    data && data.length > 0 ? data.length - 1 : 0
  );

  const activeIndex = propSelectedIndex !== undefined ? propSelectedIndex : internalSelectedIndex;

  const { width: windowWidth } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const chartWidth = containerWidth > 0 ? containerWidth : Math.max(260, windowWidth - 60);
  const paddingBottom = 32;
  const paddingTop = 36;
  const paddingHorizontal = 20;

  const innerWidth = chartWidth - paddingHorizontal * 2;
  const innerHeight = height - paddingTop - paddingBottom;

  const hasData = data && data.length > 0 && data.some((d) => d.value > 0);

  if (!data || data.length === 0 || !hasData) {
    return (
      <View style={[styles.emptyContainer, { height }]}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  const values = data.map((d) => d.value);
  const maxValue = Math.max(...values);
  const safeMax = maxValue === 0 ? 10 : maxValue * 1.2;

  const getX = (index: number) => {
    if (data.length === 1) return paddingHorizontal + innerWidth / 2;
    return paddingHorizontal + (index / (data.length - 1)) * innerWidth;
  };

  const getY = (val: number) => {
    return paddingTop + innerHeight - (val / safeMax) * innerHeight;
  };

  // Build SVG Line Path
  let pathD = `M ${getX(0)} ${getY(data[0].value)}`;
  for (let i = 1; i < data.length; i++) {
    pathD += ` L ${getX(i)} ${getY(data[i].value)}`;
  }

  // Area under path
  const areaD = `${pathD} L ${getX(data.length - 1)} ${paddingTop + innerHeight} L ${getX(0)} ${paddingTop + innerHeight} Z`;

  // Horizontal guide lines
  const gridLevels = [0, safeMax * 0.5, safeMax];

  const formatShortValue = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(val >= 10000 ? 0 : 1)}k`;
    return `${val}`;
  };

  const selectedPoint = data[activeIndex] || data[data.length - 1];

  const handlePointTap = (index: number, pt: ChartDataPoint) => {
    setInternalSelectedIndex(index);
    onPointPress?.(pt, index);
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
      {/* Active Point Callout Pill */}
      {selectedPoint && (
        <View style={styles.calloutPill}>
          <Text style={styles.calloutLabel}>{selectedPoint.label}: </Text>
          <Text style={styles.calloutValue}>
            {valuePrefix}
            {selectedPoint.value.toLocaleString()}
            {valueSuffix}
          </Text>
        </View>
      )}

      <Svg width={chartWidth} height={height}>
        {/* Horizontal Grid lines */}
        {gridLevels.map((lvl, idx) => {
          const y = getY(lvl);
          return (
            <G key={`grid-${idx}`}>
              <Line
                x1={paddingHorizontal}
                y1={y}
                x2={chartWidth - paddingHorizontal}
                y2={y}
                stroke={THEME.bg.border}
                strokeDasharray="3, 3"
                strokeWidth={1}
              />
              <SvgText
                x={paddingHorizontal}
                y={y - 4}
                fill={THEME.text.tertiary}
                fontSize={9}
                fontWeight="500"
              >
                {valuePrefix}
                {formatShortValue(Math.round(lvl))}
                {valueSuffix}
              </SvgText>
            </G>
          );
        })}

        {/* Fill Area */}
        <Path d={areaD} fill={fillColor} />

        {/* Main Smooth Line */}
        <Path
          d={pathD}
          fill="none"
          stroke={lineColor}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Points & Individual Value Labels */}
        {data.map((d, index) => {
          const x = getX(index);
          const y = getY(d.value);
          const isSelected = activeIndex === index;

          return (
            <G key={`point-${index}`}>
              {/* Individual value label above point */}
              {d.value > 0 && (
                <SvgText
                  x={x}
                  y={y - 8}
                  fill={isSelected ? THEME.text.primary : THEME.text.secondary}
                  fontSize={8.5}
                  fontWeight={isSelected ? 'bold' : '500'}
                  textAnchor="middle"
                >
                  {formatShortValue(d.value)}
                </SvgText>
              )}

              {/* Point halo if selected */}
              {isSelected && (
                <Circle
                  cx={x}
                  cy={y}
                  r={8}
                  fill="rgba(56, 189, 248, 0.2)"
                />
              )}

              {/* Main Point circle */}
              <Circle
                cx={x}
                cy={y}
                r={isSelected ? 5 : 3.5}
                fill={isSelected ? THEME.text.primary : lineColor}
                stroke={THEME.bg.card}
                strokeWidth={1.5}
              />

              {/* Bottom Date/Month Label */}
              <SvgText
                x={x}
                y={height - 10}
                fill={isSelected ? THEME.text.primary : THEME.text.tertiary}
                fontSize={9}
                fontWeight={isSelected ? '600' : 'normal'}
                textAnchor="middle"
              >
                {d.label}
              </SvgText>
            </G>
          );
        })}
      </Svg>

      {/* Interactive Touch Layer */}
      <View style={[StyleSheet.absoluteFill, { flexDirection: 'row', paddingHorizontal, top: 30 }]}>
        {data.map((d, index) => (
          <TouchableOpacity
            key={`touch-${index}`}
            style={{ flex: 1, height: '100%' }}
            activeOpacity={0.7}
            onPress={() => handlePointTap(index, d)}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 4,
  },
  calloutPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.bg.input,
    borderWidth: 1,
    borderColor: THEME.bg.border,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 6,
  },
  calloutLabel: {
    color: THEME.text.secondary,
    fontSize: 12,
    fontWeight: '500',
  },
  calloutValue: {
    color: THEME.text.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.bg.card,
    borderRadius: 12,
    marginVertical: 8,
  },
  emptyText: {
    color: THEME.text.tertiary,
    fontSize: 13,
  },
});
